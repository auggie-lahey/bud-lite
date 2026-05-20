/**
 * Fetch kind:0 metadata for pubkeys from relays.
 * Single-user fetch races relays; batch uses collectQuery for efficiency.
 */

import { collectQuery } from '../core/relay.js';

const DEFAULT_RELAYS = [
  'wss://nos.lol',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
];

/** Parse kind:0 event content into metadata object */
function parseMeta(content) {
  try {
    const m = JSON.parse(content);
    return {
      name: m.name || m.display_name,
      picture: m.picture,
      about: m.about,
      nip05: m.nip05,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch kind:0 metadata for a single pubkey.
 * Races multiple relays, returns parsed profile or null.
 * @param {string} pubkey - Hex pubkey
 * @param {string[]} [relays]
 * @returns {Promise<{name, picture, about, nip05}|null>}
 */
export async function fetchMetadata(pubkey, relays = DEFAULT_RELAYS) {
  const filter = { kinds: [0], authors: [pubkey], limit: 1 };
  for (const url of relays) {
    try {
      const ws = new WebSocket(url);
      const ev = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { ws.close(); reject('timeout'); }, 4000);
        ws.onopen = () => ws.send(JSON.stringify(['REQ', 'meta-' + Date.now(), filter]));
        ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          if (data[0] === 'EVENT' && data[2]) {
            clearTimeout(timeout);
            ws.close();
            resolve(data[2]);
          }
          if (data[0] === 'EOSE') {
            clearTimeout(timeout);
            ws.close();
            resolve(null);
          }
        };
        ws.onerror = () => { clearTimeout(timeout); reject('ws error'); };
      });
      if (ev) {
        const meta = parseMeta(ev.content);
        if (meta) return meta;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Fetch kind:0 metadata for multiple pubkeys using a single batched relay query.
 * Uses collectQuery — one WebSocket per relay, not per pubkey. Much more efficient.
 * @param {string[]} pubkeys
 * @param {string[]} [relays]
 * @returns {Promise<Map<string, object>>}
 */
export async function fetchMetadataBatch(pubkeys, relays = DEFAULT_RELAYS) {
  const map = new Map();
  if (pubkeys.length === 0) return map;

  // Deduplicate pubkeys
  const unique = [...new Set(pubkeys)];

  // Single batched query — collectQuery handles all relays in parallel
  await collectQuery(relays, {
    kinds: [0],
    authors: unique,
    limit: unique.length,
  }, (event) => {
    const meta = parseMeta(event.content);
    if (meta) {
      // Keep the latest event per pubkey (kind:0 is replaceable)
      const existing = map.get(event.pubkey);
      if (!existing || (event.created_at > (existing._created_at || 0))) {
        map.set(event.pubkey, { ...meta, _created_at: event.created_at });
      }
    }
  });

  // Clean up internal field
  for (const [, meta] of map) {
    delete meta._created_at;
  }

  return map;
}
