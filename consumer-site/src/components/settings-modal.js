/**
 * Settings modal — reads/writes settings via core/settings.js.
 * Includes API key fields (stored in browser localStorage only).
 */

import { getSettings, saveSettings } from '../core/settings.js';
import { toast } from '../core/dom.js';

export function mountSettingsModal(store) {
  const cleanups = [];

  const settingsFab = document.getElementById('ia-settings-fab');
  const settingsOverlay = document.getElementById('ia-settings-overlay');
  const settingsClose = document.getElementById('ia-settings-close');
  const settingsForm = document.getElementById('ia-settings-form');

  if (!settingsFab || !settingsOverlay || !settingsForm) {
    console.warn('[settings-modal] Required DOM elements not found');
    return () => {};
  }

  function onFabClick() {
    const s = getSettings();
    document.getElementById('set-archiver-npub').value = s.archiverNpub || '';
    document.getElementById('set-blossom-url').value = s.blossomUrl || '';
    document.getElementById('set-blossom-mirror').value = s.blossomMirror || '';
    document.getElementById('set-relays').value = s.relays || '';
    document.getElementById('set-manifest-dtag').value = s.manifestDtag || 'archive';
    document.getElementById('set-rag-url').value = s.ragBackendUrl || '';
    // Qdrant
    document.getElementById('set-qdrant-url').value = s.qdrantUrl || '';
    document.getElementById('set-qdrant-key').value = s.qdrantApiKey || '';
    document.getElementById('set-qdrant-collection').value = s.qdrantCollection || 'nostr_rag';
    // API keys
    document.getElementById('set-hf-key').value = s.hfApiKey || '';
    document.getElementById('set-llm-key').value = s.llmApiKey || '';
    document.getElementById('set-llm-base-url').value = s.llmBaseUrl || 'https://api.z.ai/api/coding/paas/v4';
    document.getElementById('set-llm-model').value = s.llmModel || 'GLM-5.1';
    document.getElementById('set-groq-key').value = s.groqApiKey || '';
    document.getElementById('set-gemini-key').value = s.geminiApiKey || '';
    settingsOverlay.classList.remove('hidden');
  }

  function onCloseClick() {
    settingsOverlay.classList.add('hidden');
  }

  function onOverlayClick(e) {
    if (e.target === settingsOverlay) settingsOverlay.classList.add('hidden');
  }

  function onFormSubmit(e) {
    e.preventDefault();
    saveSettings({
      archiverNpub: document.getElementById('set-archiver-npub').value.trim(),
      blossomUrl: document.getElementById('set-blossom-url').value.trim(),
      blossomMirror: document.getElementById('set-blossom-mirror').value.trim(),
      relays: document.getElementById('set-relays').value.trim(),
      manifestDtag: document.getElementById('set-manifest-dtag').value.trim() || 'archive',
      ragBackendUrl: document.getElementById('set-rag-url').value.trim(),
      // Qdrant
      qdrantUrl: document.getElementById('set-qdrant-url').value.trim(),
      qdrantApiKey: document.getElementById('set-qdrant-key').value.trim(),
      qdrantCollection: document.getElementById('set-qdrant-collection').value.trim() || 'nostr_rag',
      // API keys
      hfApiKey: document.getElementById('set-hf-key').value.trim(),
      llmApiKey: document.getElementById('set-llm-key').value.trim(),
      llmBaseUrl: document.getElementById('set-llm-base-url').value.trim() || 'https://api.z.ai/api/coding/paas/v4',
      llmModel: document.getElementById('set-llm-model').value.trim() || 'GLM-5.1',
      groqApiKey: document.getElementById('set-groq-key').value.trim(),
      geminiApiKey: document.getElementById('set-gemini-key').value.trim(),
    });
    settingsOverlay.classList.add('hidden');
    toast('Settings saved');
  }

  settingsFab.addEventListener('click', onFabClick);
  settingsClose.addEventListener('click', onCloseClick);
  settingsOverlay.addEventListener('click', onOverlayClick);
  settingsForm.addEventListener('submit', onFormSubmit);

  cleanups.push(() => {
    settingsFab.removeEventListener('click', onFabClick);
    settingsClose.removeEventListener('click', onCloseClick);
    settingsOverlay.removeEventListener('click', onOverlayClick);
    settingsForm.removeEventListener('submit', onFormSubmit);
  });

  return () =>
    cleanups.forEach((fn) => {
      try { fn(); } catch { /* noop */ }
    });
}
