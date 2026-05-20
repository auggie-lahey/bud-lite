/**
 * Search bar — filters grid cards by their dataset.title on input.
 *
 * Extracted from monolith search input pattern (lines 2804-2812, 2881-2889, etc.).
 */

/**
 * Create a search input element that filters cards in the given grid.
 *
 * @param {HTMLElement} gridEl - The grid element containing card <a> elements
 * @param {Object} [options] - Configuration
 * @param {string} [options.placeholder='Search files...'] - Input placeholder text
 * @param {string} [options.width='200px'] - Input width
 * @returns {{ el: HTMLInputElement, cleanup: Function }}
 */
export function createSearchBar(gridEl, options = {}) {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = options.placeholder || 'Search files...';
  input.className =
    'rounded-sm border border-[var(--color-ia-border)] bg-white px-3 py-1 text-sm text-[var(--color-ia-ink)] placeholder:text-zinc-400 outline-none focus:border-[var(--color-ia-link)]';
  input.style.width = options.width || '200px';

  /** Filter grid cards based on search query */
  function onInput() {
    const q = input.value.toLowerCase();
    const cards = gridEl.querySelectorAll('a[data-manifest-item]');
    cards.forEach((card) => {
      const title = card.dataset.title || '';
      card.style.display = title.includes(q) ? '' : 'none';
    });
  }

  input.addEventListener('input', onInput);

  function cleanup() {
    input.removeEventListener('input', onInput);
    input.remove();
  }

  return { el: input, cleanup };
}
