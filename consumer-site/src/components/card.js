/**
 * Archive item card — renders a clickable card for a manifest entry.
 *
 * Image thumbnails for image/* files, emoji fallback for other types.
 * Uses escHtml, fmtSize, inferKind, KIND_EMOJI from core/dom.js.
 *
 * Extracted from monolith makeCardFactory / makeCard (lines 2521-2555).
 */

import { escHtml, fmtSize, inferKind, KIND_EMOJI } from '../core/dom.js';

/**
 * Create a card element for a manifest item.
 *
 * @param {Object} item - Manifest item with title, sha256, mime, size, added, path
 * @param {string} blossomBase - Blossom server base URL (no trailing slash)
 * @returns {HTMLAnchorElement} Card element ready to append to grid
 */
export function createCard(item, blossomBase) {
  const kind = inferKind(item.mime);
  const emoji = KIND_EMOJI[kind] || '\u{1F4C4}';
  const size = fmtSize(item.size);
  const date = item.added
    ? new Date(item.added * 1000).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';
  const mimeShort = (item.mime || '')
    .split('/')
    .pop()
    .split(';')[0]
    .replace('application/', '')
    .replace('text/', '');

  const mi = (item.mime || '').toLowerCase();
  const thumbUrl = `${blossomBase}/${item.sha256}`;

  // Image thumbnails for image/* files, emoji fallback for others
  const thumbHtml = mi.startsWith('image/')
    ? `<img src="${thumbUrl}" alt="${escHtml(item.title)}" class="h-full w-full object-cover" loading="lazy">`
    : `<span class="text-5xl">${emoji}</span>`;

  const card = document.createElement('a');
  card.href = '#/details/' + item.sha256;
  card.className =
    'relative flex flex-col rounded-sm border border-[var(--color-ia-border)] bg-white text-inherit hover:shadow hover:no-underline';
  card.innerHTML = `
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 grid place-items-center text-zinc-400">
      ${thumbHtml}
    </div>
    <div class="p-2">
      <h3 class="text-xs font-semibold leading-snug line-clamp-2">${escHtml(item.title)}</h3>
      <div class="mt-1.5 flex items-center gap-1 text-[10px] ia-card-meta">
        ${
          mimeShort
            ? `<span class="ia-card-type rounded-sm bg-zinc-200 px-1 py-0.5 font-mono uppercase text-zinc-600">${escHtml(mimeShort)}</span>`
            : ''
        }
        <span class="ia-card-size text-zinc-400">${size}</span>
        <span class="ia-card-date text-zinc-400">${date}</span>
      </div>
    </div>`;

  // Store metadata on the element for search/sort/kebab access
  card.dataset.sha256 = item.sha256;
  card.dataset.manifestId = item.manifestId || '';
  card.dataset.manifestPubkey = item.manifestPubkey || '';
  card.dataset.manifestItem = '1';
  card.dataset.title = (item.title || '').toLowerCase();

  return card;
}
