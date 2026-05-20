/** Cryptographic helpers — SHA-256, bech32 decode, aggregate hash. */

export async function sha256(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getEventHash(ev) {
  const d = [0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content];
  return sha256(new TextEncoder().encode(JSON.stringify(d)));
}

/** Decode npub bech32 to hex string. */
export function npubToHex(npub) {
  // bech32 decode
  const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const pos = npub.lastIndexOf('1');
  const hrp = npub.slice(0, pos);
  const data = [];
  for (const c of npub.slice(pos + 1)) {
    data.push(charset.indexOf(c));
  }
  // Convert 5-bit to 8-bit
  const bytes = convertBits(data.slice(0, -6), 5, 8, false);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function convertBits(data, fromBits, toBits, pad) {
  let acc = 0, bits = 0;
  const result = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) result.push((acc << (toBits - bits)) & maxv);
  return result;
}

/** NIP-5A aggregate hash from path tags. */
export async function computeAggregateHash(pathTags) {
  const lines = pathTags.map(([, hash, path]) => `${hash} ${path}`).sort();
  return sha256(new TextEncoder().encode(lines.join('\n')));
}
