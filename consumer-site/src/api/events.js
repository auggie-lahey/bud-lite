/**
 * Event publishing helpers — NIP-07 signing, flag events, bridge + index events.
 *
 * Extracted from monolith signEvent / publishFlagEvent / publishBridgeAndIndex
 * logic (lines 1888-2260).
 */

import { publishEvent } from '../core/relay.js';
import { getSettings, getRelayList } from '../core/settings.js';
import { npubToHex } from '../core/crypto.js';

// MIME → folder classification map for auto-filing
const MIME_FOLDER_MAP = [
  ['application/pdf', 'texts'],
  ['text/', 'texts'],
  ['image/', 'images'],
  ['audio/', 'audio'],
  ['video/', 'video'],
  ['application/zip', 'software'],
  ['application/x-tar', 'software'],
  ['application/gzip', 'software'],
];

/**
 * Infer a default archive folder from a MIME type.
 *
 * @param {string} mime - MIME type string
 * @returns {string} Folder name (e.g. "texts", "images", "video", "other")
 */
function defaultFolder(mime) {
  for (const [prefix, folder] of MIME_FOLDER_MAP) {
    if (mime.startsWith(prefix)) return folder;
  }
  return 'other';
}

/**
 * Sign an event template using the NIP-07 browser extension.
 *
 * The template should have kind, content, tags, and created_at fields.
 * NIP-07 fills in pubkey and id and sig.
 *
 * @param {Object} template - Unsigned event template
 * @returns {Promise<Object>} Fully signed event with id, pubkey, sig
 */
export async function signEvent(template) {
  if (!window.nostr) {
    throw new Error('No NIP-07 signer found. Install nos2x or Alby.');
  }
  return window.nostr.signEvent(template);
}

/**
 * Publish a kind:1621 flag/issue event for URL archiving.
 *
 * Builds a NIP-34 style issue event signalling intent to archive a URL,
 * signs it via NIP-07, and publishes to all configured relays.
 *
 * @param {string}   url         - The URL to flag for archiving
 * @param {string}   title       - Human-readable title for the flag
 * @param {string}   folder      - Target folder in the archive
 * @param {string[]} topics      - Topic tags to categorize the flag
 * @param {string}   sourceKind  - Source kind (e.g. "webpage", "document")
 * @returns {Promise<{event: Object, results: Array}>}
 *   Signed event + per-relay publish results
 */
export async function publishFlagEvent(url, title, folder, topics, sourceKind) {
  const settings = getSettings();
  const relays = getRelayList();

  // Build the issue body content
  const issueBody = [
    `**URL:** ${url}`,
    title ? `**Title:** ${title}` : '',
    folder ? `**Folder:** ${folder}` : '',
    sourceKind ? `**Source kind:** ${sourceKind}` : '',
    topics.length ? `**Topics:** ${topics.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const issueTitle = title || `[archive] ${url}`;
  const now = Math.floor(Date.now() / 1000);

  // Assemble issue tags — reference archiver pubkey if configured
  const issueTags = [
    ['subject', issueTitle],
    ['t', 'archive'],
    ['r', url],
    ...topics.map(t => ['t', t]),
    ['alt', `Archive flag: ${issueTitle}`],
  ];

  // Add archiver as a p-tag so they receive the flag
  if (settings.archiverNpub) {
    const archiverHex = npubToHex(settings.archiverNpub);
    if (archiverHex) issueTags.push(['p', archiverHex]);
  }

  const template = {
    kind: 1621,
    content: issueBody,
    tags: issueTags,
    created_at: now,
  };

  // Sign via NIP-07
  const signed = await signEvent(template);

  // Publish to all configured relays
  const results = await publishEvent(signed, relays);

  return { event: signed, results };
}

/**
 * Publish a bridge event (kind:1115) and an index event (kind:1116).
 *
 * The bridge event links the file hash and manifest hash.
 * The index event references the bridge and adds searchable metadata
 * (title, folder, topics).
 *
 * @param {string}   fileSha      - SHA-256 hex of the uploaded file
 * @param {string}   manifestSha  - SHA-256 hex of the uploaded manifest
 * @param {string}   title        - Human-readable title
 * @param {string}   folder       - Target folder (or empty for auto-detect)
 * @param {string[]} topics       - Topic tags
 * @param {string}   mime         - MIME type of the file
 * @returns {Promise<{
 *   bridge: Object,
 *   index: Object,
 *   bridgeResults: Array,
 *   indexResults: Array
 * }>}
 *   Signed events + per-relay publish results for each
 */
export async function publishBridgeAndIndex(fileSha, manifestSha, title, folder, topics, mime) {
  const relays = getRelayList();
  const now = Math.floor(Date.now() / 1000);

  // --- Bridge event (kind 1115) ---
  // Links the file hash and manifest hash, marks manifest as primary
  const bridgeTemplate = {
    kind: 1115,
    content: '',
    created_at: now,
    tags: [
      ['x', fileSha],
      ['x', manifestSha],
      ['primary', manifestSha, ''], // size filled by relay/blossom downstream
    ],
  };
  const bridge = await signEvent(bridgeTemplate);

  // --- Index event (kind 1116) ---
  // References the bridge event and adds searchable metadata
  const autoFolder = folder || defaultFolder(mime || '');
  const indexTags = [
    ['e', bridge.id],
    ['title', title],
  ];

  // Add folder as a topic tag for auto-filing in the UI
  if (autoFolder) indexTags.push(['t', autoFolder]);

  // Add user-specified topic tags
  for (const t of topics) {
    indexTags.push(['t', t]);
  }

  const indexTemplate = {
    kind: 1116,
    content: '',
    created_at: now,
    tags: indexTags,
  };
  const indexEv = await signEvent(indexTemplate);

  // Publish both events to all relays
  const bridgeResults = await publishEvent(bridge, relays);
  const indexResults = await publishEvent(indexEv, relays);

  return {
    bridge,
    index: indexEv,
    bridgeResults,
    indexResults,
  };
}
