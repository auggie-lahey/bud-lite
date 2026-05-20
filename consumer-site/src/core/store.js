/** Reactive pub/sub state container for vanilla JS. */

export function createStore(initialState) {
  const state = { ...initialState };
  const listeners = new Map();

  return {
    getState() {
      return state;
    },

    subscribe(key, fn) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(fn);
      return () => listeners.get(key)?.delete(fn);
    },

    setState(partial) {
      const prev = { ...state };
      Object.assign(state, partial);
      for (const key of Object.keys(partial)) {
        if (state[key] !== prev[key] && listeners.has(key)) {
          for (const fn of listeners.get(key)) {
            try { fn(state[key], prev[key]); } catch (e) { console.error(`[store] listener error for "${key}":`, e); }
          }
        }
      }
    },
  };
}
