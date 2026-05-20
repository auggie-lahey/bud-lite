/**
 * Ingestion panel — URL flagging, file upload, folder sync with FileSystem API.
 *
 * Extracted from monolith settings + ingestion IIFE (lines 1384-2337).
 * This is the biggest component.
 *
 * Manages three ingestion modes via tabs:
 *   1. URL Flagging -> kind:1621 issue event (NIP-34 style)
 *   2. File Upload -> Blossom upload + kind:1115 bridge + kind:1116 index
 *   3. Folder Sync -> FileSystem API recursive read, diff, bulk upload
 *
 * Also handles:
 *   - Ingest FAB click -> open modal
 *   - Close button and backdrop click -> close modal
 *   - Tab switching (including external ia-switch-tab events)
 *   - File drag-and-drop zone
 *   - Folder sync with IndexedDB handle persistence
 *   - Step progress indicator
 *
 * @param {Object} store - Reactive store
 * @returns {Function} Cleanup function
 */

import { getSettings } from '../core/settings.js';
import { toast, escHtml, fmtSize } from '../core/dom.js';
import { sha256, npubToHex, computeAggregateHash } from '../core/crypto.js';
import { idbGet, idbPut } from '../core/idb.js';
import { blossomUpload } from '../api/blossom.js';
import {
  fetchManifest,
  parseManifestContent,
  buildManifestContent,
  buildPathTags,
} from '../api/manifest.js';
import { publishEvent } from '../core/relay.js';

/** MIME -> default folder classification map */
const MIME_FOLDER_MAP = [
  ['application/pdf', 'texts'],
  ['text/', 'texts'],
  ['image/', 'images'],
  ['audio/', 'audio'],
  ['video/', 'video'],
  ['application/zip', 'software'],
  ['application/x-tar', 'software'],
  ['application/gzip', 'software'],
];

/** Infer default archive folder from MIME type */
function defaultFolder(mime) {
  for (const [prefix, folder] of MIME_FOLDER_MAP) {
    if (mime.startsWith(prefix)) return folder;
  }
  return 'other';
}

/** Read d-tag for the personal archive nsite */
function getManifestDtag() {
  return getSettings().manifestDtag || 'archive';
}

/**
 * Mount the full ingestion panel.
 *
 * @param {Object} store - Reactive store
 * @returns {Function} Cleanup function
 */
export function mountIngestPanel(store) {
  const cleanups = [];

  // --- DOM references ---
  const overlay = document.getElementById('ingest-overlay');
  const closeBtn = document.getElementById('ingest-close');
  const ingestFab = document.getElementById('ingest-fab');
  const ingestForm = document.getElementById('ingest-form');

  if (!overlay || !ingestForm) {
    console.warn('[ingest-panel] Required DOM elements not found');
    return () => {};
  }

  // --- Tab state ---
  let activeTab = 'url';

  // --- File state ---
  let selectedFile = null;

  // --- Folder sync state ---
  let syncDiff = null; // { toUpload: [...], unchanged: [...] }
  let dirHandle = null; // persisted FileSystemDirectoryHandle
  let lastReadFiles = null; // cached File[] for re-diff on force toggle

  const dropZone = document.getElementById('ingest-file-drop');
  const fileInput = document.getElementById('ingest-file-input');
  const fileNameEl = document.getElementById('ingest-file-name');

  const syncDrop = document.getElementById('ingest-sync-drop');
  const folderInput = document.getElementById('ingest-folder-input');
  const syncInfo = document.getElementById('ingest-sync-info');
  const syncStored = document.getElementById('ingest-sync-stored');
  const syncDiffEl = document.getElementById('ingest-sync-diff');
  const syncBtn = document.getElementById('ingest-sync-btn');
  const syncForceCheckbox = document.getElementById('ingest-sync-force');
  const syncForceLabel = document.getElementById('ingest-sync-force-label');

  // Check if showDirectoryPicker is available
  const hasDirectoryPicker =
    typeof window.showDirectoryPicker === 'function';

  // =========================================================================
  // --- Modal open/close ---
  // =========================================================================

  function onFabClick() {
    overlay.classList.remove('hidden');
  }

  function onCloseClick() {
    overlay.classList.add('hidden');
  }

  function onOverlayClick(e) {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
    }
  }

  if (ingestFab) ingestFab.addEventListener('click', onFabClick);
  closeBtn.addEventListener('click', onCloseClick);
  overlay.addEventListener('click', onOverlayClick);

  cleanups.push(() => {
    if (ingestFab) ingestFab.removeEventListener('click', onFabClick);
    closeBtn.removeEventListener('click', onCloseClick);
    overlay.removeEventListener('click', onOverlayClick);
  });

  // =========================================================================
  // --- Tab switching ---
  // =========================================================================

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.ingest-tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.tab === tab),
    );
    document.querySelectorAll('.ingest-panel').forEach((p) =>
      p.classList.toggle('active', p.id === `ingest-panel-${tab}`),
    );

    // Hide common fields + submit button when sync tab is active
    const isSync = tab === 'sync';
    document
      .querySelectorAll('#ingest-form > .ingest-row')
      .forEach((r) => (r.style.display = isSync ? 'none' : ''));
    document
      .querySelectorAll('#ingest-form > .checkbox-label')
      .forEach((r) => (r.style.display = isSync ? 'none' : ''));
    const ingestBtn = document.getElementById('ingest-btn');
    if (ingestBtn) ingestBtn.style.display = isSync ? 'none' : '';
  }

  // Tab click handlers
  document.querySelectorAll('.ingest-tab').forEach((tab) => {
    const onClick = () => switchTab(tab.dataset.tab);
    tab.addEventListener('click', onClick);
    cleanups.push(() => tab.removeEventListener('click', onClick));
  });

  // Listen for external tab switch events (e.g. archive browser sync button)
  function onSwitchTab(e) {
    switchTab(e.detail.tab);
  }
  document.addEventListener('ia-switch-tab', onSwitchTab);
  cleanups.push(() =>
    document.removeEventListener('ia-switch-tab', onSwitchTab),
  );

  // =========================================================================
  // --- File drop zone ---
  // =========================================================================

  /** Handle file selection from drop or input */
  function selectFile(f) {
    selectedFile = f;
    fileNameEl.textContent = `${f.name} (${(f.size / 1048576).toFixed(1)} MB)`;
  }

  if (dropZone) {
    const onDropClick = () => fileInput.click();
    const onDragOver = (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    };
    const onDragLeave = () => dropZone.classList.remove('dragover');
    const onDrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) selectFile(e.dataTransfer.files[0]);
    };

    dropZone.addEventListener('click', onDropClick);
    dropZone.addEventListener('dragover', onDragOver);
    dropZone.addEventListener('dragleave', onDragLeave);
    dropZone.addEventListener('drop', onDrop);

    cleanups.push(() => {
      dropZone.removeEventListener('click', onDropClick);
      dropZone.removeEventListener('dragover', onDragOver);
      dropZone.removeEventListener('dragleave', onDragLeave);
      dropZone.removeEventListener('drop', onDrop);
    });
  }

  if (fileInput) {
    const onChange = () => {
      if (fileInput.files.length) selectFile(fileInput.files[0]);
    };
    fileInput.addEventListener('change', onChange);
    cleanups.push(() => fileInput.removeEventListener('change', onChange));
  }

  // =========================================================================
  // --- Folder sync ---
  // =========================================================================

  /** Read all files from a FileSystemDirectoryHandle recursively */
  async function readHandleFiles(handle) {
    const files = [];
    async function walk(h, path) {
      for await (const entry of h.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          // Create a wrapper that includes webkitRelativePath
          const wrapped = new File([file], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });
          Object.defineProperty(wrapped, 'webkitRelativePath', {
            value: path + file.name,
            writable: false,
          });
          Object.defineProperty(wrapped, 'size', { value: file.size });
          files.push(wrapped);
        } else if (entry.kind === 'directory') {
          await walk(entry, path + entry.name + '/');
        }
      }
    }
    await walk(handle, handle.name + '/');
    return files;
  }

  /** Process selected folder: hash files, diff against manifest, show results */
  async function processFolderFiles(files) {
    if (!files.length) return;
    if (!window.nostr) {
      toast('NIP-07 extension required');
      return;
    }
    lastReadFiles = files; // cache for force toggle re-diff

    const rootFolder =
      files[0].webkitRelativePath?.split('/')[0] || 'folder';
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    syncInfo.textContent = `${rootFolder} — ${files.length} files — ${fmtSize(totalSize)}`;
    syncDiffEl.textContent = 'Computing diff...';
    syncBtn.style.display = 'none';
    syncForceLabel.style.display = 'inline-flex';

    try {
      // Hash all files
      const fileData = [];
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const hash = await sha256(buffer);
        const parts = file.webkitRelativePath.split('/');
        const relativePath = '/' + parts.slice(1).join('/'); // remove root folder name
        fileData.push({
          file,
          sha256: hash,
          relativePath,
          mime: file.type || 'application/octet-stream',
          size: file.size,
        });
      }

      // Fetch existing manifest
      const pubkey = await window.nostr.getPublicKey();
      const settings = getSettings();
      const relays = settings.relays
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
      const existing = await fetchManifest(
        pubkey,
        getManifestDtag(),
        relays,
      );
      const existingEntries = existing
        ? parseManifestContent(existing.content)
        : {};

      const forceReSync = syncForceCheckbox && syncForceCheckbox.checked;

      // Diff: new files, changed files, unchanged
      const newFiles = [];
      const changedFiles = [];
      const unchangedFiles = [];
      for (const fd of fileData) {
        if (forceReSync) {
          // Force mode: upload everything
          const ex = existingEntries[fd.relativePath];
          if (!ex) newFiles.push(fd);
          else changedFiles.push(fd);
        } else {
          const ex = existingEntries[fd.relativePath];
          if (!ex) newFiles.push(fd);
          else if (ex.sha256 !== fd.sha256) changedFiles.push(fd);
          else unchangedFiles.push(fd);
        }
      }

      syncDiff = {
        toUpload: [...newFiles, ...changedFiles],
        unchanged: unchangedFiles,
      };

      // Render diff
      let html = '';
      if (forceReSync && changedFiles.length > 0) {
        html += `<div style="color:#fbbf24;margin-bottom:0.3em">Force re-sync: ${changedFiles.length} files will be re-uploaded</div>`;
      }
      if (newFiles.length > 0) {
        html += `<div style="color:#6ee7b7;margin-bottom:0.3em">+ ${newFiles.length} new</div>`;
        for (const f of newFiles.slice(0, 8))
          html += `<div style="color:#6ee7b7;padding-left:1em">${escHtml(f.relativePath)} <span style="color:#555">${fmtSize(f.size)}</span></div>`;
        if (newFiles.length > 8)
          html += `<div style="color:#555;padding-left:1em">+${newFiles.length - 8} more</div>`;
      }
      if (changedFiles.length > 0 && !forceReSync) {
        html += `<div style="color:#fbbf24;margin:0.5em 0 0.3em">~ ${changedFiles.length} changed</div>`;
        for (const f of changedFiles.slice(0, 5))
          html += `<div style="color:#fbbf24;padding-left:1em">${escHtml(f.relativePath)}</div>`;
      }
      if (unchangedFiles.length > 0)
        html += `<div style="color:#555;margin-top:0.5em">= ${unchangedFiles.length} unchanged (skipped)</div>`;

      if (syncDiff.toUpload.length === 0) {
        html =
          '<div style="color:#6ee7b7">All files up to date. Nothing to sync.</div>';
        syncDiffEl.innerHTML = html;
        syncForceLabel.style.display = 'inline-flex';
      } else {
        syncDiffEl.innerHTML = html;
        syncBtn.style.display = 'inline-block';
        syncForceLabel.style.display = 'inline-flex';
        syncBtn.textContent = `Sync ${syncDiff.toUpload.length} files`;
      }

      // Save folder reference
      localStorage.setItem('ia-sync-folder', rootFolder);
    } catch (e) {
      syncDiffEl.innerHTML = `<div style="color:#f87171">Error: ${e.message}</div>`;
    }
  }

  // Restore saved folder handle on load
  (async () => {
    if (!hasDirectoryPicker) return;
    try {
      const saved = await idbGet('sync-dir-handle');
      if (saved) {
        const perm = await saved.queryPermission({ mode: 'read' });
        if (perm === 'granted') {
          dirHandle = saved;
          syncStored.style.display = 'block';
          syncStored.textContent = `Remembered folder: ${saved.name} (click to re-sync)`;
          syncDrop.querySelector('div:last-child').textContent = saved.name;
        }
      }
    } catch {
      /* ignore */
    }
  })();

  // Click on drop zone -> use saved handle or pick folder
  if (syncDrop) {
    const onSyncDropClick = async () => {
      if (hasDirectoryPicker) {
        // If we have a saved handle, try to use it first
        if (dirHandle) {
          try {
            const perm = await dirHandle.requestPermission({ mode: 'read' });
            if (perm === 'granted') {
              syncDiffEl.textContent = 'Reading folder...';
              const files = await readHandleFiles(dirHandle);
              await processFolderFiles(files);
              return;
            }
          } catch {
            /* fall through to picker */
          }
        }
        // No saved handle or permission denied -> open picker
        try {
          const handle = await window.showDirectoryPicker({ mode: 'read' });
          dirHandle = handle;
          await idbPut('sync-dir-handle', handle);
          syncStored.style.display = 'block';
          syncStored.textContent = `Folder saved: ${handle.name} (remembered for next visit)`;
          syncDrop.querySelector('div:last-child').textContent = handle.name;
          const files = await readHandleFiles(handle);
          await processFolderFiles(files);
        } catch (e) {
          if (e.name !== 'AbortError')
            console.warn('Directory picker error:', e);
        }
      } else {
        // Fallback for non-Chromium browsers
        folderInput.click();
      }
    };
    syncDrop.addEventListener('click', onSyncDropClick);
    cleanups.push(() => syncDrop.removeEventListener('click', onSyncDropClick));
  }

  // Re-click stored hint to re-sync saved folder
  if (syncStored) {
    const onStoredClick = async () => {
      if (!dirHandle) return;
      try {
        const perm = await dirHandle.requestPermission({ mode: 'read' });
        if (perm !== 'granted') {
          toast('Permission denied for folder access');
          return;
        }
        syncDiffEl.textContent = 'Reading folder...';
        const files = await readHandleFiles(dirHandle);
        await processFolderFiles(files);
      } catch (e) {
        syncDiffEl.innerHTML = `<div style="color:#f87171">Error: ${e.message}</div>`;
      }
    };
    syncStored.addEventListener('click', onStoredClick);
    syncStored.style.cursor = 'pointer';
    cleanups.push(() => syncStored.removeEventListener('click', onStoredClick));
  }

  // Fallback: <input webkitdirectory>
  if (folderInput) {
    const onFolderChange = () => {
      if (folderInput.files.length > 0)
        processFolderFiles(Array.from(folderInput.files));
    };
    folderInput.addEventListener('change', onFolderChange);
    cleanups.push(() =>
      folderInput.removeEventListener('change', onFolderChange),
    );
  }

  // Re-diff when force checkbox toggles (uses cached files)
  if (syncForceCheckbox) {
    const onForceChange = () => {
      if (lastReadFiles) processFolderFiles(lastReadFiles);
    };
    syncForceCheckbox.addEventListener('change', onForceChange);
    cleanups.push(() =>
      syncForceCheckbox.removeEventListener('change', onForceChange),
    );
  }

  // Sync button: upload new/changed files, update manifest
  if (syncBtn) {
    const onSyncClick = async () => {
      if (!syncDiff || !window.nostr) return;
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing...';

      try {
        const settings = getSettings();
        const relays = settings.relays
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);
        const pubkey = await window.nostr.getPublicKey();

        // Fetch latest manifest
        const existing = await fetchManifest(
          pubkey,
          getManifestDtag(),
          relays,
        );
        const manifestEntries = existing
          ? parseManifestContent(existing.content)
          : {};

        // Upload each file to Blossom
        for (let i = 0; i < syncDiff.toUpload.length; i++) {
          const fd = syncDiff.toUpload[i];
          const fname = fd.relativePath.split('/').pop();
          syncDiffEl.innerHTML += `<div style="color:#fbbf24">${i + 1}/${syncDiff.toUpload.length} ${escHtml(fname)}...</div>`;
          syncDiffEl.scrollTop = syncDiffEl.scrollHeight;

          const buffer = await fd.file.arrayBuffer();
          await blossomUpload(
            settings.blossomUrl,
            new Uint8Array(buffer),
            fname,
            fd.mime,
          );
          // Mirror upload (non-fatal)
          if (settings.blossomMirror) {
            try {
              await blossomUpload(
                settings.blossomMirror,
                new Uint8Array(buffer),
                fname,
                fd.mime,
              );
            } catch {
              /* mirror failure is non-fatal */
            }
          }

          console.log(
            `[sync] uploaded ${i + 1}/${syncDiff.toUpload.length}: ${fd.relativePath} sha=${fd.sha256.slice(0, 12)}`,
          );

          // Update entry in manifest
          manifestEntries[fd.relativePath] = {
            title: fname,
            sha256: fd.sha256,
            mime: fd.mime,
            size: fd.size,
            added: Math.floor(Date.now() / 1000),
          };
        }

        // Build and publish updated manifest
        const pathTags = buildPathTags(manifestEntries);
        const aggHash = await computeAggregateHash(pathTags);
        const manifestTags = [
          ...pathTags,
          ['d', getManifestDtag()],
          ['x', aggHash, 'aggregate'],
          ['title', 'Personal Archive'],
          ['server', settings.blossomUrl],
        ];
        if (settings.blossomMirror)
          manifestTags.push(['server', settings.blossomMirror]);

        const manifestEv = await window.nostr.signEvent({
          kind: 35128,
          content: buildManifestContent(manifestEntries),
          created_at: Math.floor(Date.now() / 1000),
          tags: manifestTags,
        });
        console.log(
          '[sync] Signed manifest event:',
          manifestEv.id,
          'entries:',
          Object.keys(manifestEntries).length,
        );
        const mResults = await publishEvent(manifestEv, relays);
        const mOk = mResults.filter((r) => r.ok).length;

        syncDiffEl.innerHTML += `<div style="color:#6ee7b7;margin-top:0.5em">Done! ${syncDiff.toUpload.length} files synced. Manifest published to ${mOk}/${mResults.length} relays.</div>`;
        syncBtn.textContent = 'Synced!';
        syncDiff = null;
        // Reset force checkbox
        if (syncForceCheckbox) syncForceCheckbox.checked = false;
      } catch (e) {
        syncDiffEl.innerHTML += `<div style="color:#f87171">Error: ${e.message}</div>`;
        syncBtn.disabled = false;
        syncBtn.textContent = 'Retry Sync';
      }
    };
    syncBtn.addEventListener('click', onSyncClick);
    cleanups.push(() => syncBtn.removeEventListener('click', onSyncClick));
  }

  // =========================================================================
  // --- Restore cached folder ---
  // =========================================================================

  const cachedFolder = localStorage.getItem('ia-last-folder');
  if (cachedFolder) {
    const folderInput2 = document.getElementById('ingest-folder');
    if (folderInput2) folderInput2.value = cachedFolder;
  }

  // =========================================================================
  // --- Step indicator helper ---
  // =========================================================================

  function addStep(phase, ok, msg) {
    const steps = document.getElementById('ingest-steps');
    const icon = ok ? '\u2713' : '\u2717';
    const color = ok ? '#6ee7b7' : '#f87171';
    steps.innerHTML += `<div class="ingest-step" style="color:${color}">${icon} ${msg}</div>`;
  }

  // =========================================================================
  // --- Form submission ---
  // =========================================================================

  const onFormSubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('ingest-btn');
    const progress = document.getElementById('ingest-progress');
    const steps = document.getElementById('ingest-steps');
    const current = document.getElementById('ingest-current');

    const title = document.getElementById('ingest-title').value.trim();
    const folder = document.getElementById('ingest-folder').value.trim();
    const topics = (
      document.getElementById('ingest-topics').value.trim() || ''
    )
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const sourceKind = document.getElementById('ingest-source-kind').value;

    // Cache folder
    if (folder) localStorage.setItem('ia-last-folder', folder);

    if (activeTab === 'url') {
      // --- URL Flagging -> kind 1621 issue event ---
      const url = document.getElementById('ingest-url').value.trim();
      if (!url) return;

      if (!window.nostr || !window.nostr.signEvent) {
        toast(
          'Install a Nostr signer extension (nos2x, Alby, etc) to flag URLs',
        );
        return;
      }

      const settings = getSettings();

      btn.disabled = true;
      btn.textContent = 'Flagging...';
      current.textContent = '';
      progress.style.display = 'block';
      steps.innerHTML = '';

      try {
        // Build kind 1621 issue event (NIP-34) — signals intent to archive
        const issueBody = [
          `**URL:** ${url}`,
          title ? `**Title:** ${title}` : '',
          folder ? `**Folder:** ${folder}` : '',
          sourceKind ? `**Source kind:** ${sourceKind}` : '',
          topics.length ? `**Topics:** ${topics.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const issueTitle = title || `[archive] ${url}`;
        const now = Math.floor(Date.now() / 1000);

        // Issue tags — reference archiver if configured
        const issueTags = [
          ['subject', issueTitle],
          ['t', 'archive'],
          ['r', url],
          ...topics.map((t) => ['t', t]),
          ['alt', `Archive flag: ${issueTitle}`],
        ];
        if (settings.archiverNpub) {
          const archiverHex = npubToHex(settings.archiverNpub);
          if (archiverHex) issueTags.push(['p', archiverHex]);
        }

        const template = {
          kind: 1621,
          content: issueBody,
          tags: issueTags,
          created_at: now,
        };

        // Sign via NIP-07
        const signed = await window.nostr.signEvent(template);

        addStep('sign', true, 'Signed issue event');

        // Publish to configured relays
        const relays = settings.relays
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);
        const results = await publishEvent(signed, relays);
        const okCount = results.filter((r) => r.ok).length;

        if (okCount > 0) {
          const relayList = results
            .filter((r) => r.ok)
            .map((r) => {
              try {
                return new URL(r.url).hostname;
              } catch {
                return r.url;
              }
            })
            .join(', ');
          addStep(
            'publish',
            true,
            `Published to ${okCount}/${results.length} relays (${relayList})`,
          );
          addStep('event', true, `Event ID: ${signed.id}`);
          current.innerHTML = `Flagged for archiving! Event ID: <code style="color:#6ee7b7">${signed.id.slice(0, 12)}...</code>`;
        } else {
          const failList = results
            .map((r) => {
              try {
                return `${new URL(r.url).hostname}: ${r.message}`;
              } catch {
                return `${r.url}: ${r.message}`;
              }
            })
            .join('; ');
          addStep('publish', false, `Failed: ${failList}`);
          addStep('event', true, `Event ID: ${signed.id}`);
          current.textContent = 'Failed to publish to any relay';
        }

        btn.disabled = false;
        btn.textContent = 'Flag this URL';
      } catch (err) {
        current.textContent = `Error: ${err.message}`;
        btn.disabled = false;
        btn.textContent = 'Flag this URL';
      }
    } else {
      // --- File Upload -> Browser-side pipeline ---
      if (!selectedFile) {
        toast('Select a file first');
        return;
      }

      const settings = getSettings();
      const relays = settings.relays
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      btn.disabled = true;
      btn.textContent = 'Uploading...';
      progress.style.display = 'block';
      steps.innerHTML = '';
      current.textContent = '';

      const PHASES = [
        { key: 'hash', label: 'Compute hash' },
        { key: 'upload', label: 'Upload to Blossom' },
        { key: 'manifest', label: 'Build manifest' },
        { key: 'sign', label: 'Sign events' },
        { key: 'publish', label: 'Publish to relays' },
        { key: 'nsite', label: 'Update archive manifest' },
      ];
      const stepEls = {};
      for (const phase of PHASES) {
        const div = document.createElement('div');
        div.className = 'ingest-step ingest-step-pending';
        div.innerHTML = `<span class="ingest-step-icon">\u25CB</span> <span class="ingest-step-label">${phase.label}</span> <span class="ingest-step-detail"></span>`;
        steps.appendChild(div);
        stepEls[phase.key] = div;
      }

      function setStep(key, status, detail) {
        const el = stepEls[key];
        if (!el) return;
        const icon = el.querySelector('.ingest-step-icon');
        const det = el.querySelector('.ingest-step-detail');
        if (status === 'running') {
          el.className = 'ingest-step ingest-step-running';
          icon.textContent = '\u25CF';
        } else if (status === 'done') {
          el.className = 'ingest-step ingest-step-done';
          icon.textContent = '\u2713';
        } else if (status === 'error') {
          el.className = 'ingest-step ingest-step-error';
          icon.textContent = '\u2717';
        }
        if (detail) det.textContent = detail;
        current.textContent = `${key}: ${status}`;
      }

      try {
        // Step 1: Read + hash file
        setStep('hash', 'running');
        const fileBuffer = await selectedFile.arrayBuffer();
        const fileSha = await sha256(fileBuffer);
        const mime = selectedFile.type || 'application/octet-stream';
        const fname = selectedFile.name;
        const fileSize = selectedFile.size;
        setStep('hash', 'done', fileSha);

        // Step 2: Upload to Blossom
        setStep('upload', 'running');
        const desc = await blossomUpload(
          settings.blossomUrl,
          new Uint8Array(fileBuffer),
          fname,
          mime,
        );
        setStep('upload', 'done', fmtSize(fileSize));
        // Mirror
        if (settings.blossomMirror) {
          try {
            await blossomUpload(
              settings.blossomMirror,
              new Uint8Array(fileBuffer),
              fname,
              mime,
            );
          } catch (e) {
            /* mirror failure is non-fatal */
          }
        }

        // Step 3: Build + upload manifest
        setStep('manifest', 'running');
        const blobEntry = {
          x: fileSha,
          role: 'source',
          filename: fname,
          m: mime,
          size: fileSize,
        };
        const source = { kind: sourceKind || 'webpage', url: '' };
        const manifest = {
          version: '1.0',
          type: 'archive-bundle',
          title: title || fname,
          source,
          blobs: [blobEntry],
        };
        const manifestBytes = new TextEncoder().encode(
          JSON.stringify(manifest, null, 2) + '\n',
        );
        const manifestDesc = await blossomUpload(
          settings.blossomUrl,
          manifestBytes,
          'manifest.json',
          'application/json',
        );
        setStep('manifest', 'done', manifestDesc.sha256);

        // Step 4: Sign events
        setStep('sign', 'running');
        // Bridge event (kind 1115)
        const bridgeTemplate = {
          kind: 1115,
          content: '',
          created_at: Math.floor(Date.now() / 1000),
          tags: [
            ['x', fileSha],
            ['x', manifestDesc.sha256],
            [
              'primary',
              manifestDesc.sha256,
              String(manifestDesc.size),
            ],
          ],
        };
        const bridge = await window.nostr.signEvent(bridgeTemplate);
        setStep('sign', 'done', `Bridge: ${bridge.id}`);

        // Index event (kind 1116)
        const indexTags = [
          ['e', bridge.id],
          ['title', title || fname],
        ];
        const autoFolder = folder || defaultFolder(mime);
        if (autoFolder) indexTags.push(['t', autoFolder]);
        const topicsInput = document.getElementById('ingest-topics');
        if (topicsInput && topicsInput.value.trim()) {
          for (const t of topics) indexTags.push(['t', t]);
        }
        const indexTemplate = {
          kind: 1116,
          content: '',
          created_at: Math.floor(Date.now() / 1000),
          tags: indexTags,
        };
        const indexEv = await window.nostr.signEvent(indexTemplate);

        // Step 5: Publish
        setStep('publish', 'running');
        const bResults = await publishEvent(bridge, relays);
        const iResults = await publishEvent(indexEv, relays);
        const allResults = [...bResults, ...iResults];
        const allOk = allResults.filter((r) => r.ok).length;
        const relayDetail = allResults
          .filter((r) => r.ok)
          .map((r) => {
            try {
              return new URL(r.url).hostname;
            } catch {
              return r.url;
            }
          });
        const uniqueHosts = [...new Set(relayDetail)];
        setStep(
          'publish',
          'done',
          `${allOk}/${relays.length * 2} ok (${uniqueHosts.join(', ')})`,
        );
        addStep('event', true, `Index: ${indexEv.id}`);

        // Step 6: Update NIP-5A (nsite) manifest for personal archive
        setStep('nsite', 'running');
        try {
          const userPubkey = await window.nostr.getPublicKey();

          // Fetch existing manifest if any
          const existing = await fetchManifest(
            userPubkey,
            getManifestDtag(),
            relays,
          );
          const existingEntries = existing
            ? parseManifestContent(existing.content)
            : {};

          // Build the new entry path
          const entryPath = `/${autoFolder}/${fname}`;

          // Add/update entry in manifest
          existingEntries[entryPath] = {
            title: title || fname,
            added: Math.floor(Date.now() / 1000),
            source: { kind: sourceKind || 'webpage', url: '' },
            topics: topics,
            bridge_event_id: bridge.id,
            index_event_id: indexEv.id,
            sha256: fileSha,
            mime: mime,
            size: fileSize,
          };

          // Build path tags from all entries
          const pathTags = buildPathTags(existingEntries);
          const aggHash = await computeAggregateHash(pathTags);

          // Build the kind:35128 manifest event
          const manifestTags = [
            ...pathTags,
            ['d', getManifestDtag()],
            ['x', aggHash, 'aggregate'],
            ['title', 'Personal Archive'],
            ['server', settings.blossomUrl],
          ];
          if (settings.blossomMirror) {
            manifestTags.push(['server', settings.blossomMirror]);
          }

          const manifestTemplate = {
            kind: 35128,
            content: buildManifestContent(existingEntries),
            created_at: Math.floor(Date.now() / 1000),
            tags: manifestTags,
          };
          const manifestEv = await window.nostr.signEvent(manifestTemplate);
          const mResults = await publishEvent(manifestEv, relays);
          const mOk = mResults.filter((r) => r.ok).length;
          setStep(
            'nsite',
            'done',
            `Manifest published to ${mOk}/${mResults.length} relays`,
          );
        } catch (e) {
          console.warn('Nsite manifest publish failed:', e);
          setStep('nsite', 'error', e.message);
        }

        current.textContent =
          'Upload complete! Close this panel and refresh to see the new item.';
        btn.disabled = false;
        btn.textContent = 'Archive this URL';
      } catch (err) {
        current.textContent = `Error: ${err.message}`;
        btn.disabled = false;
        btn.textContent = 'Archive this URL';
        // Mark any running step as error
        for (const key of Object.keys(stepEls)) {
          if (stepEls[key].classList.contains('ingest-step-running'))
            setStep(key, 'error', err.message);
        }
      }
    }
  };

  ingestForm.addEventListener('submit', onFormSubmit);
  cleanups.push(() => ingestForm.removeEventListener('submit', onFormSubmit));

  // =========================================================================
  // --- Cleanup ---
  // =========================================================================

  return () =>
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* noop */
      }
    });
}
