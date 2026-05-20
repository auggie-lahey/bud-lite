/**
 * Fetch the user's kind:3 contact list (NIP-02).
 * Returns array of hex pubkeys the user follows.
 */

import { raceQuery } from '../core/relay.js';

/**
 * Fetch the latest kind:3 contact list for a pubkey.
 * Extracts all `p` tags → array of followed hex pubkeys.
 *
 * @param {string} pubkey - Hex pubkey of the user
 * @param {string[]} relays - Relay URLs to query
 * @returns {Promise<string[]>} Array of followed hex pubkeys
 */
export async function fetchFollowList(pubkey, relays) {
  try {
    const event = await raceQuery(relays, {
      kinds: [3],
      authors: [pubkey],
      limit: 1,
    });
    if (!event || !event.tags) return [];
    return event.tags
      .filter(t => t[0] === 'p' && t[1])
      .map(t => t[1]);
  } catch {
    return [];
  }
}
