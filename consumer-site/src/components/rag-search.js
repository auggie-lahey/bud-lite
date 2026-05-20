/**
 * RAG Chat component — full chat UI with sessions, user filters, prompt transparency.
 * Ported from backend status.py. All state in browser, API calls to backend.
 */

import { ragSearch, ragAsk, ragPreview, ragGetSystemPrompt, ragGetPubkeys, getKeyStatus, countNotesPerPubkey } from '../api/rag.js';
import { getSettings, saveSettings } from '../core/settings.js';

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── Markdown → HTML (basic but handles most LLM output) ────────
function renderMarkdown(text) {
  let html = esc(text);
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(.+?)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^[\-•] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  if (!html.startsWith('<')) html = '<p>' + html + '</p>';
  return html;
}

// ── Citation linking ───────────────────────────────────────────
let chatMsgCounter = 0;

function linkCitations(html, msgId) {
  return html.replace(/\[(\d+)\]/g, (_, num) => {
    return `<a class="ia-cite" href="javascript:void(0)" data-msg="${msgId}" data-idx="${parseInt(num) - 1}" onclick="window.__scrollToSource(this)">[${num}]</a>`;
  });
}

function primalLink(eventId, kind) {
  if (!eventId) return '';
  return 'https://primal.net/e/' + eventId;
}

function isQuestion(text) {
  return text.endsWith('?') || /^(what|who|how|why|when|where|which|can|does|is|are|do|tell|explain)/i.test(text);
}

// ── Prompt HTML builder ────────────────────────────────────────
function buildPromptHtml(sys, usr) {
  if (!sys && !usr) return '';
  let h = '<div class="ia-prompt-section">';
  h += '<div class="ia-sources-header" onclick="this.nextElementSibling.classList.toggle(\'open\')">Prompt ▾</div>';
  h += '<div class="ia-prompt-body">';
  if (sys) h += `<div style="padding:0.5em;border-bottom:1px solid #222"><span class="ia-prompt-label">SYSTEM</span><pre>${esc(sys)}</pre></div>`;
  if (usr) h += `<div style="padding:0.5em"><span class="ia-prompt-label">USER</span><pre>${esc(usr)}</pre></div>`;
  h += '</div></div>';
  return h;
}

// ── Expose scroll-to-source globally (for onclick in innerHTML) ──
window.__scrollToSource = function(el) {
  const msgId = el.getAttribute('data-msg');
  const idx = el.getAttribute('data-idx');
  const sourcesBody = document.getElementById('sources-body-' + msgId);
  if (sourcesBody) sourcesBody.style.display = 'block';
  setTimeout(() => {
    const target = document.getElementById('src-' + msgId + '-' + idx);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.style.background = '#2a3a5f';
    }
  }, 50);
};

// ── Session persistence ────────────────────────────────────────
const SESSIONS_KEY = 'rag-chat-sessions';

function getSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}'); } catch { return {}; }
}
function saveSessions(s) { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)); }
function getSession(id) { return getSessions()[id] || { id, created: Date.now(), messages: [] }; }

// ── Main mount function ────────────────────────────────────────
export function mountRagChat(container) {
  const keyStatus = getKeyStatus();

  container.innerHTML = `
    <div class="ia-chat-page">
      <div class="ia-chat-user-bar" id="rag-user-bar">
        <span class="ub-label">Filter:</span>
      </div>
      <div class="ia-chat-history-bar" id="rag-history-bar">
        <span class="hb-label">Sessions:</span>
        <button class="ia-new-session-btn" id="rag-new-session">+ New</button>
      </div>
      <div class="ia-chat-messages" id="rag-chat"></div>
      <div class="ia-chat-input-bar">
        <textarea id="rag-input" placeholder="Search or ask a question..." rows="1"></textarea>
        <button id="rag-ask-btn" ${!keyStatus.qdrant ? 'disabled title="Qdrant not configured"' : ''}>Ask</button>
      </div>
    </div>
  `;

  const chatEl = container.querySelector('#rag-chat');
  const inputEl = container.querySelector('#rag-input');
  const askBtn = container.querySelector('#rag-ask-btn');
  const userBar = container.querySelector('#rag-user-bar');
  const historyBar = container.querySelector('#rag-history-bar');

  // ── State ──────────────────────────────────────────────────
  let pubkeyMeta = [];
  let activePubkeys = new Set();
  let currentSessionId = null;
  let msgCounter = 0;
  let cachedSystemPrompt = '';

  // ── Load system prompt ─────────────────────────────────────
  ragGetSystemPrompt().then(p => { cachedSystemPrompt = p; }).catch(() => {});

  // ── Prompt for LLM key on load if missing ──────────────────
  const keys = getKeyStatus();
  if (!keys.llm) {
    showKeyPrompt('llm');
  }

  // ── User filter chips ──────────────────────────────────────
  async function loadPubkeys() {
    try {
      pubkeyMeta = await ragGetPubkeys();
      activePubkeys = new Set(pubkeyMeta.map(p => p.pubkey));
      renderUserChips();
      loadNoteCounts(); // async, renders again when done
    } catch (e) {
      console.error('Failed to load pubkeys:', e);
    }
  }

  let pubkeyNoteCounts = {};

  async function loadNoteCounts() {
    if (!pubkeyMeta.length) return;
    try {
      const { countNotesPerPubkey } = await import('../api/rag.js');
      pubkeyNoteCounts = await countNotesPerPubkey(pubkeyMeta.map(p => p.pubkey));
      renderUserChips();
    } catch { /* counts are optional */ }
  }

  function renderUserChips() {
    userBar.querySelectorAll('.ia-user-chip').forEach(c => c.remove());
    for (const p of pubkeyMeta) {
      const chip = document.createElement('span');
      chip.className = 'ia-user-chip ' + (activePubkeys.has(p.pubkey) ? 'active' : 'inactive');
      const name = p.label || p.name || p.pubkey.slice(0, 8);
      const initial = esc(name[0].toUpperCase());
      const count = pubkeyNoteCounts[p.pubkey];
      const countHtml = count !== undefined ? `<span class="ia-chip-count">${count}</span>` : '';
      const imgHtml = p.picture
        ? `<img src="${esc(p.picture)}" class="pfp-img"><span class="no-pfp">${initial}</span>`
        : `<span class="no-pfp">${initial}</span>`;
      const tooltipHtml = p.micro ? `<div class="ia-chip-tooltip">${esc(p.micro)}</div>` : '';
      chip.innerHTML = imgHtml + `<span>${esc(name)}</span>${countHtml}` + tooltipHtml;
      chip.onclick = () => {
        if (activePubkeys.has(p.pubkey)) {
          if (activePubkeys.size <= 1) return;
          activePubkeys.delete(p.pubkey);
        } else {
          activePubkeys.add(p.pubkey);
        }
        renderUserChips();
      };
      userBar.appendChild(chip);
    }
  }

  function getActivePubkeys() {
    if (activePubkeys.size === pubkeyMeta.length) return [];
    return Array.from(activePubkeys);
  }

  function getBackendUrl() {
    const s = JSON.parse(localStorage.getItem('ia-settings') || '{}');
    return (s.ragBackendUrl || '').replace(/\/$/, '');
  }

  loadPubkeys();

  // ── Session management ─────────────────────────────────────
  function updateSessionTabs() {
    historyBar.querySelectorAll('.ia-session-tab').forEach(t => t.remove());
    const sessions = getSessions();
    const ids = Object.keys(sessions).sort((a, b) => sessions[b].created - sessions[a].created);
    for (const id of ids) {
      const s = sessions[id];
      const tab = document.createElement('span');
      tab.className = 'ia-session-tab' + (id === currentSessionId ? ' active' : '');
      const label = s.messages.length ? s.messages[0].text.slice(0, 25) : 'Empty';
      tab.innerHTML = esc(label) + (id === currentSessionId ? '' : ` <span class="tab-close" onclick="event.stopPropagation();window.__deleteRagSession('${id}')">×</span>`);
      tab.onclick = () => loadSession(id);
      historyBar.insertBefore(tab, historyBar.querySelector('#rag-new-session'));
    }
  }

  window.__deleteRagSession = function(id) {
    const sessions = getSessions();
    delete sessions[id];
    saveSessions(sessions);
    if (id === currentSessionId) { currentSessionId = null; newSession(); }
    updateSessionTabs();
  };

  function flushCurrentSession() {
    if (!currentSessionId) return;
    const messages = [];
    chatEl.querySelectorAll('.ia-chat-msg').forEach(div => {
      const isUser = div.classList.contains('user');
      messages.push({
        type: isUser ? 'user' : 'ai',
        text: isUser ? div.textContent : '',
        html: isUser ? '' : div.innerHTML,
      });
    });
    const sessions = getSessions();
    if (!sessions[currentSessionId]) sessions[currentSessionId] = { id: currentSessionId, created: Date.now() };
    sessions[currentSessionId].messages = messages;
    saveSessions(sessions);
  }

  function addMsg(type, html, persist) {
    const div = document.createElement('div');
    div.className = 'ia-chat-msg ' + type;
    div.innerHTML = html;
    if (type === 'ai') {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'ia-copy-btn';
      copyBtn.textContent = 'copy';
      copyBtn.onclick = function() {
        const answerEl = div.querySelector('.ia-answer-block') || div;
        navigator.clipboard.writeText(answerEl.textContent.trim()).then(() => {
          copyBtn.textContent = 'copied';
          setTimeout(() => { copyBtn.textContent = 'copy'; }, 1500);
        });
      };
      div.appendChild(copyBtn);
    }
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
    if (persist && currentSessionId) {
      const sessions = getSessions();
      if (!sessions[currentSessionId]) sessions[currentSessionId] = { id: currentSessionId, created: Date.now(), messages: [] };
      sessions[currentSessionId].messages.push({
        type, text: type === 'user' ? div.textContent : '', html: type === 'user' ? '' : div.innerHTML,
      });
      saveSessions(sessions);
      updateSessionTabs();
    }
  }

  function newSession() {
    if (currentSessionId) flushCurrentSession();
    currentSessionId = 's' + Date.now();
    const sessions = getSessions();
    sessions[currentSessionId] = { id: currentSessionId, created: Date.now(), messages: [] };
    saveSessions(sessions);
    chatEl.innerHTML = '';
    msgCounter = 0;
    addMsg('ai', 'Search or ask questions about indexed Nostr notes. Try: <em>"what is the best hardware wallet?"</em> or <em>"lightning network"</em>', false);
    updateSessionTabs();
  }

  function loadSession(id) {
    if (currentSessionId) flushCurrentSession();
    currentSessionId = id;
    const session = getSession(id);
    chatEl.innerHTML = '';
    msgCounter = 0;
    for (const m of session.messages) {
      msgCounter++;
      if (m.type === 'user') addMsg('user', esc(m.text), false);
      else addMsg('ai', m.html, false);
    }
    if (!session.messages.length) {
      chatEl.innerHTML = '';
      addMsg('ai', 'Search or ask questions about indexed Nostr notes. Try: <em>"what is the best hardware wallet?"</em> or <em>"lightning network"</em>', false);
    }
    updateSessionTabs();
  }

  // Initialize session
  (function() {
    const sessions = getSessions();
    const ids = Object.keys(sessions).sort((a, b) => sessions[b].created - sessions[a].created);
    if (ids.length) loadSession(ids[0]);
    else newSession();
    updateSessionTabs();
  })();

  container.querySelector('#rag-new-session').onclick = newSession;

  // ── Key prompt modal ───────────────────────────────────────
  function showKeyPrompt(missingKey) {
    return new Promise((resolve) => {
      const existing = document.getElementById('ia-key-modal');
      if (existing) existing.remove();

      const labels = {
        llm: { title: 'LLM API Key Required', placeholder: 'sk-...', field: 'llmApiKey', hint: 'Needed to generate answers. Supports Anthropic, OpenAI-compatible APIs.' },
        hf: { title: 'HuggingFace API Key', placeholder: 'hf_...', field: 'hfApiKey', hint: 'Optional. Free tier works without it, but a key is faster.' },
      };
      const info = labels[missingKey] || labels.llm;

      const modal = document.createElement('div');
      modal.id = 'ia-key-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6)';
      modal.innerHTML = `
        <div style="background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:1.5em;max-width:400px;width:90%">
          <h3 style="margin:0 0 0.5em;color:#6ee7b7;font-size:1rem">${info.title}</h3>
          <p style="color:#888;font-size:0.8rem;margin:0 0 1em">${info.hint}</p>
          <input id="ia-key-input" type="password" placeholder="${info.placeholder}"
            style="width:100%;padding:0.5em 0.7em;background:#0f1117;border:1px solid #444;border-radius:6px;color:#ddd;font-size:0.9rem;box-sizing:border-box">
          <div style="display:flex;gap:0.5em;margin-top:1em;justify-content:flex-end">
            <button id="ia-key-cancel" style="padding:0.4em 1em;background:transparent;border:1px solid #444;border-radius:6px;color:#888;cursor:pointer">Cancel</button>
            <button id="ia-key-save" style="padding:0.4em 1em;background:#6ee7b7;border:none;border-radius:6px;color:#0f1117;cursor:pointer;font-weight:600">Save</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      const input = modal.querySelector('#ia-key-input');
      input.focus();
      modal.querySelector('#ia-key-cancel').onclick = () => { modal.remove(); resolve(false); };
      modal.querySelector('#ia-key-save').onclick = () => {
        const val = input.value.trim();
        if (val) {
          const s = getSettings();
          s[info.field] = val;
          saveSettings(s);
        }
        modal.remove();
        resolve(true);
      };
      input.onkeydown = (e) => { if (e.key === 'Enter') modal.querySelector('#ia-key-save').click(); };
      modal.onclick = (e) => { if (e.target === modal) { modal.remove(); resolve(false); } };
    });
  }

  // ── Submit logic ───────────────────────────────────────────
  async function submitAsk() {
    const q = inputEl.value.trim();
    if (!q) return;

    // Re-check key in case user dismissed the prompt
    const keysNow = getKeyStatus();
    if (isQuestion(q) && !keysNow.llm) {
      const saved = await showKeyPrompt('llm');
      if (!saved) return;
    }

    inputEl.value = '';
    inputEl.style.height = 'auto';
    askBtn.disabled = true;
    const msgId = 'm' + (++msgCounter);
    const pkList = getActivePubkeys();

    // Show user message with prompt (system prompt shown immediately)
    addMsg('user', esc(q) + '<div id="prompt-' + msgId + '">' + buildPromptHtml(cachedSystemPrompt, '') + '</div>', true);

    if (isQuestion(q)) {
      // Step 1: Preview prompt
      var promptData = null;
      var promptEl = document.getElementById('prompt-' + msgId);
      try {
        promptData = await ragPreview(q, { pubkeys: pkList });
        if (promptEl) {
          var wasOpen = promptEl.querySelector('.ia-prompt-body');
          var isOpen = wasOpen && wasOpen.classList.contains('open');
          promptEl.innerHTML = buildPromptHtml(promptData.system_prompt, promptData.user_prompt);
          if (isOpen) {
            var newBody = promptEl.querySelector('.ia-prompt-body');
            if (newBody) newBody.classList.add('open');
          }
        }
      } catch (e) {
        console.error('Preview failed:', e);
      }

      // Step 2: Thinking + get answer
      addMsg('ai', '<span class="ia-typing">Thinking</span>', false);
      try {
        const data = await ragAsk(q, { pubkeys: pkList });
        chatEl.lastChild.remove();

        let answerHtml = renderMarkdown(data.answer);
        answerHtml = linkCitations(answerHtml, msgId);

        // Sources
        let sourcesHtml = '';
        if (data.sources && data.sources.length) {
          sourcesHtml = '<div class="ia-sources-section">';
          sourcesHtml += `<div class="ia-sources-header" onclick="var n=this.nextElementSibling;n.style.display=n.style.display==='none'?'block':'none'">Sources (${data.sources.length}) ▾</div>`;
          sourcesHtml += `<div class="ia-sources-body" id="sources-body-${msgId}" style="display:none">`;
          for (let i = 0; i < data.sources.length; i++) {
            const s = data.sources[i];
            const d = s.date ? new Date(s.date * 1000).toLocaleDateString() : '';
            const link = s.event_id ? `<a class="ia-primal-link" href="${primalLink(s.event_id, s.kind)}" target="_blank">open ↗</a>` : '';
            sourcesHtml += `<div class="ia-src-note" id="src-${msgId}-${i}">`
              + `<div class="ia-src-header"><span class="ia-src-num">[${i + 1}]</span> `
              + `<span style="color:#93c5fd">${esc(s.author)}</span> `
              + `<span class="meta">${d} ${(s.score * 100).toFixed(0)}%</span> `
              + link
              + '</div>'
              + `<div class="ia-src-text">${esc(s.content)}</div>`
              + '</div>';
          }
          sourcesHtml += '</div></div>';
        }

        addMsg('ai', `<div class="ia-answer-block">${answerHtml}</div>${sourcesHtml}`, true);
      } catch (e) {
        chatEl.lastChild.remove();
        addMsg('ai', `<div class="ia-error-msg"><strong>Request failed</strong><br>${esc(e.message)}</div>`, true);
      }
    } else {
      // Search mode
      addMsg('ai', '<span class="ia-typing">Searching</span>', false);
      try {
        const data = await ragSearch(q, { pubkeys: pkList });
        chatEl.lastChild.remove();

        if (data.error) {
          addMsg('ai', `<div class="ia-error-msg">${esc(data.error)}</div>`, true);
        } else if (!data.count) {
          addMsg('ai', 'No results found.', true);
        } else {
          let html = `<strong>${data.count} results</strong>`;
          for (const r of data.results) {
            const ts = r.created_at ? new Date(r.created_at * 1000).toLocaleDateString() : '';
            const link = r.event_id ? `<a class="ia-primal-link" href="${primalLink(r.event_id, r.kind)}" target="_blank">open ↗</a>` : '';
            html += `<div class="ia-result-card">`
              + `<span class="score">${(r.score * 100).toFixed(1)}%</span> `
              + `<span class="meta">${esc(r.author_label || '?')} · ${ts}</span> `
              + link
              + `<br>${esc(r.content.slice(0, 300))}${r.content.length > 300 ? '...' : ''}`
              + '</div>';
          }
          addMsg('ai', html, true);
        }
      } catch (e) {
        chatEl.lastChild.remove();
        addMsg('ai', `<div class="ia-error-msg"><strong>Search failed</strong><br>${esc(e.message)}</div>`, true);
      }
    }

    askBtn.disabled = false;
    inputEl.focus();
  }

  // ── Keyboard: Enter = send, Shift+Enter = newline ──────────
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAsk(); }
  });

  // Auto-resize textarea
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 128) + 'px';
  });

  askBtn.addEventListener('click', submitAsk);

  // Return cleanup function
  return function cleanup() {};
}
