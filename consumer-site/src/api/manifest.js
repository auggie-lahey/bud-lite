/**
 * Kind:35128 manifest CRUD operations.
 * Manages personal archive manifests following the NIP-5A (nsite) pattern.
 *
 * Extracted from monolith fetchManifest / parseManifestContent /
 * buildManifestContent / buildPathTags / updateManifest logic.
 */

import { raceQuery, publishEvent } from '../core/relay.js';
import { computeAggregateHash } from '../core/crypto.js';
import { getSettings, getRelayList } from '../core/settings.js';

/**
 * Fetch the latest kind:35128 manifest for a given pubkey + d-tag.
 *
 * Uses raceQuery to hit multiple relays in parallel — first relay to
 * return an EVENT wins.
 *
 * @param {string}   pubkeyHex  - Author pubkey in hex
 * @param {string}   dTag       - d-tag value (e.g. "archive")
 * @param {string[]} relayUrls  - Relay URLs to query
 * @returns {Promise<Object|null>} The manifest event, or null if not found
 */
export async function fetchManifest(pubkeyHex, dTag, relayUrls) {
  const filter = {
    kinds: [35128],
    authors: [pubkeyHex],
    '#d': [dTag],
    limit: 1,
  };
  return raceQuery(relayUrls, filter);
}

/**
 * Parse manifest content JSON into an entries object.
 *
 * The manifest content is a JSON string with the shape:
 *   { schema: "nostr-archive/v1", entries: { [path]: { sha256, title, ... } } }
 *
 * @param {string} content - Raw event content string
 * @returns {Object} Entries map keyed by path, or empty object on parse failure
 */
export function parseManifestContent(content) {
  try {
    const data = JSON.parse(content || '{}');
    return data.entries || {};
  } catch {
    return {};
  }
}

/**
 * Extract file items from a manifest event using both content and path tags.
 * Content entries are preferred (richer metadata). Path tags are used as fallback.
 *
 * @param {Object} event - Nostr kind:35128 event
 * @returns {Array<Object>} Array of file item objects
 */
export function extractManifestItems(event) {
  const items = [];
  const seenPaths = new Set();

  // Try content entries first (has richer metadata)
  const entries = parseManifestContent(event.content);
  for (const [path, meta] of Object.entries(entries)) {
    if (seenPaths.has(path)) continue;
    seenPaths.add(path);
    items.push({
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

  // Fall back to path tags for files not in content
  const pathTags = (event.tags || []).filter(t => t[0] === 'path' && t[1] && t[2]);
  for (const [, path, sha256] of pathTags) {
    if (seenPaths.has(path)) continue;
    seenPaths.add(path);
    items.push({
      title: path.split('/').pop(),
      sha256,
      mime: inferMimeFromPath(path),
      size: 0,
      added: event.created_at,
      path,
      manifestId: event.id,
      manifestPubkey: event.pubkey,
      topics: [],
      source: null,
      bridgeEventId: null,
      indexEventId: null,
    });
  }

  return items;
}

/** Infer MIME type from file path extension */
function inferMimeFromPath(path) {
  const ext = (path.split('.').pop() || '').toLowerCase();
  const map = {
    html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript',
    json: 'application/json', xml: 'text/xml', yaml: 'text/yaml', yml: 'text/yaml',
    txt: 'text/plain', md: 'text/plain', csv: 'text/csv',
    pdf: 'application/pdf', epub: 'application/epub+zip',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
    mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo',
    zip: 'application/zip', tar: 'application/x-tar', gz: 'application/gzip',
    exe: 'application/x-msdownload', dmg: 'application/x-apple-diskimage',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * Build manifest content JSON from an entries object.
 *
 * Produces the JSON string suitable for a kind:35128 event's content field.
 *
 * @param {Object} entries - Map of path → metadata objects
 * @returns {string} Pretty-printed JSON string with trailing newline
 */
export function buildManifestContent(entries) {
  return JSON.stringify({ schema: 'nostr-archive/v1', entries }, null, 2) + '\n';
}

/**
 * Build path tags array from an entries object.
 *
 * Each entry becomes a ["path", path, sha256] tag, which is the format
 * expected by NIP-5A for nsite path resolution.
 *
 * @param {Object} entries - Map of path → { sha256, ... } metadata
 * @returns {string[][]} Array of ["path", path, sha256] tags
 */
export function buildPathTags(entries) {
  return Object.entries(entries).map(([path, meta]) => ['path', path, meta.sha256]);
}

/**
 * Update (or create) the kind:35128 manifest for the logged-in user.
 *
 * Flow:
 *   1. Get user's pubkey via NIP-07 (window.nostr.getPublicKey)
 *   2. Fetch existing manifest from relays (if any)
 *   3. Merge new entries into existing entries
 *   4. Compute aggregate hash over all path tags
 *   5. Sign the updated kind:35128 event via NIP-07
 *   6. Publish to all configured relays
 *
 * @param {Object}   newEntries - Map of path → metadata to merge in
 *   Each value should have: sha256, title, added, source, topics,
 *   bridge_event_id, index_event_id, mime, size
 * @param {Object}   [settings] - Settings object (defaults to getSettings())
 * @returns {Promise<{event: Object, results: Array}>} Signed event + per-relay results
 */
export async function updateManifest(newEntries, settings) {
  if (!settings) settings = getSettings();

  // NIP-07: get user's public key
  if (!window.nostr || !window.nostr.getPublicKey) {
    throw new Error('No NIP-07 signer found. Install nos2x or Alby.');
  }
  const userPubkey = await window.nostr.getPublicKey();

  // Resolve relay list and manifest d-tag
  const relays = getRelayList();
  const manifestDtag = settings.manifestDtag || 'archive';

  // Fetch existing manifest entries (if any)
  const existing = await fetchManifest(userPubkey, manifestDtag, relays);
  const existingEntries = existing ? parseManifestContent(existing.content) : {};

  // Merge new entries into existing — new entries overwrite same paths
  const mergedEntries = { ...existingEntries, ...newEntries };

  // Build path tags and compute aggregate hash
  const pathTags = buildPathTags(mergedEntries);
  const aggHash = await computeAggregateHash(pathTags);

  // Assemble kind:35128 manifest event tags
  const manifestTags = [
    ...pathTags,
    ['d', manifestDtag],
    ['x', aggHash, 'aggregate'],
    ['title', 'Personal Archive'],
    ['server', settings.blossomUrl],
  ];
  // Add mirror server if configured
  if (settings.blossomMirror) {
    manifestTags.push(['server', settings.blossomMirror]);
  }

  // Build the event template
  const manifestTemplate = {
    kind: 35128,
    content: buildManifestContent(mergedEntries),
    created_at: Math.floor(Date.now() / 1000),
    tags: manifestTags,
  };

  // Sign via NIP-07
  const manifestEv = await window.nostr.signEvent(manifestTemplate);

  // Publish to all configured relays
  const results = await publishEvent(manifestEv, relays);

  return { event: manifestEv, results };
}
