/**
 * Archive browser — reads kind:35128 manifest, renders folder tree.
 *
 * Extracted from monolith archive browser IIFE (lines 1172-1381).
 *
 * Manages:
 *   - Archive FAB click -> opens overlay, loads manifest from relays
 *   - Builds a folder tree from manifest entries
 *   - Renders collapsible folder tree with items
 *   - Click on item -> download from Blossom
 *   - Sync button -> opens ingest panel on sync tab
 *
 * @param {Object} store - Reactive store
 * @returns {Function} Cleanup function
 */

import { getSettings } from '../core/settings.js';
import { fetchManifest } from '../api/manifest.js';

/** Build a nested tree structure from flat manifest entries */
function buildTree(entries) {
  // entries = { "/folder/file.pdf": { title, sha256, mime, size, added, ... }, ... }
  const root = { name: '/', children: {}, items: [] };
  for (const [path, meta] of Object.entries(entries)) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) {
      // Root-level file
      root.items.push({ path, name: parts[0] || path, ...meta });
    } else {
      // Traverse/create folder nodes
      let node = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node.children[parts[i]]) {
          node.children[parts[i]] = {
            name: parts[i],
            children: {},
            items: [],
          };
        }
        node = node.children[parts[i]];
      }
      node.items.push({
        path,
        name: parts[parts.length - 1],
        ...meta,
      });
    }
  }
  return root;
}

/** Count total items in a tree node (recursive) */
function countItems(node) {
  let count = node.items.length;
  for (const child of Object.values(node.children)) {
    count += countItems(child);
  }
  return count;
}

/** Format bytes into human-readable size */
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/** Render tree as HTML string */
function renderTree(node, depth) {
  let html = '';
  // Render subfolders
  for (const [name, child] of Object.entries(node.children).sort()) {
    const itemCount = countItems(child);
    html += `<div class="ia-tree-folder">
      <div class="ia-tree-folder-header" onclick="this.parentElement.classList.toggle('open')">${name} <span style="color:#555;font-weight:400;font-size:0.75rem">(${itemCount})</span></div>
      <div class="ia-tree-folder-children">${renderTree(child, depth + 1)}</div>
    </div>`;
  }
  // Render items in this folder
  for (const item of node.items) {
    const sizeStr = formatSize(item.size);
    const dateStr = item.added
      ? new Date(item.added * 1000).toLocaleDateString()
      : '';
    html += `<div class="ia-tree-item" data-path="${item.path}" data-sha256="${item.sha256}" title="${item.path}">
      <span class="ia-tree-item-title">${item.title || item.name}</span>
      <span class="ia-tree-item-meta">${sizeStr}${dateStr ? ' &middot; ' + dateStr : ''}</span>
    </div>`;
  }
  return html;
}

/**
 * Mount the archive browser system.
 *
 * @param {Object} store - Reactive store
 * @returns {Function} Cleanup function
 */
export function mountArchiveBrowser(store) {
  const cleanups = [];

  const archiveFab = document.getElementById('ia-archive-fab');
  const archiveOverlay = document.getElementById('ia-archive-overlay');
  const archiveClose = document.getElementById('ia-archive-close');
  const archiveStatus = document.getElementById('ia-archive-status');
  const archiveTree = document.getElementById('ia-archive-tree');

  if (!archiveFab || !archiveOverlay) {
    console.warn('[archive-browser] Required DOM elements not found');
    return () => {};
  }

  /** Load and display the user's archive */
  async function loadArchive() {
    archiveStatus.textContent = 'Loading...';
    archiveTree.innerHTML = '';

    if (!window.nostr || !window.nostr.getPublicKey) {
      archiveStatus.textContent =
        'Login with NIP-07 extension to view your archive';
      return;
    }

    try {
      const pubkey = await window.nostr.getPublicKey();
      const settings = getSettings();
      const relays = settings.relays
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      archiveStatus.textContent = `Fetching manifest for ${pubkey.slice(0, 8)}...`;

      const manifest = await fetchManifest(
        pubkey,
        settings.manifestDtag || 'archive',
        relays,
      );

      console.log(
        '[archive] pubkey:',
        pubkey,
        'dtag:',
        settings.manifestDtag,
        'relays:',
        relays,
      );
      console.log(
        '[archive] manifest found:',
        manifest ? manifest.id : 'null',
      );
      if (manifest) console.log('[archive] manifest content:', manifest.content);

      if (!manifest) {
        archiveStatus.textContent =
          'No archive found. Upload files to create your personal archive.';
        archiveTree.innerHTML =
          '<div class="ia-tree-empty">Your archive is empty</div>';
        return;
      }

      // Parse manifest content
      let entries = {};
      try {
        const data = JSON.parse(manifest.content || '{}');
        entries = data.entries || {};
      } catch {
        // Fallback: build entries from path tags
        for (const tag of manifest.tags) {
          if (tag[0] === 'path' && tag[1] && tag[2]) {
            entries[tag[1]] = {
              sha256: tag[2],
              title: tag[1].split('/').pop(),
            };
          }
        }
      }

      const entryCount = Object.keys(entries).length;
      const created = new Date(
        manifest.created_at * 1000,
      ).toLocaleString();

      archiveStatus.textContent = `${entryCount} items, updated ${created}`;

      if (entryCount === 0) {
        archiveTree.innerHTML =
          '<div class="ia-tree-empty">Archive is empty</div>';
        return;
      }

      const tree = buildTree(entries);
      archiveTree.innerHTML = renderTree(tree, 0);

      // Auto-open first folder
      const firstFolder = archiveTree.querySelector('.ia-tree-folder');
      if (firstFolder) firstFolder.classList.add('open');

      // Click on item -> download from Blossom
      archiveTree.querySelectorAll('.ia-tree-item').forEach((item) => {
        const onClick = () => {
          const sha = item.dataset.sha256;
          const settings = getSettings();
          const blossomBase =
            settings.blossomUrl || 'https://blossom.primal.net';
          const url = `${blossomBase}/${sha}`;
          window.open(url, '_blank');
        };
        item.addEventListener('click', onClick);
        cleanups.push(() => item.removeEventListener('click', onClick));
      });
    } catch (e) {
      archiveStatus.textContent = `Error: ${e.message}`;
    }
  }

  // Archive FAB click -> open overlay and load archive
  function onFabClick() {
    archiveOverlay.classList.remove('hidden');
    loadArchive();
  }

  function onCloseClick() {
    archiveOverlay.classList.add('hidden');
  }

  function onOverlayClick(e) {
    if (e.target === archiveOverlay) {
      archiveOverlay.classList.add('hidden');
    }
  }

  // Sync button in archive browser -> opens ingest overlay on sync tab
  function onSyncClick() {
    archiveOverlay.classList.add('hidden');
    const ingestOverlay = document.getElementById('ingest-overlay');
    if (ingestOverlay) {
      ingestOverlay.classList.remove('hidden');
    }
    // Dispatch event for the ingestion script to switch to sync tab
    document.dispatchEvent(
      new CustomEvent('ia-switch-tab', { detail: { tab: 'sync' } }),
    );
  }

  archiveFab.addEventListener('click', onFabClick);
  if (archiveClose) archiveClose.addEventListener('click', onCloseClick);
  archiveOverlay.addEventListener('click', onOverlayClick);

  const syncBtn = document.getElementById('ia-archive-sync-btn');
  if (syncBtn) syncBtn.addEventListener('click', onSyncClick);

  cleanups.push(() => {
    archiveFab.removeEventListener('click', onFabClick);
    if (archiveClose)
      archiveClose.removeEventListener('click', onCloseClick);
    archiveOverlay.removeEventListener('click', onOverlayClick);
    if (syncBtn) syncBtn.removeEventListener('click', onSyncClick);
  });

  return () =>
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* noop */
      }
    });
}
