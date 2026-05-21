/** Settings singleton — reads/writes localStorage. Single source of truth. */

const SETTINGS_KEY = 'ia-settings';

const DEFAULTS = {
  archiverNpub: 'npub172jyyndrmwfqlz7p4mtp2kftwhgawae2xqr3vx4s4elht5ddx4hsf3qcs',
  blossomUrl: 'https://blossom.primal.net',
  blossomMirror: 'https://nostr.download',
  relays: 'wss://nos.lol, wss://relay.damus.io, wss://relay.ngit.dev',
  manifestDtag: 'archive',
  ragBackendUrl: '',
  // Qdrant — auto-configured from deployed config or manual entry
  qdrantUrl: '',
  qdrantApiKey: '',
  qdrantCollection: 'nostr_rag',
  // API keys — stored in browser only, sent per-request
  hfApiKey: '',
  llmApiKey: '',
  llmBaseUrl: 'https://api.z.ai/api/paas/v4',
  llmModel: 'GLM-5.1',
  groqApiKey: '',
  geminiApiKey: '',
};

export function getSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const merged = { ...DEFAULTS, ...saved };
    // Migration: fix old hyphenated collection name
    if (merged.qdrantCollection === 'nostr-rag') {
      merged.qdrantCollection = 'nostr_rag';
      saveSettings(merged);
    }
    return merged;
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function getRelayList() {
  return getSettings().relays.split(',').map(r => r.trim()).filter(Boolean);
}

export function getBlossomBase() {
  return (getSettings().blossomUrl || DEFAULTS.blossomUrl).replace(/\/$/, '');
}
