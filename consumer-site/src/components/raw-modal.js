/**
 * Raw JSON modal — displays event data in a formatted JSON viewer.
 *
 * Extracted from monolith raw modal logic (lines 1015-1027).
 *
 * Creates the overlay + pre element on first use, reuses it for subsequent calls.
 *
 * @param {Object} event - Nostr event to display as formatted JSON
 * @returns {{ cleanup: Function }} Cleanup removes close handlers
 */

/** Lazy-created modal elements */
let modalEl = null;
let jsonPre = null;

/** Ensure the raw modal DOM exists (created once, reused) */
function ensureModal() {
  if (modalEl) return;

  // Create the overlay
  modalEl = document.createElement('div');
  modalEl.id = 'ia-raw-modal';
  modalEl.className = 'hidden';
  modalEl.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 99998',
    'background: rgba(0,0,0,0.7)',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'backdrop-filter: blur(4px)',
  ].join('; ');

  // Create the content container
  const content = document.createElement('div');
  content.id = 'ia-raw-content';
  content.style.cssText = [
    'width: 90%',
    'max-width: 700px',
    'max-height: 80vh',
    'overflow: auto',
    'background: #1a1a2e',
    'border: 1px solid #333',
    'border-radius: 8px',
    'padding: 1.2em',
    'color: #d8dadf',
    'font-family: monospace',
    'font-size: 12px',
    'white-space: pre-wrap',
    'word-break: break-all',
    'position: relative',
  ].join('; ');

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.id = 'ia-raw-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = [
    'position: absolute',
    'top: 8px',
    'right: 12px',
    'background: none',
    'border: none',
    'color: #888',
    'font-size: 1.3rem',
    'cursor: pointer',
  ].join('; ');
  closeBtn.addEventListener('click', () => {
    modalEl.classList.add('hidden');
    modalEl.style.display = 'none';
  });

  // Pre element for JSON content
  jsonPre = document.createElement('pre');
  jsonPre.id = 'ia-raw-json';

  content.appendChild(closeBtn);
  content.appendChild(jsonPre);
  modalEl.appendChild(content);
  document.body.appendChild(modalEl);

  // Close on backdrop click
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
    }
  });
}

/**
 * Show a raw JSON modal for the given Nostr event.
 *
 * @param {Object} event - The Nostr event to display
 * @returns {{ cleanup: Function }} Cleanup function
 */
export function showRawModal(event) {
  ensureModal();

  // Populate JSON content
  jsonPre.textContent = JSON.stringify(event, null, 2);

  // Show the modal
  modalEl.classList.remove('hidden');
  modalEl.style.display = 'flex';

  /** Close the modal and remove Escape handler */
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
      document.removeEventListener('keydown', onKeyDown);
    }
  }
  document.addEventListener('keydown', onKeyDown);

  function cleanup() {
    document.removeEventListener('keydown', onKeyDown);
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
    }
  }

  return { cleanup };
}
