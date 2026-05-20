/** Shared DOM utilities — single definitions replacing all duplicates. */

export function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escAttr(s) {
  return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
}

export const KIND_EMOJI = {
  video: '\u{1F3AC}',
  audio: '\u{1F3B5}',
  images: '\u{1F5BC}',
  software: '\u{1F4E6}',
  web: '\u{1F310}',
  texts: '\u{1F4C4}',
};

export function inferKind(mime) {
  const m = (mime || '').toLowerCase();
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('image/')) return 'images';
  if (m === 'text/html') return 'web';
  if (/zip|tar|gz|xz|7z|rar/.test(m)) return 'software';
  return 'texts';
}

/** Show a toast notification that auto-fades. */
export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'ia-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

/** Create spinner element. */
export function createSpinner() {
  const el = document.createElement('div');
  el.className = 'mx-auto max-w-[1280px] px-4 py-12 text-center';
  el.innerHTML = '<div class="ia-spinner"></div><div class="mt-3 text-sm text-zinc-500">Loading archive...</div>';
  return el;
}
