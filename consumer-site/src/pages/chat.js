/**
 * Chat page — full RAG chat interface with sessions, user filters, prompt transparency.
 */

import { mountRagChat } from '../components/rag-search.js';

export function chatPage(params, store) {
  const main = document.getElementById('ia-main');
  main.innerHTML = '';

  const cleanup = mountRagChat(main);

  return function() {
    if (typeof cleanup === 'function') cleanup();
    main.innerHTML = '';
  };
}
