/** Collection page — #/collection/:kind — filtered grid with sub-folders. */

import { escHtml, inferKind, KIND_EMOJI } from '../core/dom.js';
import { createCard } from '../components/card.js';
import { createSearchBar } from '../components/search-bar.js';
import { createBreadcrumb } from '../components/breadcrumb.js';
import { attachKebabMenus } from '../components/kebab-menu.js';
import { mountViewToggle } from '../components/view-toggle.js';

export function collectionPage(params, store) {
  const [collectionKind] = params;
  const main = document.querySelector('main');
  main.innerHTML = '';
  const { items, blossomBase } = store.getState();
  const cleanups = [];

  const collectionItems = items.filter(item => inferKind(item.mime) === collectionKind);
  const label = collectionKind.charAt(0).toUpperCase() + collectionKind.slice(1);
  const emoji = KIND_EMOJI[collectionKind] || '\u{1F4C4}';

  // Breadcrumb
  main.appendChild(createBreadcrumb([
    { label: 'Home', href: '#/' },
    { label },
  ]));

  // Section
  const section = document.createElement('section');
  section.className = 'py-6';
  const container = document.createElement('div');
  container.className = 'mx-auto max-w-[1280px] px-4';

  const headerRow = document.createElement('div');
  headerRow.className = 'mb-4 flex items-center justify-between';
  const title = document.createElement('h2');
  title.className = 'text-sm font-semibold uppercase tracking-wider text-zinc-500';
  title.textContent = `${emoji} ${label} — ${collectionItems.length} files`;
  headerRow.appendChild(title);
  cleanups.push(mountViewToggle(headerRow, store));

  // Sub-folders within this collection
  const subFolders = {};
  for (const item of collectionItems) {
    const parts = item.path.split('/').filter(Boolean);
    if (parts.length >= 3) {
      const sub = parts.slice(1, -1).join('/');
      subFolders[sub] = (subFolders[sub] || 0) + 1;
    }
  }
  const subNames = Object.keys(subFolders).sort();
  let folderRow = null;
  if (subNames.length > 0) {
    folderRow = document.createElement('div');
    folderRow.className = 'mb-4 flex flex-wrap gap-2';
    folderRow.innerHTML = subNames.map(name =>
      `<span class="inline-flex items-center gap-1 rounded-full border border-[var(--color-ia-border)] bg-white px-3 py-1 text-xs text-zinc-600 cursor-pointer hover:bg-zinc-50" data-folder="${escHtml(name)}">\u{1F4C1} ${escHtml(name)} <span class="text-zinc-400">(${subFolders[name]})</span></span>`
    ).join('');
  }

  const grid = document.createElement('div');
  grid.className = 'ia-items-grid';
  grid.id = 'manifest-collection-grid';

  container.appendChild(headerRow);
  if (folderRow) container.appendChild(folderRow);
  container.appendChild(grid);
  section.appendChild(container);
  main.appendChild(section);

  // Search
  const { el: searchEl, cleanup: searchCleanup } = createSearchBar(grid);
  headerRow.appendChild(searchEl);
  cleanups.push(searchCleanup);

  // Populate grid
  for (const item of collectionItems) {
    grid.appendChild(createCard(item, blossomBase));
  }

  // Kebab menus
  cleanups.push(attachKebabMenus(grid, store));

  // Sub-folder click filter
  if (folderRow) {
    folderRow.querySelectorAll('[data-folder]').forEach(chip => {
      chip.addEventListener('click', () => {
        const folder = chip.dataset.folder;
        grid.querySelectorAll('a[data-manifest-item]').forEach(card => {
          const ci = collectionItems.find(i => i.sha256 === card.dataset.sha256);
          const parts = ci?.path?.split('/').filter(Boolean) || [];
          const itemSub = parts.length >= 3 ? parts.slice(1, -1).join('/') : '';
          card.style.display = itemSub === folder ? '' : 'none';
        });
        folderRow.querySelectorAll('[data-folder]').forEach(c => c.classList.remove('bg-[var(--color-ia-link)]', 'text-white'));
        chip.classList.add('bg-[var(--color-ia-link)]', 'text-white');
      });
    });
  }

  return function cleanup() {
    cleanups.forEach(fn => { try { fn(); } catch {} });
  };
}
