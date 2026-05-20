/** Settings singleton — reads/writes localStorage. Single source of truth. */

const SETTINGS_KEY = 'ia-settings';

const DEFAULTS = {
  archiverNpub: 'npub172jyyndrmwfqlz7p4mtp2kftwhgawae2xqr3vx4s4elht5ddx4hsf3qcs',
  blossomUrl: 'https://blossom.primal.net',
  blossomMirror: 'https://nostr.download',
  relays: 'wss://nos.lol, wss://relay.damus.io, wss://relay.ngit.dev',
  manifestDtag: 'archive',
  ragBackendUrl: 'http://localhost:8080',
  // Qdrant — direct browser access
  qdrantUrl: 'http://localhost:6333',
  qdrantApiKey: '',
  qdrantCollection: 'nostr-rag',
  // API keys — stored in browser only, sent per-request
  hfApiKey: '',
  llmApiKey: '',
  llmBaseUrl: 'https://api.anthropic.com',
  llmModel: 'claude-sonnet-4-5-20250514',
  groqApiKey: '',
  geminiApiKey: '',
};

export function getSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
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
