/** Home page — #/ route: hero, filter badges, folders, grid. */

import { escHtml, inferKind, KIND_EMOJI } from '../core/dom.js';
import { createCard } from '../components/card.js';
import { createSearchBar } from '../components/search-bar.js';
import { attachKebabMenus } from '../components/kebab-menu.js';
import { mountViewToggle } from '../components/view-toggle.js';

export function homePage(params, store) {
  const main = document.querySelector('main');
  main.innerHTML = '';
  const cleanups = [];

  // Grid section (persistent across re-renders)
  const section = document.createElement('section');
  section.className = 'py-6';
  const headerRow = document.createElement('div');
  headerRow.className = 'mx-auto max-w-[1280px] px-4 mb-4 flex items-center justify-between';
  const title = document.createElement('h2');
  title.className = 'text-sm font-semibold uppercase tracking-wider text-zinc-500';
  title.textContent = 'Latest additions';
  headerRow.appendChild(title);
  cleanups.push(mountViewToggle(headerRow, store));

  const grid = document.createElement('div');
  grid.className = 'ia-items-grid';
  grid.id = 'manifest-feed-grid';

  const container = document.createElement('div');
  container.className = 'mx-auto max-w-[1280px] px-4';
  container.appendChild(headerRow);
  container.appendChild(grid);
  section.appendChild(container);

  // Search bar
  const { el: searchEl, cleanup: searchCleanup } = createSearchBar(grid);
  headerRow.appendChild(searchEl);
  cleanups.push(searchCleanup);

  // Kebab menus (observer lives for the lifetime of this page)
  cleanups.push(attachKebabMenus(grid, store));

  /** Full render of all sections above the grid */
  function render(items) {
    const { user, blossomBase } = store.getState();

    // Remove old sections (everything before the grid section)
    while (main.firstChild && main.firstChild !== section) {
      main.removeChild(main.firstChild);
    }

    // Logged-out: show explore archive cards, hide grid
    if (!user?.pubkey) {
      section.style.display = 'none';
      const { exploreArchives } = store.getState();

      // Hero
      const hero = document.createElement('section');
      hero.className = 'bg-gradient-to-b from-[var(--color-ia-nav-hover)] to-[var(--color-ia-nav)] py-8 text-white';
      hero.innerHTML = `
        <div class="mx-auto max-w-[1280px] px-4">
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Internet Archive</h1>
          <p class="mt-1 max-w-3xl text-sm text-white/75">Decentralized archival via Nostr + Blossom. Browse public archives below, or login to manage your own.</p>
        </div>`;
      main.insertBefore(hero, section);

      // Archive cards section
      const explore = document.createElement('section');
      explore.className = 'py-6';

      if (exploreArchives.length === 0) {
        explore.innerHTML = `
          <div class="mx-auto max-w-[1280px] px-4 text-center py-12">
            <div class="text-zinc-400 text-sm">Loading archives from relays...</div>
          </div>`;
      } else {
        const hasMore = store.getState().exploreHasMore;
        explore.innerHTML = `
          <div class="mx-auto max-w-[1280px] px-4">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Public Archives (${exploreArchives.length})</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              ${exploreArchives.map(archive => {
                const pfp = archive.picture
                  ? `<img src="${archive.picture}" class="h-10 w-10 rounded-full object-cover" onerror="this.outerHTML='<div class=\\'ia-archive-avatar-fallback\\'>&#9786;</div>'">`
                  : '<div class="ia-archive-avatar-fallback">&#9786;</div>';
                const recentHtml = archive.recentFiles.length > 0
                  ? `<ul class="mt-2 space-y-0.5">${archive.recentFiles.map(f =>
                      `<li class="text-xs text-zinc-400 truncate">&#8226; ${escHtml(f)}</li>`
                    ).join('')}</ul>`
                  : '<div class="text-xs text-zinc-400 mt-1">No files yet</div>';
                return `
                  <a href="#/archive/${archive.pubkey}" class="block rounded-lg border border-[var(--color-ia-border)] bg-white p-4 hover:shadow-md transition-shadow no-underline">
                    <div class="flex items-center gap-3">
                      ${pfp}
                      <div class="min-w-0 flex-1">
                        <div class="font-medium text-sm text-zinc-800 truncate">${escHtml(archive.name)}</div>
                        <div class="text-xs text-zinc-500">${archive.fileCount} files</div>
                      </div>
                    </div>
                    ${recentHtml}
                  </a>`;
              }).join('')}
            </div>
            ${hasMore ? '<button class="ia-load-more-btn mt-6" id="ia-explore-load-more">Load More</button>' : ''}
          </div>`;

        // Wire up Load More button
        const loadMoreBtn = explore.querySelector('#ia-explore-load-more');
        if (loadMoreBtn) {
          let loadingMore = false;
          loadMoreBtn.addEventListener('click', async () => {
            if (loadingMore) return;
            loadingMore = true;
            loadMoreBtn.textContent = 'Loading...';
            try {
              if (window.__loadExploreMore) await window.__loadExploreMore();
            } catch (e) {
              console.error('[explore] load more failed:', e);
            }
            loadingMore = false;
          });
        }
      }
      main.insertBefore(explore, section);
      return;
    }

    section.style.display = '';

    // Compute counts
    const counts = {};
    for (const item of items) {
      const k = inferKind(item.mime);
      counts[k] = (counts[k] || 0) + 1;
    }

    // Hero
    const hero = document.createElement('section');
    hero.className = 'bg-gradient-to-b from-[var(--color-ia-nav-hover)] to-[var(--color-ia-nav)] py-8 text-white';
    hero.innerHTML = `
      <div class="mx-auto max-w-[1280px] px-4">
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Internet Archive</h1>
        <p class="mt-1 max-w-3xl text-sm text-white/75">Decentralized archival via Nostr + Blossom. Upload, sync, and share files.</p>
        <div class="mt-3 text-xs text-white/55">${items.length} synced files</div>
      </div>`;
    main.insertBefore(hero, section);

    // Collection filter badges
    const filters = document.createElement('section');
    filters.className = 'border-b border-[var(--color-ia-border)] bg-white py-4';
    filters.innerHTML = `
      <div class="mx-auto max-w-[1280px] px-4 flex flex-wrap gap-3">
        ${Object.entries(counts).map(([kind, count]) => {
          const emoji = KIND_EMOJI[kind] || '\u{1F4C4}';
          const label = kind.charAt(0).toUpperCase() + kind.slice(1);
          return `<a href="#/collection/${kind}" class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ia-border)] bg-white px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 no-underline">${emoji} ${label} <span class="font-semibold text-zinc-900">${count}</span></a>`;
        }).join('')}
      </div>`;
    main.insertBefore(filters, section);

    // Root-level folders
    const folderMap = {};
    for (const item of items) {
      const parts = item.path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const root = parts[0];
        if (!folderMap[root]) folderMap[root] = { count: 0, kind: inferKind(item.mime) };
        folderMap[root].count++;
      }
    }
    const folderNames = Object.keys(folderMap).sort();
    if (folderNames.length > 0) {
      const folderSection = document.createElement('section');
      folderSection.className = 'border-b border-[var(--color-ia-border)] bg-white py-4';
      folderSection.innerHTML = `
        <div class="mx-auto max-w-[1280px] px-4">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Folders</h2>
          <div class="flex flex-wrap gap-3">
            ${folderNames.map(name => {
              const info = folderMap[name];
              const emoji = KIND_EMOJI[info.kind] || '\u{1F4C1}';
              return `<a href="#/folder/${encodeURIComponent(name)}" class="flex items-center gap-2 rounded border border-[var(--color-ia-border)] bg-white px-4 py-2 text-sm text-zinc-700 hover:shadow no-underline">${emoji} <span class="font-medium">${escHtml(name)}</span> <span class="text-xs text-zinc-400">${info.count} files</span></a>`;
            }).join('')}
          </div>
        </div>`;
      main.insertBefore(folderSection, section);
    }

    // Update grid
    grid.innerHTML = '';
    const seen = new Set();
    for (const item of items.slice(0, 24)) {
      if (seen.has(item.sha256)) continue;
      seen.add(item.sha256);
      grid.appendChild(createCard(item, blossomBase));
    }
  }

  // Ensure section is in main
  main.appendChild(section);

  // Initial render
  render(store.getState().items);

  // Subscribe to items — full re-render when items update
  cleanups.push(store.subscribe('items', (newItems) => {
    render(newItems);
  }));

  // Subscribe to user — re-render on login/logout
  cleanups.push(store.subscribe('user', () => {
    render(store.getState().items);
  }));

  // Subscribe to exploreArchives — re-render when explore data arrives
  cleanups.push(store.subscribe('exploreArchives', () => {
    if (!store.getState().user?.pubkey) {
      render(store.getState().items);
    }
  }));

  return function cleanup() {
    cleanups.forEach(fn => { try { fn(); } catch {} });
  };
}
