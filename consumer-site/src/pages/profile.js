/**
 * Profile page — shows a user's compact soul (distilled Nostr profile).
 * Route: /p/:label or /p/:pubkey
 */

import { renderMarkdown } from '../components/rag-search.js';

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

    // Find pubkey by label or direct pubkey match
    let pubkey = null;
    let label = identifier;

    // Check if identifier is a pubkey (hex or starts like one)
    if (identifier.length >= 8) {
      for (const pk of Object.keys(labels)) {
        if (pk.startsWith(identifier) || pk === identifier) {
          pubkey = pk;
          label = labels[pk] || pk.slice(0, 8);
          break;
        }
      }
    }

    // Check by label (case-insensitive)
    if (!pubkey) {
      for (const [pk, lbl] of Object.entries(labels)) {
        if (lbl.toLowerCase() === identifier.toLowerCase()) {
          pubkey = pk;
          label = lbl;
          break;
        }
      }
    }

    if (!pubkey) {
      container.innerHTML = `<div class="ia-profile-error">Profile "${esc(identifier)}" not found.</div>
        <a href="#/chat" class="ia-profile-back">← Back to chat</a>`;
      return;
    }

    const hint = hints[pubkey] || '';
    const micro = micros[pubkey] || '';
    const picture = pictures[pubkey] || '';

    // Render profile
    container.innerHTML = `
      <div class="ia-profile-header">
        ${picture ? `<img src="${esc(picture)}" class="ia-profile-avatar" alt="${esc(label)}">` : `<div class="ia-profile-avatar-placeholder">${esc(label[0].toUpperCase())}</div>`}
        <div class="ia-profile-header-info">
          <h1 class="ia-profile-name">${esc(label)}</h1>
          <div class="ia-profile-links">
            <a href="https://primal.net/p/${pubkey}" target="_blank" class="ia-profile-ext-link">Nostr profile ↗</a>
          </div>
        </div>
      </div>

      ${hint ? `
      <div class="ia-profile-section">
        <h2 class="ia-profile-section-title">Compact Profile</h2>
        <p class="ia-profile-section-desc">How their Nostr posts are distilled (~1000 tokens)</p>
        <div class="ia-profile-soul-content">${renderMarkdown(hint)}</div>
      </div>` : '<div class="ia-profile-empty">No profile generated yet.</div>'}

      ${micro ? `
      <div class="ia-profile-section">
        <h2 class="ia-profile-section-title">Micro Summary</h2>
        <div class="ia-profile-micro">${esc(micro)}</div>
      </div>` : ''}

      <div class="ia-profile-footer">
        <p class="ia-profile-disclaimer">This profile was auto-generated from their public Nostr posts using AI.
        It may not be fully accurate. <a href="https://primal.net/p/${pubkey}" target="_blank">See original posts ↗</a></p>
        <a href="#/chat" class="ia-profile-back">← Back to chat</a>
      </div>`;
  })();

  return () => {};
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
