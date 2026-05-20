/**
 * Blossom upload + mirror upload.
 * Uses NIP-07 (window.nostr) for signing kind 24242 auth events.
 *
 * Extracted from monolith blossomUpload (lines 1893-1920).
 */

import { sha256 } from '../core/crypto.js';

/**
 * Upload a file to a Blossom server.
 *
 * Builds a kind:24242 auth event, signs it via NIP-07, and PUTs the file
 * to the server's /upload endpoint.
 *
 * @param {string}  url       - Blossom server base URL (e.g. "https://blossom.primal.net")
 * @param {Uint8Array} fileBytes - Raw file bytes
 * @param {string}  filename  - Original filename (sent as part of the request)
 * @param {string}  mimeType  - MIME type (e.g. "application/pdf")
 * @returns {Promise<{sha256: string, size: number, [key: string]: any}>}
 *   Server descriptor with sha256, size, and any extra fields the server returns.
 */
export async function blossomUpload(url, fileBytes, filename, mimeType) {
  // Hash the file contents
  const hex = await sha256(fileBytes);

  // Build kind 24242 auth event for Blossom authorization
  const authTemplate = {
    kind: 24242,
    content: 'nostr-archive: upload',
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'upload'],
      ['x', hex],
      ['expiration', String(Math.floor(Date.now() / 1000) + 600)],
    ],
  };

  // Sign via NIP-07 extension
  if (!window.nostr) {
    throw new Error('No NIP-07 signer found. Install nos2x or Alby.');
  }
  const signed = await window.nostr.signEvent(authTemplate);

  // Encode the signed event as base64 for the Authorization header
  const payload = JSON.stringify(signed);
  const authHeader = 'Nostr ' + btoa(payload);

  // PUT the file to the Blossom server
  const resp = await fetch(url.replace(/\/$/, '') + '/upload', {
    method: 'PUT',
    headers: {
      'Authorization': authHeader,
      'Content-Type': mimeType || 'application/octet-stream',
    },
    body: fileBytes,
  });

  if (!resp.ok) {
    throw new Error(`Blossom upload failed: ${resp.status} ${await resp.text()}`);
  }

  const desc = await resp.json();
  return { sha256: hex, size: fileBytes.byteLength, ...desc };
}

/**
 * Upload a file to a mirror Blossom server (non-fatal).
 *
 * Wraps blossomUpload — failures are caught and logged but not re-thrown,
 * since mirror uploads are best-effort.
 *
 * @param {string}  mirrorUrl - Mirror Blossom server base URL
 * @param {Uint8Array} fileBytes - Raw file bytes
 * @param {string}  filename  - Original filename
 * @param {string}  mimeType  - MIME type
 * @returns {Promise<{sha256: string, size: number} | null>}
 *   Server descriptor on success, null on failure.
 */
export async function blossomMirrorUpload(mirrorUrl, fileBytes, filename, mimeType) {
  try {
    return await blossomUpload(mirrorUrl, fileBytes, filename, mimeType);
  } catch (e) {
    // Mirror failure is non-fatal — log and move on
    console.warn(`Mirror upload to ${mirrorUrl} failed:`, e);
    return null;
  }
}
