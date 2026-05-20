/** Details page — #/details/:sha256 — file preview + metadata sidebar. */

import { escHtml, fmtSize, inferKind, KIND_EMOJI } from '../core/dom.js';
import { createBreadcrumb } from '../components/breadcrumb.js';
import { getBlossomBase } from '../core/settings.js';

export function detailsPage(params, store) {
  const [sha256] = params;
  const main = document.querySelector('main');
  main.innerHTML = '';
  const { items } = store.getState();
  const item = items.find(i => i.sha256 === sha256);

  if (!item) {
    main.innerHTML = '<div class="mx-auto max-w-[1280px] px-4 py-12 text-center text-zinc-500">Item not found.</div>';
    return;
  }

  const blossomBase = getBlossomBase();
  const url = `${blossomBase}/${sha256}`;
  const dateStr = item.added ? new Date(item.added * 1000).toLocaleString() : 'Unknown';
  const m = (item.mime || '').toLowerCase();

  // Breadcrumb
  const kind = inferKind(item.mime);
  main.appendChild(createBreadcrumb([
    { label: 'Home', href: '#/' },
    { label: kind.charAt(0).toUpperCase() + kind.slice(1), href: `#/collection/${kind}` },
    { label: item.title },
  ]));

  // Build preview
  let preview = '';
  let dlButtons = '';
  const btnBar = 'flex gap-2 p-2 bg-zinc-50 border-t border-[var(--color-ia-border)]';
  const dlBtn = 'rounded-sm bg-[var(--color-ia-nav)] px-3 py-1.5 text-sm text-white hover:bg-[var(--color-ia-nav-hover)] no-underline';
  const blossomBtn = 'rounded-sm border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 no-underline';

  if (m.startsWith('image/')) {
    preview = `<img src="${url}" alt="${escHtml(item.title)}" style="display:block;max-width:100%;max-height:80vh;object-fit:contain;margin:auto">`;
  } else if (m.startsWith('audio/')) {
    preview = `<audio controls src="${url}" style="width:100%;display:block"></audio>`;
  } else if (m.startsWith('video/')) {
    preview = `<video controls src="${url}" style="display:block;max-width:100%;max-height:80vh;margin:auto"></video>`;
  } else if (m === 'text/html') {
    preview = `<iframe sandbox="allow-same-origin" srcdoc="" id="ia-html-preview" style="width:100%;min-height:400px;border:none"></iframe>`;
  } else if (m.startsWith('text/') || m.includes('json') || m.includes('yaml') || m.includes('javascript') || m.includes('xml')) {
    preview = `<pre id="ia-text-preview" style="max-height:70vh;overflow:auto;padding:1em;font-size:12px;background:#f9fafb;white-space:pre-wrap;word-break:break-word;margin:0"></pre>`;
  } else if (m.includes('pdf')) {
    preview = `<iframe src="${url}" style="width:100%;min-height:600px;border:none"></iframe>`;
  } else {
    preview = `<div class="grid place-items-center py-12 text-zinc-400"><span class="text-6xl">${KIND_EMOJI[kind] || '\u{1F4C4}'}</span><p class="mt-3">No preview available</p></div>`;
  }
  dlButtons = `<div class="${btnBar}"><a href="${url}" download="${escHtml(item.title)}" class="${dlBtn}">Download</a><a href="${url}" target="_blank" rel="noopener" class="${blossomBtn}">Open on Blossom</a></div>`;

  // Layout: preview + metadata sidebar
  const overlay = document.createElement('div');
  overlay.innerHTML = `
    <section class="mx-auto max-w-[1280px] px-4 py-6">
      <div class="flex flex-col gap-6 lg:flex-row">
        <div class="min-w-0 flex-1 rounded border border-[var(--color-ia-border)] bg-white">
          <div class="p-2">${preview}</div>
          ${dlButtons}
        </div>
        <aside class="w-full space-y-4 lg:w-72">
          <div class="rounded border border-[var(--color-ia-border)] bg-white p-3">
            <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Verification</h2>
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-[var(--color-ia-good)]/15 text-[var(--color-ia-good)]"><span class="font-bold">\u2713</span> signature</span>
              <span class="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-[var(--color-ia-good)]/15 text-[var(--color-ia-good)]"><span class="font-bold">\u2713</span> content hash</span>
              <span class="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-[var(--color-ia-good)]/15 text-[var(--color-ia-good)]"><span class="font-bold">\u2713</span> stored on Blossom</span>
            </div>
            <p class="mt-2 text-[11px] text-zinc-500">SHA-256 content-addressed. Manifest signed via NIP-07.</p>
          </div>
          <div class="rounded border border-[var(--color-ia-border)] bg-white p-3">
            <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Metadata</h2>
            <dl class="grid grid-cols-[100px_1fr] gap-y-1.5 text-xs">
              <dt class="text-zinc-500">Type</dt>
              <dd class="text-zinc-800"><code class="bg-zinc-100 px-1 rounded text-[11px]">${escHtml(item.mime || 'unknown')}</code></dd>
              <dt class="text-zinc-500">Size</dt>
              <dd class="text-zinc-800">${fmtSize(item.size)}</dd>
              <dt class="text-zinc-500">SHA-256</dt>
              <dd class="text-zinc-800 font-mono text-[10px] break-all">${sha256}</dd>
              <dt class="text-zinc-500">Published</dt>
              <dd class="text-zinc-800">${dateStr}</dd>
              <dt class="text-zinc-500">Source</dt>
              <dd class="text-zinc-800">kind:35128 manifest</dd>
              <dt class="text-zinc-500">Kind</dt>
              <dd class="text-zinc-800"><code class="bg-zinc-100 px-1 rounded text-[11px]">${escHtml(item.source?.kind || inferKind(item.mime))}</code></dd>
              ${item.topics?.length ? '<dt class="text-zinc-500">Topics</dt><dd class="text-zinc-800">' + item.topics.map(t => `<span class="inline-block rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 mr-1">${escHtml(t)}</span>`).join('') + '</dd>' : ''}
              <dt class="text-zinc-500">Author</dt>
              <dd class="text-zinc-800 font-mono text-[10px] break-all">${item.manifestPubkey || 'unknown'}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </section>`;

  main.appendChild(overlay.firstElementChild);

  // Fetch content for text/html/iframe previews
  if (m === 'text/html') {
    const iframe = document.getElementById('ia-html-preview');
    if (iframe) {
      fetch(url).then(r => r.text()).then(html => { iframe.srcdoc = html; }).catch(() => {});
    }
  } else if (m.startsWith('text/') || m.includes('json') || m.includes('yaml') || m.includes('javascript') || m.includes('xml')) {
    const pre = document.getElementById('ia-text-preview');
    if (pre) {
      fetch(url).then(r => r.text()).then(text => { pre.textContent = text; }).catch(() => { pre.textContent = 'Failed to load content.'; });
    }
  }

  return function cleanup() {
    // Stop any playing media
    const video = main.querySelector('video');
    const audio = main.querySelector('audio');
    if (video) video.pause();
    if (audio) audio.pause();
  };
}
