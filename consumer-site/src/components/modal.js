/**
 * Generic modal overlay — creates a backdrop overlay with content.
 *
 * Closes on backdrop click and Escape key.
 * Returns { el, cleanup } for lifecycle management.
 *
 * Pattern extracted from monolith overlay/modal usage throughout.
 */

/**
 * Create a modal overlay element wrapping the given content.
 *
 * @param {HTMLElement} contentEl - Content to display inside the modal
 * @param {Object} [options] - Configuration
 * @param {string} [options.backdropClass=''] - Additional CSS classes for the overlay
 * @returns {{ el: HTMLDivElement, cleanup: Function }}
 */
export function createModal(contentEl, options = {}) {
  const overlay = document.createElement('div');
  overlay.className =
    'ia-modal-overlay' + (options.backdropClass ? ' ' + options.backdropClass : '');
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 9999',
    'background: rgba(0,0,0,0.6)',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'backdrop-filter: blur(4px)',
  ].join('; ');

  overlay.appendChild(contentEl);

  /** Close on backdrop click (clicking the overlay itself, not its children) */
  function onBackdropClick(e) {
    if (e.target === overlay) {
      cleanup();
    }
  }

  /** Close on Escape key */
  function onEscape(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  overlay.addEventListener('click', onBackdropClick);
  document.addEventListener('keydown', onEscape);

  /** Remove event listeners and DOM */
  function cleanup() {
    overlay.removeEventListener('click', onBackdropClick);
    document.removeEventListener('keydown', onEscape);
    overlay.remove();
  }

  return { el: overlay, cleanup };
}
