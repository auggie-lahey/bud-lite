"""
Status endpoint — Qdrant collection info and system health.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from app.config import get_settings
from ingestion.indexer import get_qdrant_client
from models.schemas import StatusResponse

log = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def index():
    """Landing page with API overview and quick search form."""
    settings = get_settings()

    # Get collection stats
    try:
        client = get_qdrant_client()
        info = client.get_collection(settings.collection_name)
        points = info.points_count or 0
        status = info.status
    except Exception:
        points = 0
        status = "unavailable"

    # Dev defaults from .env (pre-fill landing page, never used server-side)
    dev_llm_key = settings.dev_llm_key
    dev_llm_url = settings.dev_llm_base_url
    dev_llm_model = settings.dev_llm_model
    dev_hf_key = settings.dev_hf_key

    return f"""<!DOCTYPE html>
<html>
<head>
    <title>Nostr RAG</title>
    <style>
        * {{ box-sizing: border-box; }}
        body {{ font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 0;
               background: #0f1117; color: #ddd; display: flex; flex-direction: column; height: 100vh; }}
        h1 {{ color: #6ee7b7; margin: 0.6em 0 0.2em; font-size: 1.3rem; }}
        .stats {{ padding: 0.3em 0; border-bottom: 1px solid #222; }}
        .stat {{ display: inline-block; background: #1a1a2e; border: 1px solid #333;
                 padding: 0.3em 0.8em; border-radius: 4px; margin: 0.2em; font-size: 0.8rem; }}
        .stat strong {{ color: #6ee7b7; }}
        #chat {{ flex: 1; overflow-y: auto; padding: 0.8em; }}
        .msg {{ margin: 0.5em 0; padding: 0.6em 0.8em; border-radius: 8px; max-width: 95%; line-height: 1.5; }}
        .msg.user {{ background: #1e3a5f; margin-left: auto; max-width: 80%; }}
        .msg.user .sources-list {{ margin-top: 0.4em; }}
        .msg.user .sources-header {{ font-size: 0.7rem; color: #93c5fd; }}
        .msg.user pre {{ font-size: 0.7rem; }}
        .msg.ai {{ background: #1a1a2e; border: 1px solid #333; }}
        .msg .score {{ color: #6ee7b7; font-weight: 700; font-size: 0.8rem; }}
        .msg .meta {{ color: #888; font-size: 0.8rem; }}
        .msg .sources {{ margin-top: 0.5em; font-size: 0.85rem; }}
        .msg .sources summary {{ color: #6ee7b7; cursor: pointer; }}
        .msg .src-note {{ padding: 0.4em 0.6em; border-bottom: 1px solid #222; font-size: 0.85rem; color: #aaa; transition: background 0.3s; }}
        .sources-header {{ color: #6ee7b7; cursor: pointer; font-weight: 600; font-size: 0.85rem; padding: 0.3em 0; }}
        .sources-header:hover {{ color: #5cd6a8; }}
        .src-num {{ color: #6ee7b7; font-weight: 700; }}
        .src-header {{ margin-bottom: 0.2em; }}
        .src-text {{ white-space: pre-wrap; word-break: break-word; font-size: 0.85rem; line-height: 1.4; }}
        .cite {{ color: #6ee7b7; text-decoration: none; font-weight: 600; cursor: pointer; }}
        .cite:hover {{ text-decoration: underline; }}
        .primal-link {{ color: #93c5fd; font-size: 0.75rem; text-decoration: none; margin-left: 0.3em; }}
        .primal-link:hover {{ text-decoration: underline; }}
        .answer-block {{ line-height: 1.6; }}
        .answer-block code {{ background: #2a2a3e; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }}
        .answer-block h3 {{ color: #6ee7b7; margin: 0.5em 0 0.2em; font-size: 1.05rem; }}
        .answer-block h4 {{ color: #6ee7b7; margin: 0.4em 0 0.2em; font-size: 0.95rem; }}
        .answer-block ul {{ margin: 0.3em 0; padding-left: 1.5em; }}
        .answer-block li {{ margin: 0.2em 0; }}
        .result-card {{ padding: 0.4em 0; border-bottom: 1px solid #222; }}
        .result-card:last-child {{ border-bottom: none; }}
        #input-bar {{ display: flex; gap: 0.5em; padding: 0.6em; border-top: 1px solid #222;
                      background: #0f1117; }}
        #q {{ flex: 1; padding: 0.6em 1em; font-size: 1rem; background: #1a1a2e; border: 1px solid #333;
              color: #ddd; border-radius: 6px; outline: none; resize: none; min-height: 2.4em;
              max-height: 8em; font-family: inherit; line-height: 1.4; }}
        #q:focus {{ border-color: #6ee7b7; }}
        button {{ padding: 0.6em 1.2em; background: #6ee7b7; color: #111; border: none;
                  border-radius: 6px; font-size: 0.95rem; cursor: pointer; font-weight: 600; }}
        button:hover {{ background: #5cd6a8; }}
        button:disabled {{ opacity: 0.5; cursor: not-allowed; }}
        .typing {{ color: #fbbf24; font-style: italic; }}
        .typing::after {{ content: ''; animation: dots 3s steps(4,end) infinite; }}
        @keyframes dots {{ 0%{{content:''}} 25%{{content:'.'}} 50%{{content:'..'}} 75%{{content:'...'}} }}
        .copy-btn {{ position: absolute; top: 0.3em; right: 0.3em; font-size: 0.65rem; padding: 0.2em 0.5em;
                     background: #222; border: 1px solid #444; color: #888; border-radius: 3px; cursor: pointer;
                     opacity: 0; transition: opacity 0.2s; }}
        .msg.ai:hover .copy-btn {{ opacity: 1; }}
        .copy-btn:hover {{ background: #333; color: #6ee7b7; border-color: #6ee7b7; }}
        .msg.ai {{ position: relative; }}
        .error-msg {{ background: #2a1a1a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 0.6em 0.8em;
                      border-radius: 8px; margin: 0.5em 0; }}
        a {{ color: #6ee7b7; }}
        .api-link {{ position: absolute; top: 0.6em; right: 1em; font-size: 0.8rem; color: #666; text-decoration: none; }}
        .key-toggle {{ font-size: 0.75rem; color: #666; cursor: pointer; margin-left: 0.5em; }}
        .key-toggle:hover {{ color: #6ee7b7; }}
        .key-panel {{ display: none; padding: 0.4em 0; }}
        .key-panel.open {{ display: block; }}
        .key-panel input {{ width: 100%; margin: 0.2em 0; padding: 0.4em 0.6em; font-size: 0.85rem;
                           background: #1a1a2e; border: 1px solid #333; color: #ddd; border-radius: 4px; }}
        .key-row {{ display: flex; gap: 0.5em; align-items: center; }}
        .key-row label {{ font-size: 0.75rem; color: #888; min-width: 60px; }}
        .key-status {{ font-size: 0.7rem; padding: 0.1em 0.4em; border-radius: 3px; }}
        .key-status.on {{ background: #166534; color: #dcfce7; }}
        .key-status.off {{ background: #991b1b; color: #fee2e2; }}
        .history-bar {{ display: flex; gap: 0.3em; padding: 0.3em 0.8em; border-bottom: 1px solid #222; flex-wrap: wrap; align-items: center; }}
        .history-bar .hb-label {{ font-size: 0.7rem; color: #666; margin-right: 0.3em; }}
        .session-tab {{ font-size: 0.7rem; padding: 0.2em 0.6em; border-radius: 3px; background: #1a1a2e;
                        border: 1px solid #333; color: #aaa; cursor: pointer; white-space: nowrap; }}
        .session-tab:hover {{ border-color: #6ee7b7; color: #6ee7b7; }}
        .session-tab.active {{ background: #1e3a5f; border-color: #6ee7b7; color: #6ee7b7; }}
        .session-tab .tab-close {{ margin-left: 0.4em; color: #666; font-size: 0.65rem; }}
        .session-tab .tab-close:hover {{ color: #f87171; }}
        .new-session-btn {{ font-size: 0.7rem; padding: 0.2em 0.6em; border-radius: 3px;
                            background: transparent; border: 1px dashed #444; color: #888; cursor: pointer; }}
        .new-session-btn:hover {{ border-color: #6ee7b7; color: #6ee7b7; }}
        .user-bar {{ display: flex; gap: 0.4em; padding: 0.4em 0.8em; border-bottom: 1px solid #222; flex-wrap: wrap; align-items: center; }}
        .user-bar .ub-label {{ font-size: 0.7rem; color: #666; margin-right: 0.2em; }}
        .user-chip {{ display: flex; align-items: center; gap: 0.35em; padding: 0.25em 0.6em 0.25em 0.3em;
                      border-radius: 12px; background: #1a1a2e; border: 1px solid #333; cursor: pointer;
                      font-size: 0.75rem; color: #aaa; transition: all 0.2s; user-select: none; }}
        .user-chip:hover {{ border-color: #6ee7b7; }}
        .user-chip.active {{ background: #1e3a5f; border-color: #6ee7b7; color: #ddd; }}
        .user-chip.inactive {{ opacity: 0.35; }}
        .user-chip img {{ width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }}
        .user-chip img.pfp-img + .no-pfp {{ display: none; }}
        .user-chip img.pfp-img:not([src]) {{ display: none; }}
        .user-chip img.pfp-img:not([src]) + .no-pfp {{ display: flex; }}
        .user-chip .no-pfp {{ width: 20px; height: 20px; border-radius: 50%; background: #333;
                              display: flex; align-items: center; justify-content: center;
                              font-size: 0.6rem; color: #666; }}
        .user-chip a {{ color: inherit; text-decoration: none; }}
        .user-chip a:hover {{ text-decoration: none; }}
        .chip-tooltip {{ display: none; position: absolute; top: 100%; left: 0; min-width: 250px;
                         background: #1a1a2e; border: 1px solid #333; border-radius: 6px;
                         padding: 0.6em 0.8em; font-size: 0.75rem; color: #aaa; z-index: 10;
                         box-shadow: 0 4px 12px rgba(0,0,0,0.5); line-height: 1.4; margin-top: 4px; }}
        .user-chip:hover .chip-tooltip {{ display: block; }}
        .user-chip {{ position: relative; }}
    </style>
</head>
<body>
    <a class="api-link" href="/docs">API Docs</a>
    <div style="padding: 0 0.8em">
        <h1>Nostr RAG <span class="key-toggle" onclick="toggleKeys()">⚙ Keys</span></h1>
        <div class="key-panel" id="key-panel">
            <div class="key-row">
                <label>LLM Key</label>
                <input type="password" id="key-llm" placeholder="sk-ant-..." oninput="saveKeys()">
                <span class="key-status off" id="status-llm">off</span>
            </div>
            <div class="key-row">
                <label>LLM URL</label>
                <input type="text" id="key-llm-url" placeholder="https://api.anthropic.com" oninput="saveKeys()">
            </div>
            <div class="key-row">
                <label>LLM Model</label>
                <input type="text" id="key-llm-model" placeholder="claude-sonnet-4-5-20250514" oninput="saveKeys()">
            </div>
            <div class="key-row">
                <label>HF Key</label>
                <input type="password" id="key-hf" placeholder="hf_... (optional, uses local model if blank)" oninput="saveKeys()">
                <span class="key-status off" id="status-hf">local</span>
            </div>
        </div>
        <div class="stats">
            <span class="stat"><strong>{points}</strong> notes</span>
            <span class="stat"><strong>{status}</strong></span>
            <span class="stat" id="mode-stat">mode: <strong>local</strong></span>
        </div>
    </div>

    <div class="user-bar" id="user-bar">
        <span class="ub-label">Filter:</span>
    </div>

    <div class="history-bar" id="history-bar">
        <span class="hb-label">Sessions:</span>
        <button class="new-session-btn" onclick="newSession()">+ New</button>
    </div>

    <div id="chat">
        <div class="msg ai">
            Search or ask questions about {points} indexed Nostr notes.
            Try: <em>"what is the best hardware wallet?"</em> or <em>"lightning network"</em>
        </div>
    </div>

    <div id="input-bar">
        <textarea id="q" placeholder="Search or ask a question..." autofocus rows="1"></textarea>
        <button id="ask-btn" onclick="submitAsk()">Ask</button>
    </div>

    <script>
    const chat = document.getElementById('chat');
    const input = document.getElementById('q');
    const askBtn = document.getElementById('ask-btn');

    // User filter state
    var pubkeyMeta = [];  // Array of {{pubkey, name, picture, label}}
    var activePubkeys = new Set();  // All active by default

    async function loadPubkeys() {{
        try {{
            const resp = await fetch('/pubkeys');
            pubkeyMeta = await resp.json();
            activePubkeys = new Set(pubkeyMeta.map(p => p.pubkey));
            renderUserChips();
        }} catch (e) {{
            console.error('Failed to load pubkeys:', e);
        }}
    }}

    function renderUserChips() {{
        const bar = document.getElementById('user-bar');
        // Remove existing chips
        bar.querySelectorAll('.user-chip').forEach(c => c.remove());
        for (const p of pubkeyMeta) {{
            const chip = document.createElement('span');
            chip.className = 'user-chip ' + (activePubkeys.has(p.pubkey) ? 'active' : 'inactive');
            const name = p.label || p.name || p.pubkey.slice(0,8);
            const initial = esc(name[0].toUpperCase());
            const imgHtml = p.picture
                ? '<img src="' + esc(p.picture) + '" class="pfp-img"><span class="no-pfp">' + initial + '</span>'
                : '<span class="no-pfp">' + initial + '</span>';
            const tooltipHtml = p.micro ? '<div class="chip-tooltip">' + esc(p.micro) + ' <a href="/p/' + esc(p.label || p.name) + '" style="color:#6ee7b7;font-size:0.7rem">view profile →</a></div>' : '';
            chip.innerHTML = imgHtml + '<span><a href="/p/' + esc(p.label || p.name) + '">' + esc(name) + '</a></span>' + tooltipHtml;
            chip.onclick = function() {{
                if (activePubkeys.has(p.pubkey)) {{
                    // Don't allow deselecting all
                    if (activePubkeys.size <= 1) return;
                    activePubkeys.delete(p.pubkey);
                }} else {{
                    activePubkeys.add(p.pubkey);
                }}
                renderUserChips();
            }};
            bar.appendChild(chip);
        }}
    }}

    function getActivePubkeys() {{
        // Return comma-separated string, or empty if all active
        if (activePubkeys.size === pubkeyMeta.length) return '';
        return Array.from(activePubkeys).join(',');
    }}

    loadPubkeys();

    // Fetch system prompt on page load
    var cachedSystemPrompt = '';
    fetch('/system-prompt').then(r => r.json()).then(d => {{ cachedSystemPrompt = d.system_prompt; }}).catch(() => {{}});

    // Key management
    function loadKeys() {{
        try {{
            const k = JSON.parse(sessionStorage.getItem('rag-keys') || '{{}}');
            if (k.llm) document.getElementById('key-llm').value = k.llm;
            if (k.llmUrl) document.getElementById('key-llm-url').value = k.llmUrl;
            if (k.llmModel) document.getElementById('key-llm-model').value = k.llmModel;
            if (k.hf) document.getElementById('key-hf').value = k.hf;
        }} catch {{}}
        updateKeyStatus();
    }}

    function saveKeys() {{
        const k = {{
            llm: document.getElementById('key-llm').value.trim(),
            llmUrl: document.getElementById('key-llm-url').value.trim(),
            llmModel: document.getElementById('key-llm-model').value.trim(),
            hf: document.getElementById('key-hf').value.trim(),
        }};
        sessionStorage.setItem('rag-keys', JSON.stringify(k));
        updateKeyStatus();
    }}

    function updateKeyStatus() {{
        const llm = document.getElementById('key-llm').value.trim();
        const hf = document.getElementById('key-hf').value.trim();
        const s1 = document.getElementById('status-llm');
        const s2 = document.getElementById('status-hf');
        const mode = document.getElementById('mode-stat');
        s1.textContent = llm ? 'on' : 'off';
        s1.className = 'key-status ' + (llm ? 'on' : 'off');
        s2.textContent = hf ? 'remote' : 'local';
        s2.className = 'key-status ' + (hf ? 'on' : 'off');
        mode.innerHTML = 'mode: <strong>' + (llm ? 'AI synthesis' : 'local excerpts') + '</strong>';
    }}

    function getHeaders(extra = {{}}) {{
        const k = JSON.parse(sessionStorage.getItem('rag-keys') || '{{}}');
        const h = {{ ...extra }};
        if (k.hf) h['X-HF-Key'] = k.hf;
        if (k.llm) h['X-LLM-Key'] = k.llm;
        if (k.llmUrl) h['X-LLM-Base-URL'] = k.llmUrl;
        if (k.llmModel) h['X-LLM-Model'] = k.llmModel;
        return h;
    }}

    function toggleKeys() {{
        document.getElementById('key-panel').classList.toggle('open');
    }}

    loadKeys();

    var msgCounter = 0;

    function esc(s) {{ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }}

    // Chat history persistence
    const HISTORY_KEY = 'rag-sessions';
    let currentSessionId = null;

    function getSessions() {{
        try {{ return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{{}}'); }} catch {{ return {{}}; }}
    }}
    function saveSessions(s) {{
        localStorage.setItem(HISTORY_KEY, JSON.stringify(s));
    }}
    function getSession(id) {{ return getSessions()[id] || {{id, created: Date.now(), messages: []}}; }}

    function updateSessionTabs() {{
        const bar = document.getElementById('history-bar');
        // Remove all session tabs
        bar.querySelectorAll('.session-tab').forEach(t => t.remove());
        const sessions = getSessions();
        // Sort by created desc
        const ids = Object.keys(sessions).sort((a,b) => sessions[b].created - sessions[a].created);
        for (const id of ids) {{
            const s = sessions[id];
            const tab = document.createElement('span');
            tab.className = 'session-tab' + (id === currentSessionId ? ' active' : '');
            const label = s.messages.length ? s.messages[0].text.slice(0,25) : 'Empty';
            tab.innerHTML = esc(label) + (id === currentSessionId ? '' : ' <span class="tab-close" onclick="event.stopPropagation();deleteSession(\\''+id+'\\')">×</span>');
            tab.onclick = () => loadSession(id);
            bar.insertBefore(tab, bar.querySelector('.new-session-btn'));
        }}
    }}

    function newSession() {{
        // Save current session first
        if (currentSessionId) flushCurrentSession();
        currentSessionId = 's' + Date.now();
        const sessions = getSessions();
        sessions[currentSessionId] = {{id: currentSessionId, created: Date.now(), messages: []}};
        saveSessions(sessions);
        chat.innerHTML = '';
        msgCounter = 0;
        addMsg('ai', 'Search or ask questions about {points} indexed Nostr notes. Try: <em>"what is the best hardware wallet?"</em> or <em>"lightning network"</em>', false);
        updateSessionTabs();
    }}

    function loadSession(id) {{
        if (currentSessionId) flushCurrentSession();
        currentSessionId = id;
        const session = getSession(id);
        // Clear chat
        chat.innerHTML = '';
        msgCounter = 0;
        for (const m of session.messages) {{
            msgCounter++;
            if (m.type === 'user') {{
                addMsg('user', esc(m.text), false);
            }} else {{
                addMsg('ai', m.html, false);
            }}
        }}
        if (!session.messages.length) {{
            chat.innerHTML = '<div class="msg ai">Search or ask questions about {points} indexed Nostr notes. Try: <em>"what is the best hardware wallet?"</em> or <em>"lightning network"</em></div>';
        }}
        updateSessionTabs();
    }}

    function deleteSession(id) {{
        const sessions = getSessions();
        delete sessions[id];
        saveSessions(sessions);
        if (id === currentSessionId) {{
            currentSessionId = null;
            newSession();
        }}
        updateSessionTabs();
    }}

    function flushCurrentSession() {{
        if (!currentSessionId) return;
        // Save all visible messages to session
        const messages = [];
        chat.querySelectorAll('.msg').forEach(div => {{
            const isUser = div.classList.contains('user');
            messages.push({{
                type: isUser ? 'user' : 'ai',
                text: isUser ? div.textContent : '',
                html: isUser ? '' : div.innerHTML
            }});
        }});
        const sessions = getSessions();
        if (!sessions[currentSessionId]) sessions[currentSessionId] = {{id: currentSessionId, created: Date.now()}};
        sessions[currentSessionId].messages = messages;
        saveSessions(sessions);
    }}

    // Initialize session
    (function() {{
        const sessions = getSessions();
        const ids = Object.keys(sessions).sort((a,b) => sessions[b].created - sessions[a].created);
        if (ids.length) {{
            loadSession(ids[0]);
        }} else {{
            newSession();
        }}
        updateSessionTabs();
    }})();

    // Pre-fill dev defaults
    (function() {{
        const k = JSON.parse(sessionStorage.getItem('rag-keys') || '{{}}');
        if (!k.llm && '{dev_llm_key}') document.getElementById('key-llm').value = '{dev_llm_key}';
        if (!k.llmUrl && '{dev_llm_url}') document.getElementById('key-llm-url').value = '{dev_llm_url}';
        if (!k.llmModel && '{dev_llm_model}') document.getElementById('key-llm-model').value = '{dev_llm_model}';
        if (!k.hf && '{dev_hf_key}') document.getElementById('key-hf').value = '{dev_hf_key}';
        saveKeys();
    }})();

    // Proper markdown → HTML (basic but handles most LLM output)
    function renderMarkdown(text) {{
        let html = esc(text);
        // Headers
        html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');
        // Bold + italic
        html = html.replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, '<strong><em>$1</em></strong>');
        // Bold
        html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
        // Italic
        html = html.replace(/(?<!\\*)\\*(.+?)\\*(?!\\*)/g, '<em>$1</em>');
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Unordered lists
        html = html.replace(/^[\\-•] (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\\/li>)/gs, '<ul>$1</ul>');
        // Numbered lists
        html = html.replace(/^\\d+\\. (.+)$/gm, '<li>$1</li>');
        // Line breaks
        html = html.replace(/\\n\\n/g, '</p><p>');
        html = html.replace(/\\n/g, '<br>');
        // Wrap in paragraph
        if (!html.startsWith('<')) html = '<p>' + html + '</p>';
        return html;
    }}

    // Convert citation numbers [N] into clickable anchor links
    function linkCitations(html, msgId) {{
        return html.replace(/\\[(\\d+)\\]/g, function(match, num) {{
            const idx = parseInt(num) - 1;
            return '<a class="cite" href="javascript:void(0)" data-msg="' + msgId + '" data-idx="' + idx + '" onclick="scrollToSource(this)">[' + num + ']</a>';
        }});
    }}

    function scrollToSource(el) {{
        const msgId = el.getAttribute('data-msg');
        const idx = el.getAttribute('data-idx');
        // Expand the sources section first
        const sourcesBody = document.getElementById('sources-body-' + msgId);
        if (sourcesBody) sourcesBody.style.display = 'block';
        // Now scroll to the target
        setTimeout(function() {{
            const target = document.getElementById('src-' + msgId + '-' + idx);
            if (target) {{
                target.scrollIntoView({{behavior: 'smooth', block: 'center'}});
                target.style.background = '#2a3a5f';
            }}
        }}, 50);
    }}

    // Build primal.net link from event_id (hex) and kind
    function primalLink(eventId, kind) {{
        if (!eventId) return '';
        // kind 30023 uses naddr, everything else uses nevent-like hex link
        if (kind === 30023) {{
            return 'https://primal.net/e/' + eventId;
        }}
        return 'https://primal.net/e/' + eventId;
    }}

    function addMsg(type, html, persist) {{
        const div = document.createElement('div');
        div.className = 'msg ' + type;
        div.innerHTML = html;
        // Add copy button to AI messages
        if (type === 'ai') {{
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'copy';
            copyBtn.onclick = function() {{
                // Get text content from answer-block or full div
                const answerEl = div.querySelector('.answer-block') || div;
                navigator.clipboard.writeText(answerEl.textContent.trim()).then(() => {{
                    copyBtn.textContent = 'copied';
                    setTimeout(() => {{ copyBtn.textContent = 'copy'; }}, 1500);
                }});
            }};
            div.appendChild(copyBtn);
        }}
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
        if (persist && currentSessionId) {{
            const sessions = getSessions();
            if (!sessions[currentSessionId]) sessions[currentSessionId] = {{id: currentSessionId, created: Date.now(), messages: []}};
            sessions[currentSessionId].messages.push({{
                type: type,
                text: type === 'user' ? div.textContent : '',
                html: type === 'user' ? '' : div.innerHTML
            }});
            saveSessions(sessions);
            updateSessionTabs();
        }}
    }}

    function isQuestion(text) {{
        return text.endsWith('?') || /^(what|who|how|why|when|where|which|can|does|is|are|do|tell|explain)/i.test(text);
    }}

    function buildPromptHtml(sys, usr) {{
        if (!sys && !usr) return '';
        var h = '<div class="sources-list">';
        h += '<div class="sources-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\\'none\\'?\\'block\\':\\'none\\'">Prompt ▾</div>';
        h += '<div style="display:none;max-height:400px;overflow-y:auto;background:#111;border:1px solid #333;border-radius:4px;margin-top:0.3em">';
        if (sys) h += '<div style="padding:0.5em;border-bottom:1px solid #222"><strong style="color:#fbbf24;font-size:0.75rem">SYSTEM</strong><pre style="margin:0.3em 0 0;white-space:pre-wrap;font-size:0.75rem;color:#888">' + esc(sys) + '</pre></div>';
        if (usr) h += '<div style="padding:0.5em"><strong style="color:#fbbf24;font-size:0.75rem">USER</strong><pre style="margin:0.3em 0 0;white-space:pre-wrap;font-size:0.75rem;color:#888">' + esc(usr) + '</pre></div>';
        h += '</div></div>';
        return h;
    }}

    async function submitAsk() {{
        const q = input.value.trim();
        if (!q) return;
        input.value = '';
        askBtn.disabled = true;
        const msgId = 'm' + (++msgCounter);
        const pkList = pubkeyMeta.filter(p => activePubkeys.has(p.pubkey)).map(p => p.pubkey);

        // Show user message with prompt dropdown (system prompt shown immediately)
        var userHtml = esc(q) + '<div id="prompt-' + msgId + '">' + buildPromptHtml(cachedSystemPrompt, '') + '</div>';
        addMsg('user', userHtml, true);

        if (isQuestion(q)) {{
            // Step 1: Build prompt preview, update user message's prompt section
            var promptData = null;
            var promptEl = document.getElementById('prompt-' + msgId);
            try {{
                const previewResp = await fetch('/ask/preview', {{
                    method: 'POST',
                    headers: getHeaders({{ 'Content-Type': 'application/json' }}),
                    body: JSON.stringify({{ question: q, limit: 10, pubkeys: pkList }}),
                }});
                promptData = await previewResp.json();
                if (promptEl) {{
                    // Check if prompt section is currently expanded
                    var wasOpen = promptEl.querySelector('.sources-header + div');
                    var isOpen = wasOpen && wasOpen.style.display !== 'none';
                    promptEl.innerHTML = buildPromptHtml(promptData.system_prompt, promptData.user_prompt);
                    // Restore expanded state
                    if (isOpen) {{
                        var newBody = promptEl.querySelector('.sources-header + div');
                        if (newBody) newBody.style.display = 'block';
                    }}
                }}
            }} catch (e) {{
                console.error('Preview failed:', e);
            }}

            // Step 2: Thinking indicator + get answer
            addMsg('ai', '<span class="typing">Thinking</span>', false);
            try {{
                const resp = await fetch('/ask', {{
                    method: 'POST',
                    headers: getHeaders({{ 'Content-Type': 'application/json' }}),
                    body: JSON.stringify({{ question: q, limit: 10, pubkeys: pkList }}),
                }});
                const data = await resp.json();
                chat.lastChild.remove();

                // Render markdown answer with linked citations
                let answerHtml = renderMarkdown(data.answer);
                answerHtml = linkCitations(answerHtml, msgId);

                // Sources section
                let sourcesHtml = '';
                if (data.sources && data.sources.length) {{
                    sourcesHtml = '<div class="sources-list">';
                    sourcesHtml += '<div class="sources-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\\'none\\'?\\'block\\':\\'none\\'">Sources (' + data.sources.length + ') ▾</div>';
                    sourcesHtml += '<div class="sources-body" id="sources-body-' + msgId + '" style="display:none">';
                    for (let i = 0; i < data.sources.length; i++) {{
                        const s = data.sources[i];
                        const d = s.date ? new Date(s.date * 1000).toLocaleDateString() : '';
                        const link = s.event_id ? '<a class="primal-link" href="' + primalLink(s.event_id, s.kind) + '" target="_blank">open ↗</a>' : '';
                        sourcesHtml += '<div class="src-note" id="src-' + msgId + '-' + i + '">'
                            + '<div class="src-header"><span class="src-num">[' + (i+1) + ']</span> '
                            + '<span style="color:#93c5fd">' + esc(s.author) + '</span> '
                            + '<span class="meta">' + d + ' ' + (s.score*100).toFixed(0) + '%</span> '
                            + link
                            + '</div>'
                            + '<div class="src-text">' + esc(s.content) + '</div>'
                            + '</div>';
                    }}
                    sourcesHtml += '</div></div>';
                }}

                addMsg('ai', '<div class="answer-block">' + answerHtml + '</div>' + sourcesHtml, true);
            }} catch (e) {{
                chat.lastChild.remove();
                addMsg('ai', '<div class="error-msg"><strong>Request failed</strong><br>' + esc(e.message) + '</div>', true);
            }}
        }} else {{
            addMsg('ai', '<span class="typing">Searching</span>', false);
            try {{
                var searchUrl = '/search?q=' + encodeURIComponent(q) + '&limit=8';
                var pkParam = getActivePubkeys();
                if (pkParam) searchUrl += '&pubkeys=' + encodeURIComponent(pkParam);
                const resp = await fetch(searchUrl, {{ headers: getHeaders() }});
                const data = await resp.json();
                chat.lastChild.remove();

                if (data.error) {{
                    addMsg('ai', '<div class="error-msg">' + esc(data.error) + '</div>', true);
                }} else if (!data.count) {{
                    addMsg('ai', 'No results found.', true);
                }} else {{
                    let html = '<strong>' + data.count + ' results</strong>';
                    for (const r of data.results) {{
                        const ts = r.created_at ? new Date(r.created_at * 1000).toLocaleDateString() : '';
                        const link = r.event_id ? '<a class="primal-link" href="' + primalLink(r.event_id, r.kind) + '" target="_blank">open ↗</a>' : '';
                        html += '<div class="result-card">'
                            + '<span class="score">' + (r.score * 100).toFixed(1) + '%</span> '
                            + '<span class="meta">' + esc(r.author_label || '?') + ' &middot; ' + ts + '</span> '
                            + link
                            + '<br>' + esc(r.content.slice(0, 300))
                            + (r.content.length > 300 ? '...' : '')
                            + '</div>';
                    }}
                    addMsg('ai', html, true);
                }}
            }} catch (e) {{
                chat.lastChild.remove();
                addMsg('ai', '<div class="error-msg"><strong>Request failed</strong><br>' + esc(e.message) + '</div>', true);
            }}
        }}

        askBtn.disabled = false;
        input.focus();
    }}

    input.addEventListener('keydown', (e) => {{
        if (e.key === 'Enter' && !e.shiftKey) {{ e.preventDefault(); submitAsk(); }}
    }});

    // Auto-resize textarea
    input.addEventListener('input', () => {{
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 128) + 'px';
    }});
    </script>
</body>
</html>"""


@router.get("/status", response_model=StatusResponse)
async def status():
    """Qdrant collection status and configuration info."""
    settings = get_settings()

    try:
        client = get_qdrant_client()
        info = client.get_collection(settings.collection_name)
        return StatusResponse(
            collection=settings.collection_name,
            points_count=info.points_count,
            vector_size=info.config.params.vectors.size,
            status=info.status,
            llm_configured=False,
            llm_model=None,
            embedder="huggingface",
            keys_source="user-provided",
        )
    except Exception as e:
        log.error("Status check failed: %s", e)
        return StatusResponse(
            collection=settings.collection_name,
            keys_source="user-provided",
        )
