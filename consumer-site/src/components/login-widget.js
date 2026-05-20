/**
 * Login widget — NIP-07 identity + kind:0 metadata.
 *
 * Extracted from monolith login IIFE (lines 733-848).
 *
 * Handles:
 *   - NIP-07 window.nostr.getPublicKey() login
 *   - Fetches kind:0 metadata from relays
 *   - Updates widget UI (avatar, name, logout button)
 *   - Shows/hides FABs based on login state
 *   - Auto-detects NIP-07 extension on load (with retries)
 *
 * @param {HTMLElement} container - DOM element to mount the widget into
 * @param {Object} store - Reactive store with subscribe/setState
 * @returns {Function} Cleanup function
 */
export function mountLoginWidget(container, store) {
  let currentUser = null; // { pubkey, name, picture, about, nip05 }
  const cleanups = [];

  /** Fetch kind:0 metadata from relays */
  async function fetchMetadata(pubkey) {
    const relays = [
      'wss://nos.lol',
      'wss://relay.damus.io',
      'wss://relay.nostr.band',
    ];
    const filter = { kinds: [0], authors: [pubkey], limit: 1 };
    for (const url of relays) {
      try {
        const ws = new WebSocket(url);
        const ev = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject('timeout');
          }, 4000);
          ws.onopen = () =>
            ws.send(JSON.stringify(['REQ', 'meta-' + Date.now(), filter]));
          ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              clearTimeout(timeout);
              ws.close();
              resolve(data[2]);
            }
            if (data[0] === 'EOSE') {
              clearTimeout(timeout);
              ws.close();
              resolve(null);
            }
          };
          ws.onerror = () => {
            clearTimeout(timeout);
            reject('ws error');
          };
        });
        if (ev) {
          try {
            const meta = JSON.parse(ev.content);
            return {
              name: meta.name || meta.display_name,
              picture: meta.picture,
              about: meta.about,
              nip05: meta.nip05,
            };
          } catch {
            /* ignore parse errors */
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  /** Simple HTML escaping for widget rendering */
  function escHtml(s) {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return (s || '')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  /** Update the widget UI */
  function renderWidget() {
    if (!currentUser) {
      container.innerHTML = '<div id="ia-login-prompt">Login</div>';
      container.title = 'Click to login with NIP-07';
      return;
    }

    const pfpHtml = currentUser.picture
      ? `<img id="ia-login-pfp" src="${escAttr(currentUser.picture)}" onerror="this.outerHTML='<div id=\\'ia-login-pfp\\' style=\\'display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:#6ee7b7\\'>&#9786;</div>'">`
      : `<div id="ia-login-pfp" style="display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:#6ee7b7">&#9786;</div>`;
    const name =
      currentUser.name || currentUser.pubkey.slice(0, 12) + '...';
    container.innerHTML = `${pfpHtml}<div id="ia-login-name">${escHtml(name)}</div><div style="color:#555;font-size:0.7rem;margin-left:0.3em;cursor:pointer" id="ia-logout-btn" title="Logout">&#10005;</div>`;
    container.title = `${currentUser.name || 'Anonymous'}\n${currentUser.pubkey.slice(0, 16)}...`;

    // Logout handler
    const logoutBtn = document.getElementById('ia-logout-btn');
    if (logoutBtn) {
      const onLogoutClick = (e) => {
        e.stopPropagation();
        logout();
      };
      logoutBtn.addEventListener('click', onLogoutClick);
      cleanups.push(() => logoutBtn.removeEventListener('click', onLogoutClick));
    }

    // Push user state into the store
    store.setState({ user: currentUser });
  }

  /** Login via NIP-07 */
  async function login() {
    sessionStorage.removeItem('ia-logged-out');
    if (!window.nostr || !window.nostr.getPublicKey) {
      alert(
        'No NIP-07 signer found. Install nos2x or Alby browser extension.',
      );
      return;
    }
    try {
      const pubkey = await window.nostr.getPublicKey();
      currentUser = { pubkey };
      renderWidget();

      // Fetch metadata in background
      const meta = await fetchMetadata(pubkey);
      if (meta) {
        currentUser = { ...currentUser, ...meta };
        renderWidget();
      }

      // Show archive + ingest FABs now that we're logged in
      const archiveFab = document.getElementById('ia-archive-fab');
      const ingestFab = document.getElementById('ingest-fab');
      if (archiveFab) archiveFab.classList.remove('hidden');
      if (ingestFab) ingestFab.classList.remove('hidden');
    } catch (e) {
      console.warn('Login failed:', e);
    }
  }

  /** Logout — clear user state and hide FABs */
  function logout() {
    currentUser = null;
    sessionStorage.setItem('ia-logged-out', '1');
    renderWidget();
    store.setState({ user: null });

    // Hide FABs
    const archiveFab = document.getElementById('ia-archive-fab');
    const ingestFab = document.getElementById('ingest-fab');
    if (archiveFab) archiveFab.classList.add('hidden');
    if (ingestFab) ingestFab.classList.add('hidden');

    // Close any open panels
    const archiveOverlay = document.getElementById('ia-archive-overlay');
    const ingestOverlay = document.getElementById('ingest-overlay');
    if (archiveOverlay) archiveOverlay.classList.add('hidden');
    if (ingestOverlay) ingestOverlay.classList.add('hidden');
  }

  /** Click handler — login if not logged in */
  function onWidgetClick() {
    if (currentUser) return; // already logged in, use logout button
    login();
  }
  container.addEventListener('click', onWidgetClick);
  cleanups.push(() => container.removeEventListener('click', onWidgetClick));

  // Auto-detect NIP-07 on load (skip if user explicitly logged out)
  function checkNip07() {
    if (sessionStorage.getItem('ia-logged-out')) return false;
    if (window.nostr && window.nostr.getPublicKey) {
      login();
      return true;
    }
    return false;
  }

  // Try immediately, then retry (extensions load async)
  const timers = [];
  if (!checkNip07()) {
    timers.push(setTimeout(checkNip07, 500));
    timers.push(setTimeout(checkNip07, 1500));
    timers.push(setTimeout(checkNip07, 3000));
  }

  // Subscribe to external user state changes
  const unsubUser = store.subscribe('user', (user) => {
    // Only update if the change came from outside this widget
    if (user === currentUser) return;
    if (!user && currentUser) logout();
  });
  cleanups.push(unsubUser);

  /** Remove all event listeners and timers */
  function cleanup() {
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* noop */
      }
    });
    timers.forEach((t) => clearTimeout(t));
  }

  return cleanup;
}
