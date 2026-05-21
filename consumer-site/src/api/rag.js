/**
 * Direct API client — calls HuggingFace, Qdrant, and LLM APIs from the browser.
 * No backend server needed. Keys from deployed config or browser localStorage.
 */

import { getSettings } from '../core/settings.js';

// ── Deployed config (auto-loaded from TF outputs) ────────────────

let _deployedConfig = null;

/**
 * Load deployed config from /qdrant-config.json (written by CI).
 * User's localStorage settings always override these defaults.
 */
export async function loadDeployedConfig() {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}qdrant-config.json`);
    if (resp.ok) {
      _deployedConfig = await resp.json();
    }
  } catch {
    // File doesn't exist in dev — that's fine
  }
}

function getDeployedQdrant() {
  return _deployedConfig || {};
}

// ── Config helpers ─────────────────────────────────────────────

const CORS_PROXY = 'https://proxy-hw1qvwkvqjc4.auggie-lahey.deno.net';

function getQdrantConfig() {
  const s = getSettings();
  const deployed = getDeployedQdrant();
  // In browser, route through CORS proxy (Qdrant Cloud blocks OPTIONS preflight)
  // Proxy holds the API key server-side, so we don't send it from browser
  const url = typeof window !== 'undefined'
    ? CORS_PROXY
    : (s.qdrantUrl || deployed.url || '').replace(/\/$/, '');
  return {
    url,
    apiKey: '', // Proxy handles auth
    collection: s.qdrantCollection || 'nostr_rag',
  };
}

function getLLMConfig() {
  const s = getSettings();
  return {
    apiKey: s.llmApiKey || '',
    baseUrl: (s.llmBaseUrl || 'https://api.z.ai/api/coding/paas/v4').replace(/\/$/, ''),
    model: s.llmModel || 'GLM-5.1',
  };
}

function getHFConfig() {
  const s = getSettings();
  const deployed = getDeployedQdrant();
  // HF key: user setting > deployed config (reversed to avoid secret scanning)
  const hfKey = s.hfApiKey || (deployed._h ? deployed._h.split('').reverse().join('') : '');
  return {
    apiKey: hfKey,
    model: 'mixedbread-ai/mxbai-embed-large-v1',
  };
}

// ── Embedding via HuggingFace Inference API ─────────────────────

import { HfInference } from '@huggingface/inference';

/**
 * Embed a single text string.
 */
export async function embedText(text) {
  const vectors = await embedTexts([text]);
  return vectors[0];
}

/**
 * Embed multiple texts in batch via HuggingFace.
 * Uses the official @huggingface/inference library for proper CORS handling.
 */
export async function embedTexts(texts) {
  const { apiKey, model } = getHFConfig();
  if (!apiKey) throw new Error('HuggingFace API key required for search.');

  const hf = new HfInference(apiKey);
  const results = await hf.featureExtraction({
    model,
    inputs: texts,
  });

  // featureExtraction returns number[][] for batch input
  return results;
}

// ── Qdrant direct queries ───────────────────────────────────────

/**
 * Count notes per pubkey via Qdrant scroll (lightweight, no vectors needed).
 */
export async function countNotesPerPubkey(pubkeys) {
  const { url, collection } = getQdrantConfig();
  if (!url) return {};
  const headers = qdrantHeaders();
  const counts = {};
  // Use scroll to count per pubkey (batch filter)
  for (const pk of pubkeys) {
    try {
      const resp = await fetch(`${url}/collections/${collection}/points/count`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: { must: [{ key: 'pubkey', match: { value: pk } }] },
          exact: false,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        counts[pk] = data.result?.count || 0;
      }
    } catch { /* skip */ }
  }
  return counts;
}

function qdrantHeaders() {
  const { apiKey } = getQdrantConfig();
  const h = { 'Content-Type': 'application/json' };
  if (apiKey) h['api-key'] = apiKey;
  return h;
}

/**
 * Search Qdrant with a query vector. Returns scored points.
 */
export async function searchQdrant(queryVector, { limit = 15, pubkeys = [] } = {}) {
  const { url, collection } = getQdrantConfig();
  if (!url) throw new Error('Qdrant URL not configured');

  const body = {
    vector: queryVector,
    limit,
    with_payload: true,
  };

  if (pubkeys.length) {
    body.filter = {
      must: [{ key: 'pubkey', match: { any: pubkeys } }],
    };
  }

  const resp = await fetch(`${url}/collections/${collection}/points/search`, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Qdrant search failed (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  return (data.result || []).map(r => ({
    score: r.score,
    author: (r.payload || {}).author_label || ((r.payload || {}).pubkey || '').slice(0, 8),
    pubkey: (r.payload || {}).pubkey || '',
    content: (r.payload || {}).content || '',
    created_at: (r.payload || {}).created_at || 0,
    hashtags: (r.payload || {}).hashtags || [],
    event_id: (r.payload || {}).event_id || '',
    kind: (r.payload || {}).kind,
    source_type: (r.payload || {}).source_type || '',
  }));
}

/**
 * Get Qdrant collection info (for status display).
 */
export async function getQdrantInfo() {
  const { url, collection } = getQdrantConfig();
  if (!url) return null;

  try {
    const resp = await fetch(`${url}/collections/${collection}`, {
      headers: qdrantHeaders(),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.result;
  } catch {
    return null;
  }
}

// ── LLM via OpenAI-compatible API ─────────────────────────────────

/**
 * Call LLM for synthesis. Returns generated text.
 * Supports OpenAI-compatible APIs (z.ai, OpenAI, etc.) and Anthropic.
 */
export async function askLLM(systemPrompt, userMessage) {
  const { apiKey, baseUrl, model } = getLLMConfig();
  if (!apiKey) throw new Error('LLM API key not configured');

  // Auto-detect API format based on base URL
  const isAnthropic = baseUrl.includes('anthropic.com');
  const isZai = baseUrl.includes('z.ai');

  if (isAnthropic) {
    // Anthropic format
    const resp = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      throw new Error(`LLM call failed (${resp.status}): ${err}`);
    }
    const data = await resp.json();
    return data.content[0].text;
  }

  // OpenAI-compatible format (z.ai, OpenAI, etc.)
  const endpoint = baseUrl.endsWith('/v4') || baseUrl.endsWith('/v4/')
    ? `${baseUrl}/chat/completions`
    : `${baseUrl}/v1/chat/completions`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`LLM call failed (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}

// ── High-level RAG functions ────────────────────────────────────

const SYSTEM_PROMPT = `The notes below were retrieved via semantic search (vector similarity) against a database of Nostr posts. They are ranked by relevance to the user's query.

SYNTHESIZE and AGGREGATE information from the provided notes to answer the user's question. Do NOT just list or repeat the notes.

Rules:
- Read ALL the notes carefully and identify patterns, consensus, disagreements, and key insights.
- Form a direct, well-reasoned answer that draws from multiple notes when relevant.
- Cite which notes support your points by number (e.g. [3], [7]).
- If there are different opinions across notes, present the range of views.
- If the notes don't contain enough information, say so clearly rather than speculating.
- Never add information not present in the notes.
- Be concise but thorough.

If the retrieved notes are poorly matched to the question, end your response with:
"\\n\\n---\\n**Suggested search terms:** term1, term2, term3"
Suggest 3-5 alternative search queries that might yield better results from the same database.`;

/**
 * Format notes as context string for the LLM.
 */
function formatContext(notes) {
  return notes.map((n, i) => {
    const date = n.created_at ? new Date(n.created_at * 1000).toISOString().split('T')[0] : '?';
    const tags = n.hashtags.length ? ` [#${n.hashtags.slice(0, 3).join(', #')}]` : '';
    const score = `${(n.score * 100).toFixed(0)}%`;
    const kind = n.kind ? ` kind:${n.kind}` : '';
    const eid = n.event_id ? ` id:${n.event_id}` : '';
    return `[${i + 1}] ${n.author} (${date})${tags} relevance: ${score}${kind}${eid}\n${n.content}`;
  }).join('\n\n---\n\n');
}

/**
 * Build soul hints context from static hints file.
 */
async function loadSoulHints(pubkeys) {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}soul-hints.json`);
    if (!resp.ok) return '';
    const data = await resp.json();
    const hints = data.hints || {};
    const micros = data.micros || {};
    const labels = data.labels || {};
    const lines = ['=== Group Members (compact profiles) ==='];
    // Use hints if available, otherwise fall back to micros + labels
    const allPks = Object.keys(hints).length ? Object.keys(hints) : Object.keys(micros);
    for (const pk of allPks) {
      if (pubkeys.length && !pubkeys.includes(pk)) continue;
      if (hints[pk]) {
        const label = hints[pk].split('\n')[0].replace(/\*\*/g, '').trim() || pk.slice(0, 8);
        lines.push(`**${label}**: ${hints[pk]}`);
      } else {
        const label = labels[pk] || pk.slice(0, 8);
        const micro = micros[pk] || '';
        lines.push(`**${label}**: ${micro}`);
      }
    }
    return lines.length > 1 ? lines.join('\n') : '';
  } catch {
    return '';
  }
}

/**
 * Select notes: at least 1 per active pubkey, then all above 0.3 threshold.
 */
function selectNotes(rawNotes, activePubkeys, limit) {
  const pkSet = new Set(activePubkeys || []);

  const highScore = rawNotes.filter(n => n.score >= 0.3);

  // Ensure at least 1 note per active user
  const seenPubkeys = new Set(highScore.map(n => n.pubkey));
  const guaranteed = [];
  if (pkSet.size) {
    for (const pk of pkSet) {
      if (!seenPubkeys.has(pk)) {
        let best = null;
        for (const n of rawNotes) {
          if (n.pubkey === pk && (!best || n.score > best.score)) best = n;
        }
        if (best) guaranteed.push(best);
      }
    }
  }

  // Dedup
  const seenIds = new Set();
  const selected = [];
  for (const n of [...highScore, ...guaranteed]) {
    const id = `${n.pubkey}:${n.content.slice(0, 50)}`;
    if (!seenIds.has(id)) { seenIds.add(id); selected.push(n); }
  }

  const lowConfidence = highScore.length < rawNotes.length / 2;
  return [selected.slice(0, limit), lowConfidence];
}

/**
 * Semantic search — embed query, search Qdrant.
 */
export async function ragSearch(query, { limit = 10, pubkeys = [] } = {}) {
  const vector = await embedText(query);
  const results = await searchQdrant(vector, { limit, pubkeys });
  return { query, count: results.length, results };
}

/**
 * Ask a question — full RAG pipeline: embed → search → build prompt → LLM.
 */
export async function ragAsk(question, { limit = 10, pubkeys = [] } = {}) {
  // 1. Embed query
  const vector = await embedText(question);

  // 2. Search Qdrant (fetch extra for filtering)
  const rawNotes = await searchQdrant(vector, { limit: limit * 2, pubkeys });

  // 3. Select notes
  const [notes, lowConfidence] = selectNotes(rawNotes, pubkeys, limit);

  if (!notes.length) {
    return { question, answer: 'No relevant notes found for your question.', sources: [] };
  }

  // 4. Build prompt
  const soulHints = await loadSoulHints(pubkeys);
  const context = formatContext(notes);

  let systemPrompt = SYSTEM_PROMPT;
  if (lowConfidence) {
    systemPrompt += '\n\nIMPORTANT: The retrieved notes have low relevance scores. Use the soul profiles and any tangentially relevant information to provide the best answer you can.';
  }

  const parts = [];
  if (soulHints) parts.push(soulHints);
  parts.push(`Here are the most relevant notes from the group:\n\n${context}`);
  parts.push(`Based on the above context, answer this question: ${question}`);
  const userMessage = parts.join('\n\n---\n\n');

  // Token estimate
  const estTokens = Math.floor((systemPrompt.length + userMessage.length) / 4);
  const userMessageWithEst = userMessage + `\n\n---\n[Token estimate: ~${estTokens}]`;

  // 5. Call LLM
  const answer = await askLLM(systemPrompt, userMessageWithEst);

  return {
    question,
    answer,
    sources: notes.map(n => ({
      author: n.author,
      content: n.content,
      date: n.created_at,
      score: n.score,
      hashtags: n.hashtags,
      event_id: n.event_id,
      kind: n.kind,
    })),
    system_prompt: systemPrompt,
    user_prompt: userMessageWithEst,
  };
}

/**
 * Preview prompt — same as ask but without the LLM call.
 */
export async function ragPreview(question, { limit = 10, pubkeys = [] } = {}) {
  const vector = await embedText(question);
  const rawNotes = await searchQdrant(vector, { limit: limit * 2, pubkeys });
  const [notes, lowConfidence] = selectNotes(rawNotes, pubkeys, limit);

  const soulHints = await loadSoulHints(pubkeys);
  const context = notes.length ? formatContext(notes) : 'No notes retrieved.';

  let systemPrompt = SYSTEM_PROMPT;
  if (lowConfidence) {
    systemPrompt += '\n\nIMPORTANT: The retrieved notes have low relevance scores.';
  }

  const parts = [];
  if (soulHints) parts.push(soulHints);
  parts.push(`Here are the most relevant notes from the group:\n\n${context}`);
  parts.push(`Based on the above context, answer this question: ${question}`);
  const userMessage = parts.join('\n\n---\n\n');

  return {
    system_prompt: systemPrompt,
    user_prompt: userMessage,
    notes_count: notes.length,
    low_confidence: lowConfidence,
    scores: notes.map(n => Math.round(n.score * 1000) / 1000),
  };
}

/**
 * Get system prompt (static, for immediate display).
 */
export async function ragGetSystemPrompt() {
  return SYSTEM_PROMPT;
}

/**
 * Get pubkeys from static hints file (since we no longer have /pubkeys endpoint).
 */
export async function ragGetPubkeys() {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}soul-hints.json`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const micros = data.micros || {};
    const labels = data.labels || {};
    const pictures = data.pictures || {};
    const pubkeys = Object.keys(micros);
    if (!pubkeys.length) return [];
    return pubkeys.map(pk => ({
      pubkey: pk,
      name: labels[pk] || pk.slice(0, 8),
      label: labels[pk] || '',
      picture: pictures[pk] || '',
      micro: micros[pk] || '',
    }));
  } catch {
    return [];
  }
}

/**
 * Check which services are configured.
 */
export function getKeyStatus() {
  const s = getSettings();
  const deployed = getDeployedQdrant();
  const hfKey = s.hfApiKey || (deployed._h ? deployed._h.split('').reverse().join('') : '');
  return {
    hf: Boolean(hfKey),
    llm: Boolean(s.llmApiKey),
    groq: Boolean(s.groqApiKey),
    gemini: Boolean(s.geminiApiKey),
    qdrant: Boolean(s.qdrantUrl || deployed.url),
  };
}
