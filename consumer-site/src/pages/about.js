/** About page — #/about — static info page. */

export function aboutPage(params, store) {
  const main = document.querySelector('main');
  main.innerHTML = `
    <div class="mx-auto max-w-[1280px] px-4 py-8">
      <h1 class="text-2xl font-semibold tracking-tight">About Internet Archive on Nostr</h1>
      <p class="mt-4 max-w-3xl text-sm text-zinc-600 leading-relaxed">
        This is a decentralized archival platform built on the Nostr protocol and Blossom content-addressed storage.
        Files are uploaded to Blossom servers, tracked via kind:35128 manifests, and discoverable through Nostr relays.
      </p>
      <h2 class="mt-6 text-lg font-semibold">How it works</h2>
      <ul class="mt-2 text-sm text-zinc-600 list-disc pl-5 space-y-1">
        <li>Files are stored on <strong>Blossom</strong> servers, content-addressed by SHA-256</li>
        <li>Personal archives are tracked as <strong>kind:35128</strong> (NIP-5A nsite) manifest events</li>
        <li>Bridge events (<strong>kind:1115</strong>) and index events (<strong>kind:1116</strong>) provide metadata</li>
        <li>URL archiving intent is signaled via <strong>kind:1621</strong> issue events</li>
        <li>Authentication uses <strong>NIP-07</strong> browser extensions (nos2x, Alby)</li>
      </ul>
      <p class="mt-6 text-xs text-zinc-400">Vibed with <a href="https://soapbox.pub/mkstack" class="text-[var(--color-ia-link)] hover:underline">MKStack</a></p>
    </div>`;
  return function cleanup() {};
}
