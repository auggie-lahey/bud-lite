/** Explore page — #/explore — browse public archives from all users. */

import { escHtml } from '../core/dom.js';

export function explorePage(params, store) {
  const main = document.querySelector('main');
  main.innerHTML = '';
  const cleanups = [];

  // Hero
  const hero = document.createElement('section');
  hero.className = 'bg-gradient-to-b from-[var(--color-ia-nav-hover)] to-[var(--color-ia-nav)] py-8 text-white';
  hero.innerHTML = `
    <div class="mx-auto max-w-[1280px] px-4">
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Explore Archives</h1>
      <p class="mt-1 max-w-3xl text-sm text-white/75">Browse public archives from the Nostr network. Click any archive to explore its files.</p>
    </div>`;
  main.appendChild(hero);

  // Grid container for archive cards
  const section = document.createElement('section');
  section.className = 'py-6';
  const container = document.createElement('div');
  container.className = 'mx-auto max-w-[1280px] px-4';
  const grid = document.createElement('div');
  grid.className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';
  grid.id = 'explore-grid';

  // Load More button
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.className = 'mt-6 block mx-auto px-6 py-2 rounded border border-[var(--color-ia-border)] bg-white text-sm text-zinc-600 hover:bg-zinc-50 cursor-pointer';
  loadMoreBtn.textContent = 'Load More';
  loadMoreBtn.style.display = 'none';
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
    loadMoreBtn.textContent = 'Load More';
  });

  container.appendChild(grid);
  container.appendChild(loadMoreBtn);
  section.appendChild(container);
  main.appendChild(section);

  /** Render archive cards from exploreArchives state */
  function render() {
    const { exploreArchives, exploreHasMore } = store.getState();

    grid.innerHTML = '';
    if (exploreArchives.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-zinc-400 text-sm">Loading archives from relays...</div>
        </div>`;
      loadMoreBtn.style.display = 'none';
      return;
    }

    for (const archive of exploreArchives) {
      const pfp = archive.picture
        ? `<img src="${archive.picture}" class="h-10 w-10 rounded-full object-cover" onerror="this.outerHTML='<div class=\\'ia-archive-avatar-fallback\\'>&#9786;</div>'">`
        : '<div class="ia-archive-avatar-fallback">&#9786;</div>';
      const recentHtml = archive.recentFiles.length > 0
        ? `<ul class="mt-2 space-y-0.5">${archive.recentFiles.map(f =>
            `<li class="text-xs text-zinc-400 truncate">&#8226; ${escHtml(f)}</li>`
          ).join('')}</ul>`
        : '<div class="text-xs text-zinc-400 mt-1">No files yet</div>';

      const card = document.createElement('a');
      card.href = `#/archive/${archive.pubkey}`;
      card.className = 'block rounded-lg border border-[var(--color-ia-border)] bg-white p-4 hover:shadow-md transition-shadow no-underline';
      card.innerHTML = `
        <div class="flex items-center gap-3">
          ${pfp}
          <div class="min-w-0 flex-1">
            <div class="font-medium text-sm text-zinc-800 truncate">${escHtml(archive.name)}</div>
            <div class="text-xs text-zinc-500">${archive.fileCount} files</div>
          </div>
        </div>
        ${recentHtml}`;
      grid.appendChild(card);
    }

    loadMoreBtn.style.display = exploreHasMore ? 'block' : 'none';
  }

  // Initial render
  render();

  // Subscribe to exploreArchives updates
  cleanups.push(store.subscribe('exploreArchives', render));

  return function cleanup() {
    cleanups.forEach(fn => { try { fn(); } catch {} });
  };
}
