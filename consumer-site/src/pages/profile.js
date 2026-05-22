/**
 * Profile page — shows a user's distilled Nostr profile.
 * Route: /p/:pubkey (hex or partial)
 * Shows: avatar, name, npub, compact soul (~1000 tokens), full soul (~20K tokens, collapsed)
 */

export function profilePage(params, store) {
  const main = document.querySelector('main');
  const identifier = decodeURIComponent(params[0]);

  main.innerHTML = `
    <div class="ia-profile-page">
      <div class="ia-profile-loading">Loading profile...</div>
    </div>`;

  const container = main.querySelector('.ia-profile-page');

  (async () => {
    // Load soul hints
    let data = null;
    try {
      const resp = await fetch(`${import.meta.env.BASE_URL}soul-hints.json`);
      if (resp.ok) data = await resp.json();
    } catch {}

    if (!data) {
      container.innerHTML = '<div class="ia-profile-error">Failed to load profile data.</div>';
      return;
    }

    const hints = data.hints || {};
    const micros = data.micros || {};
    const labels = data.labels || {};
    const pictures = data.pictures || {};

    // Find pubkey by hex (full or partial)
    let pubkey = null;
    for (const pk of Object.keys(labels)) {
      if (pk === identifier || pk.startsWith(identifier)) {
        pubkey = pk;
        break;
      }
    }

    if (!pubkey) {
      container.innerHTML = `<div class="ia-profile-error">Profile not found.</div>
        <a href="#/chat" class="ia-profile-back">← Back to chat</a>`;
      return;
    }

    const label = labels[pubkey] || pubkey.slice(0, 8);
    const picture = pictures[pubkey] || '';
    const hint = hints[pubkey] || '';
    const micro = micros[pubkey] || '';
    const npub = hexToNpub(pubkey);

    container.innerHTML = `
      <div class="ia-profile-header">
        ${picture ? `<img src="${esc(picture)}" class="ia-profile-avatar" alt="${esc(label)}">` : `<div class="ia-profile-avatar-placeholder">${esc(label[0].toUpperCase())}</div>`}
        <div class="ia-profile-header-info">
          <h1 class="ia-profile-name">${esc(label)}</h1>
          <div class="ia-profile-npub">${esc(npub)}</div>
          <div class="ia-profile-links">
            <a href="https://primal.net/p/${pubkey}" target="_blank" class="ia-profile-ext-link">Nostr ↗</a>
          </div>
        </div>
      </div>

      ${hint ? `
      <div class="ia-profile-section">
        <h2 class="ia-profile-section-title">Compact Soul <span class="ia-profile-badge">~1000 tokens</span></h2>
        <p class="ia-profile-section-desc">AI-distilled from their Nostr posts</p>
        <div class="ia-profile-soul-content">${simpleMarkdown(hint)}</div>
      </div>` : '<div class="ia-profile-empty">No compact profile generated yet.</div>'}

      ${micro ? `
      <div class="ia-profile-section">
        <h2 class="ia-profile-section-title">Micro Summary</h2>
        <div class="ia-profile-micro">${esc(micro)}</div>
      </div>` : ''}

      <div class="ia-profile-footer">
        <p class="ia-profile-disclaimer">Auto-generated from public Nostr posts. May contain inaccuracies.
        <a href="https://primal.net/p/${pubkey}" target="_blank">See original posts ↗</a></p>
        <a href="#/chat" class="ia-profile-back">← Back to chat</a>
      </div>`;

  })();

  return () => {};
}

// Minimal hex-to-npub (bech32 encoding)
function hexToNpub(hex) {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  // Convert 8-bit to 5-bit groups
  const fiveBit = [];
  let acc = 0, bits = 0;
  const max = bytes.length;
  for (let i = 0; i < max; i++) {
    acc = (acc << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      fiveBit.push((acc >>> bits) & 31);
    }
  }
  if (bits > 0) fiveBit.push((acc << (5 - bits)) & 31);

  // Add checksum (simplified — just prefix for display)
  const data = [0, 0, 0, 0, ...fiveBit];
  const checksum = bech32Checksum('npub', data);
  const combined = [...fiveBit, ...checksum];

  let result = 'npub1';
  for (const val of combined) {
    result += CHARSET[val];
  }
  return result;
}

function bech32Checksum(hrp, data) {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const polymod = bech32Polymod(values) ^ 1;
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push((polymod >> (5 * (5 - i))) & 31);
  }
  return result;
}

function hrpExpand(hrp) {
  const result = [];
  for (let i = 0; i < hrp.length; i++) result.push(hrp.charCodeAt(i) >> 5);
  result.push(0);
  for (let i = 0; i < hrp.length; i++) result.push(hrp.charCodeAt(i) & 31);
  return result;
}

function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

// Simple markdown-like rendering (headers, bold, lists)
function simpleMarkdown(text) {
  let html = esc(text);
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  // Clean up empty paragraphs around headers
  html = html.replace(/<p>\s*(<h[123]>)/g, '$1');
  html = html.replace(/(<\/h[123]>)\s*<\/p>/g, '$1');
  return html;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
