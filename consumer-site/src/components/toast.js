/**
 * Toast notification — re-exports the toast utility from core/dom.js.
 *
 * Shows a brief auto-fading notification at the bottom of the viewport.
 * Extracted from monolith toast() (used in kebab menu, settings, ingest, etc.).
 */

export { toast as showToast } from '../core/dom.js';
