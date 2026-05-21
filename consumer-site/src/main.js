/**
 * App bootstrap — creates store, router, mounts shell.
 * Single entry point for Vite.
 */

import './app.css';

import { createStore } from './core/store.js';
import { createRouter } from './core/router.js';
import { collectQuery } from './core/relay.js';
import { getSettings, getRelayList, getBlossomBase } from './core/settings.js';
import { parseManifestContent, extractManifestItems } from './api/manifest.js';
import { fetchMetadataBatch } from './api/metadata.js';
import { fetchFollowList } from './api/contacts.js';
import { mountLoginWidget } from './components/login-widget.js';
import { loadDeployedConfig } from './api/rag.js';
import { mountSettingsModal } from './components/settings-modal.js';
import { mountIngestPanel } from './components/ingest-panel.js';
import { mountArchiveBrowser } from './components/archive-browser.js';
import { mountRagChat } from './components/rag-search.js';

import { homePage } from './pages/home.js';
import { collectionPage } from './pages/collection.js';
import { folderPage } from './pages/folder.js';
import { detailsPage } from './pages/details.js';
import { aboutPage } from './pages/about.js';
import { archivePage } from './pages/archive.js';
import { explorePage } from './pages/explore.js';
import { chatPage } from './pages/chat.js';

// ── Constants ──────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Create store ───────────────────────────────────────────
const store = createStore({
  user: null,
  items: [],
  exploreArchives: [],
  exploreCacheTime: 0,
  exploreHasMore: true,
  followedPubkeys: [],
  blossomBase: '',
  cacheTime: 0,
  settings: getSettings(),
  viewMode: localStorage.getItem('ia-view-mode') || 'grid',
  listSort: localStorage.getItem('ia-list-sort') || 'date-desc',
  currentRoute: null,
});

// Apply initial view mode to html element
document.documentElement.setAttribute('data-view', store.getState().viewMode);

// ── Build app shell ────────────────────────────────────────
const app = document.getElementById('app');
app.innerHTML = `
  <div class="flex h-screen flex-col overflow-hidden">
    <header class="border-b border-white/10 bg-[var(--color-ia-nav)]">
      <div class="mx-auto flex h-12 max-w-[1280px] items-center justify-between px-4">
        <a href="#/" class="flex items-center gap-2 text-white no-underline">
          <span class="text-lg font-bold tracking-tight">IA</span>
          <span class="text-sm text-white/75">Internet Archive</span>
          <span class="text-xs text-white/55">on nostr</span>
        </a>
        <nav class="flex gap-4">
          <a href="#/chat" class="text-sm text-white/75 hover:text-white no-underline">Chat</a>
          <a href="#/explore" class="text-sm text-white/75 hover:text-white no-underline">Explore</a>
          <a href="#/collection/texts" class="text-sm text-white/75 hover:text-white no-underline">Texts</a>
          <a href="#/collection/images" class="text-sm text-white/75 hover:text-white no-underline">Images</a>
          <a href="#/collection/audio" class="text-sm text-white/75 hover:text-white no-underline">Audio</a>
          <a href="#/collection/video" class="text-sm text-white/75 hover:text-white no-underline">Video</a>
          <a href="#/collection/software" class="text-sm text-white/75 hover:text-white no-underline">Software</a>
          <a href="#/collection/web" class="text-sm text-white/75 hover:text-white no-underline">Web</a>
          <a href="#/about" class="text-sm text-white/75 hover:text-white no-underline">About</a>
        </nav>
      </div>
    </header>
    <main id="ia-main" class="flex-1 overflow-y-auto"></main>

    <footer class="border-t border-[var(--color-ia-border)] py-4 text-center text-xs text-zinc-500">
      Internet Archive on nostr \u00B7 kind:35128 manifests \u00B7 Blossom storage
    </footer>
  </div>

  <!-- Login widget -->
  <div id="ia-login-widget" title="Click to login">
    <div id="ia-login-prompt">Login</div>
  </div>

  <!-- Raw JSON viewer modal -->
  <div id="ia-raw-modal" class="hidden">
    <div id="ia-raw-content">
      <button id="ia-raw-close">&times;</button>
      <pre id="ia-raw-json"></pre>
    </div>
  </div>

  <!-- FABs -->
  <button id="ingest-fab" class="ia-fab hidden" title="Archive a URL">+</button>
  <button id="ia-archive-fab" class="ia-fab hidden" title="My Archive">\u{1F4C2}</button>
  <button id="ia-settings-fab" class="ia-fab" title="Settings">\u2699</button>

    <!-- Settings modal -->
    <div id="ia-settings-overlay" class="ia-overlay hidden">
      <div id="ia-settings-panel" class="ia-modal-panel">
        <h2>Settings <button id="ia-settings-close" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer">&times;</button></h2>
        <form id="ia-settings-form">
          <label>
            Default archiver npub
            <input type="text" id="set-archiver-npub">
          </label>
          <label>
            Blossom server
            <input type="text" id="set-blossom-url" placeholder="https://blossom.primal.net">
          </label>
          <label>
            Blossom mirror
            <input type="text" id="set-blossom-mirror" placeholder="https://nostr.download">
          </label>
          <label>
            Relays (comma-separated)
            <input type="text" id="set-relays" placeholder="wss://nos.lol, wss://relay.damus.io">
          </label>
          <label>
            Manifest d-tag
            <input type="text" id="set-manifest-dtag" placeholder="archive">
            <div class="hint">Identifier for your personal archive nsite (kind:35128)</div>
          </label>
          <label>
            RAG Backend URL
            <input type="text" id="set-rag-url" placeholder="http://localhost:8080">
            <div class="hint">Legacy: backend proxy URL. Not needed if Qdrant + LLM configured below.</div>
          </label>
          <hr style="border-color:#333;margin:0.8em 0">
          <h3 style="margin:0 0 0.5em;font-size:0.95rem;color:#6ee7b7">Direct API Access</h3>
          <div class="hint" style="margin-bottom:0.8em">Configure to call APIs directly from browser. No backend needed.</div>
          <label>
            Qdrant URL
            <input type="text" id="set-qdrant-url" placeholder="http://localhost:6333">
            <div class="hint">Qdrant instance URL (local or cloud.qdrant.io)</div>
          </label>
          <label>
            Qdrant API Key
            <input type="password" id="set-qdrant-key" placeholder="(optional for local)">
          </label>
          <label>
            Qdrant Collection
            <input type="text" id="set-qdrant-collection" placeholder="nostr-rag">
          </label>
          <hr style="border-color:#333;margin:0.8em 0">
          <h3 style="margin:0 0 0.5em;font-size:0.95rem;color:#6ee7b7">API Keys</h3>
          <div class="hint" style="margin-bottom:0.8em">Keys stored in your browser only. Backend never stores keys.</div>
          <label>
            HuggingFace (embeddings)
            <input type="password" id="set-hf-key" placeholder="hf_...">
            <div class="hint">Free at huggingface.co → Settings → Access Tokens</div>
          </label>
          <label>
            LLM API Key (Anthropic-compatible)
            <input type="password" id="set-llm-key" placeholder="sk-ant-...">
          </label>
          <label>
            LLM Base URL
            <input type="text" id="set-llm-base-url" placeholder="https://api.anthropic.com">
          </label>
          <label>
            LLM Model
            <input type="text" id="set-llm-model" placeholder="claude-sonnet-4-5-20250514">
          </label>
          <label>
            Groq (audio transcription)
            <input type="password" id="set-groq-key" placeholder="gsk_...">
          </label>
          <label>
            Gemini (image/PDF extraction)
            <input type="password" id="set-gemini-key" placeholder="AIza...">
          </label>
          <button type="submit" id="ia-settings-save">Save Settings</button>
        </form>
      </div>
    </div>

    <!-- Modal overlay (hidden by default) -->
    <div id="ingest-overlay" class="ia-overlay hidden">
      <section id="ingest-section" class="ia-modal-panel" style="max-width:640px">
        <h2>
          Archive
          <button id="ingest-close" type="button">&times;</button>
        </h2>
        <div class="ingest-tabs">
          <div class="ingest-tab active" data-tab="url">Flag URL</div>
          <div class="ingest-tab" data-tab="file">Upload File</div>
          <div class="ingest-tab" data-tab="sync">Sync Folder</div>
        </div>
        <form id="ingest-form">
          <!-- URL tab -->
          <div class="ingest-panel active" id="ingest-panel-url">
            <p class="hint">Flag a URL for archiving. Publishes a kind 1621 event to signal intent. Requires NIP-07 login (nos2x, Alby, etc).</p>
            <label>
              URL to archive
              <input type="url" id="ingest-url" placeholder="https://example.com/file.pdf">
            </label>
          </div>
          <!-- File upload tab -->
          <div class="ingest-panel" id="ingest-panel-file">
            <p class="hint">Upload a file directly from your browser. Signed with your Nostr identity.</p>
            <div id="ingest-file-drop">
              <div>Drop a file here or click to browse</div>
              <input type="file" id="ingest-file-input" style="display:none">
            </div>
            <div id="ingest-file-name" style="color:#6ee7b7;font-size:0.85rem;margin-top:0.5em"></div>
          </div>
          <!-- Folder sync tab -->
          <div class="ingest-panel" id="ingest-panel-sync">
            <p class="hint">Select a local folder to sync to your archive. Only new or changed files are uploaded. Folder name is saved so you can re-sync later.</p>
            <div id="ingest-sync-drop" style="border:2px dashed #2a2d34;border-radius:8px;padding:1.5em;text-align:center;cursor:pointer;color:#666;font-size:0.9rem;transition:border-color 0.2s">
              <div style="font-size:1.5em;margin-bottom:0.3em">&#128193;</div>
              <div>Click to select a folder</div>
              <input type="file" id="ingest-folder-input" webkitdirectory multiple style="display:none">
            </div>
            <div id="ingest-sync-info" style="color:#93c5fd;font-size:0.85rem;margin-top:0.5em"></div>
            <div id="ingest-sync-stored" style="display:none;color:#555;font-size:0.75rem;margin-top:0.2em"></div>
            <div id="ingest-sync-diff" style="margin-top:0.5em;font-size:0.8rem;max-height:150px;overflow-y:auto"></div>
            <div style="display:flex;align-items:center;gap:1em;margin-top:0.5em">
              <button type="button" id="ingest-sync-btn" style="display:none;padding:0.6em 1.5em;background:#6ee7b7;color:#111;border:none;border-radius:4px;font-size:1rem;cursor:pointer;font-weight:600">Sync to Archive</button>
              <label style="display:none;align-items:center;gap:0.4em;font-size:0.8rem;color:#888;cursor:pointer" id="ingest-sync-force-label">
                <input type="checkbox" id="ingest-sync-force"> Force re-sync all
              </label>
            </div>
          </div>
          <!-- Common fields -->
          <div class="ingest-row">
            <label>
              Title
              <input type="text" id="ingest-title" placeholder="(optional)">
            </label>
            <label>
              Folder path
              <input type="text" id="ingest-folder" placeholder="texts/my-folder">
            </label>
          </div>
          <div class="ingest-row">
            <label>
              Source kind
              <select id="ingest-source-kind">
                <option value="">— none —</option>
                <option value="webpage">webpage</option>
                <option value="document/pdf">document/pdf</option>
                <option value="audio/podcast">audio/podcast</option>
                <option value="audio/music">audio/music</option>
                <option value="video">video</option>
                <option value="image">image</option>
                <option value="software">software</option>
                <option value="text/book">text/book</option>
              </select>
            </label>
            <label>
              Topics <span style="color:#888;font-size:0.8rem">(comma-separated)</span>
              <input type="text" id="ingest-topics" placeholder="bitcoin, nostr">
            </label>
          </div>
          <div class="ingest-row">
            <label class="checkbox-label">
              <input type="checkbox" id="ingest-skip-ots" checked>
              Skip OTS timestamping (faster)
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="ingest-transcribe">
              Transcribe audio (whisper)
            </label>
          </div>
          <button type="submit" id="ingest-btn">Archive this URL</button>
        </form>
        <div id="ingest-progress" style="display:none;">
          <div id="ingest-steps"></div>
          <div id="ingest-current"></div>
        </div>
      </section>
    </div>

    <!-- Archive browser overlay -->
    <div id="ia-archive-overlay" class="ia-overlay hidden">
      <section id="ia-archive-section" class="ia-modal-panel" style="max-width:640px">
        <h2>
          <span>My Archive</span>
          <button id="ia-archive-close" type="button" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer">&times;</button>
        </h2>
        <div style="display:flex;gap:0.5em;margin-bottom:1em">
          <button id="ia-archive-sync-btn" type="button" style="padding:0.5em 1em;background:#6ee7b7;color:#111;border:none;border-radius:4px;font-size:0.85rem;cursor:pointer;font-weight:600">Sync Folder</button>
          <span id="ia-archive-status" style="color:#888;font-size:0.85rem;display:flex;align-items:center">Loading...</span>
        </div>
        <div id="ia-archive-tree"></div>
      </section>
    </div>`;

// ── Mount persistent components ─────────────────────────────
mountLoginWidget(document.getElementById('ia-login-widget'), store);
mountSettingsModal(store);
mountIngestPanel(store);
mountArchiveBrowser(store);

// ── Feed loading logic ─────────────────────────────────────

async function loadFeed() {
  // Must be logged in to fetch manifests — we need the user's pubkey
  const { user, cacheTime, items } = store.getState();
  if (!user?.pubkey) {
    store.setState({ items: [], cacheTime: 0 });
    return;
  }

  const relays = getRelayList();
  const blossomBase = getBlossomBase();

  // Check cache
  if (items.length > 0 && cacheTime && (Date.now() - cacheTime) < CACHE_TTL) {
    console.log('[feed] using cache', items.length, 'items');
    return;
  }

  console.log('[feed] streaming from', relays, 'for', user.pubkey.slice(0, 12) + '...');

  // Stream manifests from all relays in parallel
  const collected = [];
  await collectQuery(relays, { kinds: [35128], authors: [user.pubkey], limit: 50 }, (event) => {
    const entries = parseManifestContent(event.content);
    for (const [path, meta] of Object.entries(entries)) {
      collected.push({
        title: meta.title || path.split('/').pop(),
        sha256: meta.sha256,
        mime: meta.mime,
        size: meta.size,
        added: meta.added || event.created_at,
        path,
        manifestId: event.id,
        manifestPubkey: event.pubkey,
        topics: meta.topics || [],
        source: meta.source || null,
        bridgeEventId: meta.bridge_event_id || null,
        indexEventId: meta.index_event_id || null,
      });
    }
  });

  // Sort by date (newest first)
  collected.sort((a, b) => (b.added || 0) - (a.added || 0));
  console.log('[feed]', collected.length, 'items');

  // Update store — triggers any subscribed components
  store.setState({ items: collected, blossomBase, cacheTime: Date.now() });
}

// ── Explore loading ─────────────────────────────────────────

const EXPLORE_PAGE_SIZE = 20;

/**
 * Build explore filter based on login state.
 * Logged in: filter by followed pubkeys.
 * Logged out: fetch all recent manifests.
 */
function buildExploreFilter(until) {
  const { user, followedPubkeys } = store.getState();
  const filter = { kinds: [35128], limit: EXPLORE_PAGE_SIZE };
  if (user?.pubkey && followedPubkeys.length > 0) {
    filter.authors = followedPubkeys;
  }
  if (until) {
    filter.until = until;
  }
  return filter;
}

/**
 * Process manifest events into archive cards.
 * Returns array of exploreArchive objects.
 */
async function processExploreEvents(authorMap) {
  const relays = getRelayList();

  // Sort each author's items by date
  for (const author of authorMap.values()) {
    author.items.sort((a, b) => (b.added || 0) - (a.added || 0));
  }

  // Batch fetch kind:0 metadata
  const pubkeys = [...authorMap.keys()];
  const metadataMap = await fetchMetadataBatch(pubkeys, relays);

  // Build archive cards
  return pubkeys.map(pk => {
    const { items, manifestId } = authorMap.get(pk);
    const meta = metadataMap.get(pk) || {};
    return {
      pubkey: pk,
      name: meta.name || pk.slice(0, 12) + '...',
      picture: meta.picture || null,
      about: meta.about || null,
      fileCount: items.length,
      recentFiles: items.slice(0, 5).map(i => i.title),
      manifestId,
    };
  });
}

/** Track oldest timestamp for pagination */
let exploreOldestTs = null;

/** Load initial explore page */
async function loadExplore() {
  const { exploreCacheTime } = store.getState();
  if (exploreCacheTime && (Date.now() - exploreCacheTime) < CACHE_TTL) {
    console.log('[explore] using cache');
    return;
  }

  const relays = getRelayList();
  const blossomBase = getBlossomBase();
  const filter = buildExploreFilter();

  console.log('[explore] fetching manifests...', filter);

  const authorMap = new Map();
  let oldestTs = Infinity;

  await collectQuery(relays, filter, (event) => {
    const pk = event.pubkey;
    if (!authorMap.has(pk)) {
      authorMap.set(pk, { items: [], manifestId: event.id });
    }
    const author = authorMap.get(pk);
    author.items.push(...extractManifestItems(event));
    if (event.created_at < oldestTs) oldestTs = event.created_at;
  });

  exploreOldestTs = oldestTs < Infinity ? oldestTs : null;
  const archives = await processExploreEvents(authorMap);
  archives.sort((a, b) => b.fileCount - a.fileCount);

  console.log('[explore]', archives.length, 'archives');
  store.setState({
    exploreArchives: archives,
    blossomBase,
    exploreCacheTime: Date.now(),
    exploreHasMore: archives.length >= EXPLORE_PAGE_SIZE,
  });
}

/** Load next page of explore results — appends to existing */
async function loadExploreMore() {
  if (!exploreOldestTs) return;
  const relays = getRelayList();
  const blossomBase = getBlossomBase();
  const filter = buildExploreFilter(exploreOldestTs);

  console.log('[explore] loading more...', filter);

  const authorMap = new Map();
  let oldestTs = Infinity;
  const existing = store.getState().exploreArchives;
  const existingPubkeys = new Set(existing.map(a => a.pubkey));

  await collectQuery(relays, filter, (event) => {
    const pk = event.pubkey;
    if (!authorMap.has(pk)) {
      authorMap.set(pk, { items: [], manifestId: event.id });
    }
    const author = authorMap.get(pk);
    author.items.push(...extractManifestItems(event));
    if (event.created_at < oldestTs) oldestTs = event.created_at;
  });

  // Skip authors already in the list
  for (const pk of existingPubkeys) {
    authorMap.delete(pk);
  }

  exploreOldestTs = oldestTs < Infinity ? oldestTs : exploreOldestTs;
  const newArchives = await processExploreEvents(authorMap);
  newArchives.sort((a, b) => b.fileCount - a.fileCount);

  if (newArchives.length === 0) {
    store.setState({ exploreHasMore: false });
    return;
  }

  const merged = [...existing, ...newArchives];
  console.log('[explore] loaded', newArchives.length, 'more, total', merged.length);
  store.setState({
    exploreArchives: merged,
    blossomBase,
    exploreHasMore: newArchives.length >= EXPLORE_PAGE_SIZE,
  });
}

// Expose loadExploreMore globally for explore pages to call
window.__loadExploreMore = loadExploreMore;
window.__exploreHasMore = () => store.getState().exploreHasMore;

// ── Create router ──────────────────────────────────────────

const router = createRouter([
  { pattern: /^\/$/,                        handler: homePage },
  { pattern: /^\/chat$/,                    handler: chatPage },
  { pattern: /^\/explore$/,                 handler: explorePage },
  { pattern: /^\/archive\/([0-9a-f]{64})$/, handler: archivePage },
  { pattern: /^\/collection\/(.+)$/,        handler: collectionPage },
  { pattern: /^\/folder\/(.+)$/,            handler: folderPage },
  { pattern: /^\/details\/([0-9a-f]{64})$/, handler: detailsPage },
  { pattern: /^\/about$/,                   handler: aboutPage },
], store);

// Hide footer on chat page (full-height chat needs the space)
router.onNavigate = (path) => {
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = path === '/chat' ? 'none' : '';
};
// Also run on initial load
{
  const path = location.hash.replace(/^#/, '') || '/';
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = path === '/chat' ? 'none' : '';
}

// ── Initial feed load ──────────────────────────────────────

async function onUserChange(user) {
  if (user) {
    loadFeed().catch(err => console.error('[feed] load failed:', err));
    // Fetch follow list, then reload explore filtered by follows
    const relays = getRelayList();
    const follows = await fetchFollowList(user.pubkey, relays);
    store.setState({ followedPubkeys: follows });
    console.log('[contacts]', follows.length, 'followed pubkeys');
    // Reload explore filtered by follows
    store.setState({ exploreCacheTime: 0 });
    loadExplore().catch(err => console.error('[explore] load failed:', err));
  } else {
    store.setState({ items: [], cacheTime: 0, followedPubkeys: [], exploreCacheTime: 0 });
    loadExplore().catch(err => console.error('[explore] load failed:', err));
  }
}

// Subscribe to user state
store.subscribe('user', onUserChange);

// Load deployed Qdrant config (from TF outputs baked into the build)
loadDeployedConfig();

// Initial load
if (store.getState().user) {
  loadFeed().catch(err => console.error('[feed] load failed:', err));
} else {
  loadExplore().catch(err => console.error('[explore] load failed:', err));
}

// Refresh periodically
setInterval(() => {
  if (store.getState().user) {
    loadFeed().catch(() => {});
  } else {
    loadExplore().catch(() => {});
  }
}, CACHE_TTL);
