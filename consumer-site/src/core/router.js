/**
 * Single hash-based router. One hashchange listener total.
 * Each route handler receives (params, store) and returns a cleanup function.
 */

export function createRouter(routeDefs, store) {
  let currentCleanup = null;
  let _onNavigate = null;

  function navigate() {
    const raw = location.hash.replace(/^#/, '') || '/';

    for (const { pattern, handler } of routeDefs) {
      const m = raw.match(pattern);
      if (m) {
        if (currentCleanup) {
          try { currentCleanup(); } catch (e) { console.error('[router] cleanup error:', e); }
          currentCleanup = null;
        }
        const params = m.slice(1);
        const cleanup = handler(params, store);
        if (typeof cleanup === 'function') currentCleanup = cleanup;
        if (_onNavigate) _onNavigate(raw);
        return;
      }
    }

    // No match — 404
    if (currentCleanup) {
      try { currentCleanup(); } catch (e) { /* noop */ }
      currentCleanup = null;
    }
    const main = document.querySelector('main');
    if (main) main.innerHTML = '<div class="mx-auto max-w-[1280px] px-4 py-12 text-center text-zinc-500">Page not found.</div>';
    if (_onNavigate) _onNavigate(raw);
  }

  window.addEventListener('hashchange', navigate);
  navigate();

  const api = {
    destroy: () => window.removeEventListener('hashchange', navigate),
    set onNavigate(fn) { _onNavigate = fn; },
  };
  return api;
}
