/** Folder page — #/folder/:name — grid of files in a folder. */

import { escHtml, inferKind, KIND_EMOJI } from '../core/dom.js';
import { createCard } from '../components/card.js';
import { createSearchBar } from '../components/search-bar.js';
import { createBreadcrumb } from '../components/breadcrumb.js';
import { attachKebabMenus } from '../components/kebab-menu.js';
import { mountViewToggle } from '../components/view-toggle.js';

export function folderPage(params, store) {
  const folderName = decodeURIComponent(params[0]);
  const main = document.querySelector('main');
  main.innerHTML = '';
  const { items, blossomBase } = store.getState();
  const cleanups = [];

  const folderItems = items.filter(item => {
    const parts = item.path.split('/').filter(Boolean);
    return parts.length >= 2 && parts[0] === folderName;
  });

  // Breadcrumb
  main.appendChild(createBreadcrumb([
    { label: 'Home', href: '#/' },
    { label: folderName },
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
  title.textContent = `\u{1F4C1} ${folderName} — ${folderItems.length} files`;
  headerRow.appendChild(title);
  cleanups.push(mountViewToggle(headerRow, store));

  const grid = document.createElement('div');
  grid.className = 'ia-items-grid';
  grid.id = 'manifest-folder-grid';

  container.appendChild(headerRow);
  container.appendChild(grid);
  section.appendChild(container);
  main.appendChild(section);

  // Search
  const { el: searchEl, cleanup: searchCleanup } = createSearchBar(grid);
  headerRow.appendChild(searchEl);
  cleanups.push(searchCleanup);

  // Populate grid
  for (const item of folderItems) {
    grid.appendChild(createCard(item, blossomBase));
  }

  // Kebab menus
  cleanups.push(attachKebabMenus(grid, store));

  return function cleanup() {
    cleanups.forEach(fn => { try { fn(); } catch {} });
  };
}
