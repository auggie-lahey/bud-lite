/**
 * Kebab menu for item cards — copy event ID, view raw JSON, edit, delete.
 *
 * Extracted from monolith kebab menu IIFE (lines 973-1169).
 *
 * Uses MutationObserver to inject kebab buttons onto cards as they appear.
 * Full menu actions: copy event ID, copy raw JSON, view raw JSON, edit, delete.
 * Delete removes item from the user's kind:35128 manifest and republishes.
 *
 * @param {HTMLElement} gridEl - Grid element containing card <a> elements
 * @param {Object} store - Reactive store for accessing state
 * @returns {Function} Cleanup function
 */

import { toast } from '../core/dom.js';
import { showRawModal } from './raw-modal.js';
import { getSettings } from '../core/settings.js';
import {
  fetchManifest,
  parseManifestContent,
  buildPathTags,
  buildManifestContent,
} from '../api/manifest.js';
import { computeAggregateHash } from '../core/crypto.js';
import { publishEvent } from '../core/relay.js';

/** Relay URLs for fetching event data */
const RELAYS = ['wss://nos.lol', 'wss://relay.damus.io'];

/** Currently open dropdown reference */
let openDropdown = null;

/** Cache fetched events by id */
const eventCache = new Map();

/** Fetch a Nostr event from relays by its ID */
async function fetchEvent(id) {
  if (eventCache.has(id)) return eventCache.get(id);
  for (const url of RELAYS) {
    try {
      const ws = new WebSocket(url);
      const ev = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject('timeout');
        }, 5000);
        ws.onopen = () =>
          ws.send(
            JSON.stringify(['REQ', 'kebab', { ids: [id], limit: 1 }]),
          );
        ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          if (data[0] === 'EVENT' && data[2]) {
            clearTimeout(timeout);
            ws.close();
            resolve(data[2]);
          }
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          reject('ws error');
        };
      });
      eventCache.set(id, ev);
      return ev;
    } catch {
      continue;
    }
  }
  return null;
}

/** Close the currently open dropdown menu */
function closeDropdown() {
  if (openDropdown) {
    openDropdown.btn.classList.remove('ia-kebab-open');
    openDropdown.menu.remove();
    openDropdown = null;
  }
}

/** Open the kebab dropdown menu for a card */
async function openMenu(btn, eventId) {
  closeDropdown();
  const menu = document.createElement('div');
  menu.className = 'ia-dropdown';

  // Menu items — each with a label and an async action
  const items = [
    {
      label: 'Copy Event ID',
      action: async () => {
        await navigator.clipboard.writeText(eventId);
        toast('Event ID copied');
      },
    },
    {
      label: 'Copy Raw JSON',
      action: async () => {
        const event = await fetchEvent(eventId);
        if (event) {
          await navigator.clipboard.writeText(
            JSON.stringify(event, null, 2),
          );
          toast('JSON copied');
        } else {
          toast('Failed to fetch event');
        }
      },
    },
    {
      label: 'View Raw Data',
      action: async () => {
        const event = await fetchEvent(eventId);
        if (event) showRawModal(event);
        else toast('Failed to fetch event');
      },
    },
    {
      label: 'Edit',
      action: async () => {
        // Navigate to details page — future: inline edit
        window.location.hash = `/details/${eventId}`;
      },
    },
    {
      label: 'Delete',
      danger: true,
      action: async () => {
        if (
          !confirm(
            'Delete this item? This removes it from your archive manifest.',
          )
        )
          return;
        if (!window.nostr) {
          toast('NIP-07 signer required');
          return;
        }
        try {
          const pubkey = await window.nostr.getPublicKey();
          const settings = getSettings();
          const relays = settings.relays
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean);

          // Fetch current manifest
          const manifest = await fetchManifest(
            pubkey,
            settings.manifestDtag || 'archive',
            relays,
          );
          if (!manifest) {
            toast('No manifest found');
            return;
          }

          const entries = parseManifestContent(manifest.content);

          // Find and remove entry with matching bridge or index event ID
          let removed = false;
          for (const [path, meta] of Object.entries(entries)) {
            if (
              meta.index_event_id === eventId ||
              meta.bridge_event_id === eventId
            ) {
              delete entries[path];
              removed = true;
              break;
            }
          }
          if (!removed) {
            toast('Item not found in manifest');
            return;
          }

          // Rebuild and publish updated manifest
          const pathTags = buildPathTags(entries);
          const aggHash = await computeAggregateHash(pathTags);
          const manifestTags = [
            ...pathTags,
            ['d', settings.manifestDtag || 'archive'],
            ['x', aggHash, 'aggregate'],
            ['title', 'Personal Archive'],
            ['server', settings.blossomUrl],
          ];

          const template = {
            kind: 35128,
            content: buildManifestContent(entries),
            created_at: Math.floor(Date.now() / 1000),
            tags: manifestTags,
          };
          const signed = await window.nostr.signEvent(template);
          await publishEvent(signed, relays);
          toast('Deleted from manifest');
          setTimeout(() => location.reload(), 1000);
        } catch (e) {
          toast('Delete failed: ' + e.message);
        }
      },
    },
  ];

  // Build dropdown buttons
  for (const item of items) {
    const btnEl = document.createElement('button');
    btnEl.className =
      'ia-dropdown-item' + (item.danger ? ' ia-danger' : '');
    btnEl.textContent = item.label;
    btnEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      closeDropdown();
      await item.action();
    });
    menu.appendChild(btnEl);
  }

  btn.classList.add('ia-kebab-open');
  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(menu);
  openDropdown = { btn, menu };

  // Fetch event in background for instant copy/view
  fetchEvent(eventId);
}

/**
 * Attach kebab menus to all cards in the grid.
 *
 * Scans for <a> elements linking to /details/, adds a kebab button
 * to each card that doesn't already have one.
 */
function injectKebabs() {
  const cards = document.querySelectorAll('a[href*="/details/"]');
  cards.forEach((card) => {
    if (card.querySelector('.ia-kebab')) return;

    // Use manifestId from data attribute, fall back to sha256 from href
    const eventId = card.dataset.manifestId || card.getAttribute('href')?.split('/details/')[1] || '';
    if (!eventId) return;

    const btn = document.createElement('button');
    btn.className = 'ia-kebab';
    btn.textContent = '\u22EE'; // vertical ellipsis
    btn.title = 'Actions';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (openDropdown && openDropdown.btn === btn) {
        closeDropdown();
      } else {
        openMenu(btn, eventId);
      }
    });

    // Attach kebab to card itself (works in both grid and list mode)
    card.style.position = 'relative';
    card.appendChild(btn);
  });
}

/**
 * Mount kebab menu system onto a grid element.
 *
 * @param {HTMLElement} gridEl - Grid element to observe for new cards
 * @param {Object} store - Reactive store
 * @returns {Function} Cleanup function
 */
export function attachKebabMenus(gridEl, store) {
  const cleanups = [];

  // Close dropdown on outside click
  function onDocumentClick(e) {
    if (
      openDropdown &&
      !openDropdown.menu.contains(e.target) &&
      e.target !== openDropdown.btn
    ) {
      closeDropdown();
    }
  }
  document.addEventListener('click', onDocumentClick);
  cleanups.push(() => document.removeEventListener('click', onDocumentClick));

  // Periodic injection — catches slow loads and route changes
  const timers = [];
  timers.push(setTimeout(injectKebabs, 2000));
  timers.push(setTimeout(injectKebabs, 5000));
  timers.push(setTimeout(injectKebabs, 10000));

  // Periodic check every 8s to catch slow loads
  const interval = setInterval(injectKebabs, 8000);

  // Re-inject on route navigation
  function onHashChange() {
    setTimeout(injectKebabs, 500);
  }
  window.addEventListener('hashchange', onHashChange);
  cleanups.push(() => window.removeEventListener('hashchange', onHashChange));

  // MutationObserver watches for new cards being added to the grid
  let observer = null;
  if (gridEl) {
    observer = new MutationObserver(() => {
      injectKebabs();
    });
    observer.observe(gridEl, { childList: true, subtree: true });
  }

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
    if (observer) observer.disconnect();
    closeDropdown();
  }

  return cleanup;
}
