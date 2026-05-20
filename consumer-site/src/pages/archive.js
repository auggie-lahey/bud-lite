/** Archive page — #/archive/:pubkey — browse another user's archive. */

import { escHtml, inferKind, KIND_EMOJI } from '../core/dom.js';
import { createCard } from '../components/card.js';
import { createSearchBar } from '../components/search-bar.js';
import { createBreadcrumb } from '../components/breadcrumb.js';
import { attachKebabMenus } from '../components/kebab-menu.js';
import { collectQuery } from '../core/relay.js';
import { getRelayList, getBlossomBase } from '../core/settings.js';
import { extractManifestItems } from '../api/manifest.js';
import { fetchMetadata } from '../api/metadata.js';

export async function archivePage(params, store) {
  const [pubkey] = params;
  const main = document.querySelector('main');
  main.innerHTML = '';
  const cleanups = [];

  const relays = getRelayList();
  const blossomBase = getBlossomBase();

  // Fetch author metadata
  const meta = await fetchMetadata(pubkey, relays);
  const authorName = meta?.name || pubkey.slice(0, 16) + '...';
  const authorPicture = meta?.picture || null;

  // Breadcrumb
  main.appendChild(createBreadcrumb([
    { label: 'Home', href: '#/' },
    { label: authorName },
  ]));

  // Author header
  const header = document.createElement('section');
  header.className = 'border-b border-[var(--color-ia-border)] bg-white py-4';
  const pfpHtml = authorPicture
    ? `<img src="${escHtml(authorPicture)}" class="h-12 w-12 rounded-full object-cover flex-shrink-0" onerror="this.outerHTML='<div class=\\'ia-archive-avatar-fallback\\'>&#9786;</div>'">`
    : '<div class="ia-archive-avatar-fallback">&#9786;</div>';
  const aboutHtml = meta?.about
    ? `<p class="mt-1 text-sm text-zinc-600 line-clamp-2">${escHtml(meta.about)}</p>`
    : '';
  const nip05Html = meta?.nip05
    ? `<p class="text-xs text-[var(--color-ia-link)]">${escHtml(meta.nip05)}</p>`
    : '';
  header.innerHTML = `
    <div class="mx-auto max-w-[1280px] px-4 flex items-start gap-3">
      ${pfpHtml}
      <div class="min-w-0">
        <h1 class="text-lg font-semibold text-zinc-800">${escHtml(authorName)}</h1>
        <p class="text-xs text-zinc-400 font-mono">${pubkey.slice(0, 16)}...${pubkey.slice(-4)}</p>
        ${nip05Html}
        ${aboutHtml}
      </div>
    </div>`;
  main.appendChild(header);

  // Dynamic slots for filter/folder sections
  const filterSlot = document.createElement('div');
  main.appendChild(filterSlot);
  const folderSlot = document.createElement('div');
  main.appendChild(folderSlot);

  // Grid section
  const section = document.createElement('section');
  section.className = 'py-6';
  const container = document.createElement('div');
  container.className = 'mx-auto max-w-[1280px] px-4';

  const headerRow = document.createElement('div');
  headerRow.className = 'mb-4 flex items-center justify-between';
  const title = document.createElement('h2');
  title.className = 'text-sm font-semibold uppercase tracking-wider text-zinc-500';
  title.textContent = 'Loading...';
  headerRow.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'ia-items-grid';
  grid.id = 'archive-grid';

  // Search bar
  const { el: searchEl, cleanup: searchCleanup } = createSearchBar(grid);
  headerRow.appendChild(searchEl);
  cleanups.push(searchCleanup);

  // Kebab menus for cards
  cleanups.push(attachKebabMenus(grid, store));

  container.appendChild(headerRow);
  container.appendChild(grid);
  section.appendChild(container);
  main.appendChild(section);

  // Fetch manifests from this author
  const allItems = [];
  await collectQuery(relays, { kinds: [35128], authors: [pubkey], limit: 50 }, (event) => {
    const extracted = extractManifestItems(event);
    allItems.push(...extracted);
  });

  // Sort by date
  allItems.sort((a, b) => (b.added || 0) - (a.added || 0));

  // Filter state: null = browse mode (root only)
  let activeKind = null;
  let activeFolder = null;

  /** Root-level files (path has single segment) */
  function getRootFiles() {
    return allItems.filter(i => {
      const parts = i.path.split('/').filter(Boolean);
      return parts.length <= 1;
    });
  }

  /** Files filtered by active kind/folder */
  function getFiltered() {
    let items = allItems;
    if (activeKind) {
      items = items.filter(i => inferKind(i.mime) === activeKind);
    }
    if (activeFolder) {
      items = items.filter(i => {
        const parts = i.path.split('/').filter(Boolean);
        return parts.length >= 2 && parts[0] === activeFolder;
      });
    }
    return items;
  }

  /** Compute collection counts from all items */
  function computeCounts(items) {
    const counts = {};
    for (const item of items) {
      const k = inferKind(item.mime);
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }

  /** Compute folder map from items */
  function computeFolders(items) {
    const folderMap = {};
    for (const item of items) {
      const parts = item.path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const root = parts[0];
        if (!folderMap[root]) folderMap[root] = { count: 0, kind: inferKind(item.mime) };
        folderMap[root].count++;
      }
    }
    return folderMap;
  }

  /** Whether we're in filtered mode (showing specific collection/folder) */
  function isFiltered() {
    return activeKind !== null || activeFolder !== null;
  }

  /** Render collection badges */
  function renderFilters() {
    const counts = computeCounts(allItems);
    const showing = isFiltered() ? getFiltered() : getRootFiles();
    title.textContent = `${showing.length} file${showing.length !== 1 ? 's' : ''}`;

    filterSlot.innerHTML = '';
    const badges = document.createElement('section');
    badges.className = 'border-b border-[var(--color-ia-border)] bg-white py-3';
    badges.innerHTML = `
      <div class="mx-auto max-w-[1280px] px-4 flex flex-wrap gap-2">
        <button class="ia-filter-chip ${!isFiltered() ? 'active' : ''}" data-filter="all">All ${allItems.length}</button>
        ${Object.entries(counts).map(([kind, count]) => {
          const emoji = KIND_EMOJI[kind] || '\u{1F4C4}';
          const label = kind.charAt(0).toUpperCase() + kind.slice(1);
          return `<button class="ia-filter-chip ${activeKind === kind ? 'active' : ''}" data-kind="${kind}">${emoji} ${label} ${count}</button>`;
        }).join('')}
      </div>`;

    badges.querySelectorAll('[data-filter="all"]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeKind = null;
        activeFolder = null;
        renderFilters();
        renderFolders();
        renderGrid();
      });
    });
    badges.querySelectorAll('[data-kind]').forEach(btn => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.kind;
        activeKind = activeKind === kind ? null : kind;
        activeFolder = null;
        renderFilters();
        renderFolders();
        renderGrid();
      });
    });
    filterSlot.appendChild(badges);
  }

  /** Render folder chips */
  function renderFolders() {
    folderSlot.innerHTML = '';
    const items = activeKind ? allItems.filter(i => inferKind(i.mime) === activeKind) : allItems;
    const folderMap = computeFolders(items);
    const folderNames = Object.keys(folderMap).sort();
    if (folderNames.length === 0) return;

    const folderSection = document.createElement('section');
    folderSection.className = 'border-b border-[var(--color-ia-border)] bg-white py-3';
    folderSection.innerHTML = `
      <div class="mx-auto max-w-[1280px] px-4">
        <div class="flex flex-wrap gap-2">
          ${folderNames.map(name => {
            const info = folderMap[name];
            const emoji = KIND_EMOJI[info.kind] || '\u{1F4C1}';
            return `<button class="ia-filter-chip ${activeFolder === name ? 'active' : ''}" data-folder="${escHtml(name)}">${emoji} ${escHtml(name)} ${info.count}</button>`;
          }).join('')}
        </div>
      </div>`;

    folderSection.querySelectorAll('[data-folder]').forEach(btn => {
      btn.addEventListener('click', () => {
        const folder = btn.dataset.folder;
        activeFolder = activeFolder === folder ? null : folder;
        activeKind = null;
        renderFilters();
        renderFolders();
        renderGrid();
      });
    });
    folderSlot.appendChild(folderSection);
  }

  /** Render grid — root files in browse mode, filtered files otherwise */
  function renderGrid() {
    const items = isFiltered() ? getFiltered() : getRootFiles();
    grid.innerHTML = '';
    if (items.length === 0 && !isFiltered()) {
      grid.innerHTML = '<div class="col-span-full text-center py-8 text-zinc-400 text-sm">No files at root level. Browse collections or folders above.</div>';
      return;
    }
    if (items.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-8 text-zinc-400 text-sm">No files match this filter.</div>';
      return;
    }
    const seen = new Set();
    for (const item of items) {
      if (seen.has(item.sha256)) continue;
      seen.add(item.sha256);
      grid.appendChild(createCard(item, blossomBase));
    }
  }

  // Initial render
  if (allItems.length === 0) {
    title.textContent = '0 files';
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-zinc-400 text-sm">No files found in this archive.</div>';
  } else {
    renderFilters();
    renderFolders();
    renderGrid();
  }

  return function cleanup() {
    cleanups.forEach(fn => { try { fn(); } catch {} });
  };
}
