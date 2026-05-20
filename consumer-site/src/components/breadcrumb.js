/**
 * Breadcrumb navigation component.
 *
 * Creates a section element with a nav trail from parts.
 * Each part can be a link or a plain span (the last item is plain).
 *
 * Pattern extracted from monolith breadcrumb rendering (lines 2612-2615, etc.).
 */

import { escHtml } from '../core/dom.js';

/**
 * Create a breadcrumb navigation section.
 *
 * @param {Array<{label: string, href?: string}>} parts - Breadcrumb segments
 *   The last part renders as plain text (current location), others render as links.
 * @returns {HTMLElement} A <section> element containing the breadcrumb nav
 */
export function createBreadcrumb(parts) {
  const section = document.createElement('section');
  section.className = 'border-b border-[var(--color-ia-border)] bg-[var(--color-ia-bg-soft)] py-4';

  const nav = document.createElement('nav');
  nav.className = 'text-[11px] text-zinc-500 mx-auto max-w-[1280px] px-4';

  // Build breadcrumb HTML from parts
  const items = parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    if (isLast) {
      // Current location — plain span
      return `<span class="text-zinc-700">${escHtml(part.label)}</span>`;
    }
    // Link to parent level
    return `<a class="hover:underline" href="${escHtml(part.href || '#/')}">${escHtml(part.label)}</a>`;
  });

  // Join with "›" separator
  nav.innerHTML = items.join(' \u203a ');
  section.appendChild(nav);

  return section;
}
