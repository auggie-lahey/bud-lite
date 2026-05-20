/**
 * Grid/List view toggle with column sorting.
 *
 * Extracted from monolith view toggle IIFE (lines 851-969).
 *
 * Manages:
 *   - Grid vs list view mode (persisted in localStorage)
 *   - List mode column headers (Name, Size, Type, Date)
 *   - Sort by column with ascending/descending toggle
 *   - CSS-driven layout switching via html[data-view] attribute
 *   - MutationObserver to inject toggles on route changes
 *
 * @param {HTMLElement} containerEl - Container element (e.g. heading) to append toggle to
 * @param {Object} store - Reactive store for viewMode and listSort state
 * @returns {Function} Cleanup function
 */

const VIEW_KEY = 'ia-view-mode';
const SORT_KEY = 'ia-list-sort';

function getMode() {
  return localStorage.getItem(VIEW_KEY) || 'grid';
}
function getSort() {
  return localStorage.getItem(SORT_KEY) || 'date-desc';
}
function setMode(mode) {
  localStorage.setItem(VIEW_KEY, mode);
  document.documentElement.setAttribute('data-view', mode);
  document
    .querySelectorAll('.ia-view-toggle button')
    .forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'list') {
    injectHeaders();
    sortItems();
  } else {
    removeHeaders();
    document
      .querySelectorAll('.ia-items-grid a')
      .forEach((a) => (a.style.order = ''));
  }
}

/** Create the view toggle button group */
function createToggle() {
  const wrap = document.createElement('span');
  wrap.className = 'ia-view-toggle';
  const mode = getMode();
  wrap.innerHTML = `<button data-mode="grid" class="${
    mode === 'grid' ? 'active' : ''
  }" title="Grid view">&#9638;</button><button data-mode="list" class="${
    mode === 'list' ? 'active' : ''
  }" title="List view">&#9776;</button>`;
  wrap.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => setMode(b.dataset.mode)),
  );
  return wrap;
}

/** Parse size string like "1.5 MB" into numeric bytes */
function parseSize(el) {
  const t = el.textContent;
  const m = t.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  return n * (u === 'GB' ? 1e9 : u === 'MB' ? 1e6 : u === 'KB' ? 1e3 : 1);
}

/** Parse type from the card's mono-spaced element */
function parseType(el) {
  return (
    el.querySelector("[class*='font-mono']")?.textContent?.toLowerCase() || ''
  );
}

/** Parse date from card text content */
function parseDate(el) {
  const t = el.textContent;
  // Try full datetime with AM/PM first
  const full = t.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,?\s+\d+,?\s+\d+:\d+\s*(AM|PM)/i,
  );
  if (full) {
    const d = new Date(full[0]);
    if (!isNaN(d)) return d.getTime();
  }
  // Fallback: date only
  const m = t.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,?\s+\d+/i,
  );
  return m ? new Date(m[0]).getTime() : 0;
}

/** Sort grid items using CSS order property */
function sortItems() {
  const sort = getSort();
  const [col, dir] = sort.split('-');
  document.querySelectorAll('.ia-items-grid').forEach((grid) => {
    const items = Array.from(grid.children);
    const pairs = items.map((el) => {
      let v;
      if (col === 'name')
        v = el.querySelector('h3')?.textContent?.toLowerCase() || '';
      else if (col === 'size') v = parseSize(el);
      else if (col === 'type') v = parseType(el);
      else v = parseDate(el);
      return { el, v };
    });
    pairs.sort((a, b) =>
      dir === 'asc' ? (a.v > b.v ? 1 : -1) : a.v < b.v ? 1 : -1,
    );
    // Use CSS order instead of DOM re-ordering (avoids React reconciliation conflicts)
    pairs.forEach((p, i) => (p.el.style.order = i));
  });
}

/** Inject list-mode column headers before each grid */
function injectHeaders() {
  // Clean up orphaned headers (parent replaced by route changes)
  document.querySelectorAll('.ia-list-header').forEach((h) => {
    const next = h.nextElementSibling;
    if (!next || !next.classList.contains('ia-items-grid')) h.remove();
  });
  document.querySelectorAll('.ia-items-grid').forEach((grid) => {
    if (grid.previousElementSibling?.classList.contains('ia-list-header'))
      return;
    const sort = getSort();
    const hdr = document.createElement('div');
    hdr.className = 'ia-list-header';
    hdr.innerHTML = [
      { col: 'name', label: 'Name' },
      { col: 'size', label: 'Size' },
      { col: 'type', label: 'Type' },
      { col: 'date', label: 'Date' },
    ]
      .map((c) => {
        const cls = sort.startsWith(c.col)
          ? sort.endsWith('asc')
            ? 'sort-asc'
            : 'sort-desc'
          : '';
        return `<span data-col="${c.col}" class="${cls}">${c.label}</span>`;
      })
      .join('');
    hdr.querySelectorAll('span').forEach((s) =>
      s.addEventListener('click', () => {
        const col = s.dataset.col;
        const cur = getSort();
        const next =
          cur === col + '-asc' ? col + '-desc' : col + '-asc';
        localStorage.setItem(SORT_KEY, next);
        injectHeaders();
        sortItems();
      }),
    );
    grid.parentElement.insertBefore(hdr, grid);
  });
}

/** Remove all list-mode headers */
function removeHeaders() {
  document.querySelectorAll('.ia-list-header').forEach((h) => h.remove());
}

/** Inject toggle buttons next to h2 elements that have grids in scope */
function injectToggles() {
  document.querySelectorAll('h2').forEach((h2) => {
    if (h2.querySelector('.ia-view-toggle')) return;
    const section = h2.closest('section') || h2.closest('div');
    const gridInScope = section && section.querySelector('.ia-items-grid');
    if (gridInScope) h2.appendChild(createToggle());
  });
}

/**
 * Mount the view toggle system.
 *
 * @param {HTMLElement} containerEl - Optional container to add toggle to
 * @param {Object} store - Reactive store for viewMode and listSort state
 * @returns {Function} Cleanup function
 */
export function mountViewToggle(containerEl, store) {
  const cleanups = [];

  // Apply initial mode
  setMode(getMode());

  /** Run injection passes to catch grids that mount later */
  function runOnce() {
    injectToggles();
    if (getMode() === 'list') {
      injectHeaders();
      sortItems();
    }
  }

  // Initial runs to catch early mount
  const timers = [];
  timers.push(setTimeout(runOnce, 1500));
  timers.push(setTimeout(runOnce, 4000));

  // Periodic re-apply to catch late data loads (fallback, relay responses)
  const interval = setInterval(runOnce, 5000);

  // Re-run on route navigation
  function onHashChange() {
    setTimeout(runOnce, 300);
  }
  window.addEventListener('hashchange', onHashChange);
  cleanups.push(() => window.removeEventListener('hashchange', onHashChange));

  function cleanup() {
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* noop */
      }
    });
    timers.forEach((t) => clearTimeout(t));
    clearInterval(interval);
  }

  return cleanup;
}
