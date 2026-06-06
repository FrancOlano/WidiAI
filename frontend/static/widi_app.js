/**
 * WidiAI — Vanilla JavaScript App
 * Wave MIDI AI · Piano-to-MIDI converter
 * No React · No JSX · No frameworks — plain ES6+ DOM APIs
 */

import { normalizeLang as normalizeI18nLang, translateKey } from './app/i18n_keys.js';
import {
  normalizePlaybackProfile,
  applyPlaybackProfileToNotes,
  applyProfileToPedalAmount,
  computeSf2TailMs,
} from './app/playback_profiles.js';
import { filterAndSortHistoryEntries, summarizeHistory } from './app/history_utils.js';
import { formatCompareElapsed, estimateCompareDurationMs, easingProgress } from './app/compare_utils.js';

'use strict';

// ═══════════════════════════════════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════════════════════════════════

function svgIcon(path, size, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

const ICON = {
  waves:       (s,c) => svgIcon(`<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>`, s, c),
  mic:         (s,c) => svgIcon(`<path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>`, s, c),
  micOff:      (s,c) => svgIcon(`<line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 9.64 6.61"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>`, s, c),
  upload:      (s,c) => svgIcon(`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`, s, c),
  play:        (s,c) => svgIcon(`<polygon points="5 3 19 12 5 21 5 3"/>`, s, c),
  pause:       (s,c) => svgIcon(`<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`, s, c),
  stop:        (s,c) => svgIcon(`<rect x="3" y="3" width="18" height="18" rx="2"/>`, s, c),
  download:    (s,c) => svgIcon(`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`, s, c),
  zap:         (s,c) => svgIcon(`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`, s, c),
  cpu:         (s,c) => svgIcon(`<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>`, s, c),
  activity:    (s,c) => svgIcon(`<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`, s, c),
  chevronDown: (s,c) => svgIcon(`<polyline points="6 9 12 15 18 9"/>`, s, c),
  music2:      (s,c) => svgIcon(`<circle cx="8" cy="18" r="4"/><path d="M12 18V2l7 4"/>`, s, c),
  checkCircle: (s,c) => svgIcon(`<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`, s, c),
  clock:       (s,c) => svgIcon(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`, s, c),
  search:      (s,c) => svgIcon(`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`, s, c),
  filter:      (s,c) => svgIcon(`<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`, s, c),
  trash:       (s,c) => svgIcon(`<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>`, s, c),
  refresh:     (s,c) => svgIcon(`<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`, s, c),
  fileAudio:   (s,c) => svgIcon(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6"/><path d="M9 17h6"/>`, s, c),
  calendar:    (s,c) => svgIcon(`<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`, s, c),
  sliders:     (s,c) => svgIcon(`<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>`, s, c),
  bell:        (s,c) => svgIcon(`<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`, s, c),
  info:        (s,c) => svgIcon(`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`, s, c),
  rotateCcw:   (s,c) => svgIcon(`<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.7"/>`, s, c),
  shield:      (s,c) => svgIcon(`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`, s, c),
  hardDrive:   (s,c) => svgIcon(`<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>`, s, c),
  gauge:       (s,c) => svgIcon(`<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/>`, s, c),
  xCircle:     (s,c) => svgIcon(`<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>`, s, c),
};

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_TOTAL_DURATION = 48;

function buildMidi() {
  const notes = [], beat = 0.5;
  const chords = [
    { bass: 50, inner: [62, 65, 69], melody: [74, 72, 69, 72, 74, 74, 72, 69] },
    { bass: 45, inner: [60, 64, 69], melody: [72, 72, 72, 74, 72, 69, 67, 69] },
    { bass: 46, inner: [58, 62, 65], melody: [69, 72, 74, 76, 74, 72, 69, 72] },
    { bass: 53, inner: [60, 65, 69], melody: [74, 72, 69, 67, 65, 67, 69, 72] },
  ];
  let s = 1;
  const r = () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 0xffffffff; };
  for (let rep = 0; rep < 3; rep++) {
    chords.forEach((chord, ci) => {
      const ps = (rep * chords.length + ci) * beat * 8;
      notes.push({ note: chord.bass, startTime: ps, duration: beat * 7.8, velocity: 72 });
      [0, 4].forEach(off => chord.inner.forEach((n, i) =>
        notes.push({ note: n, startTime: ps + off * beat + i * 0.045, duration: beat * 1.6, velocity: 58 + Math.floor(r() * 10) })));
      chord.melody.forEach((n, i) => n && notes.push({ note: n, startTime: ps + i * beat, duration: beat * 0.82, velocity: 78 + Math.floor(r() * 18) }));
    });
  }
  return notes;
}

const MIDI_NOTES = buildMidi();

// ═══════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  selectedModel: 'widi.selectedModel',
  lastAudioId: 'widi.lastAudioId',
  apiUrl: 'widi.apiUrl',
  noteGuideOpen: 'widi.noteGuideOpen',
  settings: 'widi.settings.v1',
  uiLanguage: 'widi.uiLanguage',
};

const AUDIO_DB = {
  name: 'widi_audio_storage',
  version: 2,
  store: 'audio',
  historyStore: 'history',
};

const MODEL_IDS = ['transkun', 'onsets_and_frames'];
const MAX_RECORDING_MS = 5 * 60 * 1000;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_MIDI_BYTES = 12 * 1024 * 1024;
const SF2_INSTRUMENT_PRESETS = Object.freeze({
  grand_piano: Object.freeze({
    id: 'grand_piano',
    label: 'Full Grand Piano',
    candidates: Object.freeze([
      new URL('./soundfonts/full-grand-piano.sf2', import.meta.url).toString(),
    ]),
  }),
  spanish_guitar: Object.freeze({
    id: 'spanish_guitar',
    label: 'Guitarra Clásica Española',
    candidates: Object.freeze([
      new URL('./soundfonts/Guitarra-Clasica.sf2', import.meta.url).toString(),
      new URL('./soundfonts/guitarra-clasica.sf2', import.meta.url).toString(),
      'https://raw.githubusercontent.com/manolo/sound-fonts/main/Guitarra-Clasica.sf2',
      'https://github.com/manolo/sound-fonts/raw/main/Guitarra-Clasica.sf2',
    ]),
  }),
});
const SF2_INSTRUMENT_IDS = Object.freeze(Object.keys(SF2_INSTRUMENT_PRESETS));
const SF2_FLUID_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/js-synthesizer@1.13.0/externals/libfluidsynth-2.4.6.js';
const SF2_SYNTH_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/js-synthesizer@1.13.0/dist/js-synthesizer.min.js';
const COMPUTER_PIANO_KEY_MAP = Object.freeze({
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
  k: 72, o: 73, l: 74, p: 75, ';': 76, "'": 77,
  z: 77, x: 78, c: 79, v: 80, b: 81, n: 82, m: 83,
});
const COMPUTER_PIANO_KEY_ORDER = Object.freeze(Object.keys(COMPUTER_PIANO_KEY_MAP));

function _formatComputerKeyboardKey(key) {
  const raw = String(key || '').trim();
  if (!raw) return '';
  return raw.length === 1 ? raw.toUpperCase() : raw;
}

const COMPUTER_PIANO_KEYS_BY_MIDI = (() => {
  const map = new Map();
  COMPUTER_PIANO_KEY_ORDER.forEach(key => {
    const midi = COMPUTER_PIANO_KEY_MAP[key];
    if (!Number.isFinite(midi)) return;
    const label = _formatComputerKeyboardKey(key);
    const current = map.get(midi) || [];
    if (!current.includes(label)) current.push(label);
    map.set(midi, current);
  });
  return map;
})();

const COMPUTER_PIANO_PRIMARY_KEY_BY_MIDI = Object.freeze((() => {
  const out = {};
  COMPUTER_PIANO_KEYS_BY_MIDI.forEach((labels, midi) => {
    const preferred = labels.find(label => /^[A-Z]$/.test(label)) || labels[0] || '';
    out[midi] = preferred;
  });
  return out;
})());

const DEFAULT_SETTINGS = Object.freeze({
  autoConvert: false,
  velocitySensitivity: 80,
  notificationsOn: true,
  recordingInput: 'mic',
  preferSf2Playback: true,
  sf2Instrument: 'grand_piano',
  pedalAssist: true,
  pedalAssistAmount: 0.72,
  fingerSuggestionAlgorithm: 'legacy',
  playbackProfile: 'natural',
});

const clampSettingNumber = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
};

const normalizeModelId = (model) => {
  const value = String(model || '').trim().toLowerCase();
  if (
    value === 'onsets' ||
    value === 'own' ||
    value === 'onsets and frames' ||
    value === 'onsets & frames' ||
    value === 'o&f'
  ) {
    return 'onsets_and_frames';
  }
  return MODEL_IDS.includes(value) ? value : '';
};

const normalizeFingerSuggestionAlgorithm = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'manual') return 'manual';
  return 'legacy';
};

const normalizeSf2Instrument = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return SF2_INSTRUMENT_IDS.includes(normalized) ? normalized : DEFAULT_SETTINGS.sf2Instrument;
};

const normalizeRecordingInputMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'internal' ? 'internal' : 'mic';
};

const normalizeUiLanguage = (value) => {
  return normalizeI18nLang(value);
};

const PROD_API_URL = 'https://widiai-backend.duckdns.org';

const getRuntimeApiUrlValue = () => {
  const runtime = window.__WIDI_RUNTIME__;
  if (runtime && typeof runtime.apiBaseUrl === 'string') {
    return runtime.apiBaseUrl.trim();
  }
  return '';
};

const getRuntimeMode = () => {
  const runtime = window.__WIDI_RUNTIME__;
  if (runtime && typeof runtime.mode === 'string') {
    return runtime.mode.trim().toLowerCase();
  }
  return '';
};

const isProdRuntime = () => getRuntimeMode() === 'prod';

const getEnvApiUrlValue = () => {
  if (isProdRuntime()) return '';
  if (window.__WIDI_ENV__ && typeof window.__WIDI_ENV__.API_URL === 'string') {
    return window.__WIDI_ENV__.API_URL.trim();
  }
  return '';
};

const getHostedApiFallback = () => {
  if (!isProdRuntime()) return '';
  const host = (window.location && window.location.hostname)
    ? window.location.hostname.toLowerCase()
    : '';
  if (host.endsWith('github.io')) {
    return 'https://widiai-backend.duckdns.org';
  }
  return '';
};

const getDefaultApiUrlValue = () => {
  const fromRuntime = getRuntimeApiUrlValue();
  const fromEnv = getEnvApiUrlValue();
  const fromHosted = getHostedApiFallback();
  return fromRuntime || fromEnv || fromHosted || window.location.origin;
};

const normalizeApiUrl = (rawUrl) => {
  const trimmed = String(rawUrl || '').trim();
  const base = trimmed || getDefaultApiUrlValue();
  return base.replace(/\/+$/, '');
};

const readLocalStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
};

const getConfiguredApiUrl = () => {
  const fromStorage = readLocalStorage(STORAGE_KEYS.apiUrl) || '';
  return normalizeApiUrl(fromStorage || getDefaultApiUrlValue());
};

const getStoredModel = () => {
  const normalized = normalizeModelId(readLocalStorage(STORAGE_KEYS.selectedModel));
  return normalized || null;
};

const persistSelectedModel = (model) => {
  const normalized = normalizeModelId(model);
  if (!normalized) return;
  try {
    localStorage.setItem(STORAGE_KEYS.selectedModel, normalized);
  } catch (_) {}
  window.selectedModel = normalized;
};

const getStoredGuideOpen = () => {
  const stored = readLocalStorage(STORAGE_KEYS.noteGuideOpen);
  if (stored === '0') return false;
  if (stored === '1') return true;
  return true;
};

const persistGuideOpen = (open) => {
  try {
    localStorage.setItem(STORAGE_KEYS.noteGuideOpen, open ? '1' : '0');
  } catch (_) {}
};

const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      apiUrl: normalizeApiUrl(parsed.apiUrl),
      selectedModel: normalizeModelId(parsed.selectedModel) || 'transkun',
      autoConvert: Boolean(parsed.autoConvert),
      velocitySensitivity: Math.round(clampSettingNumber(parsed.velocitySensitivity, 0, 127, DEFAULT_SETTINGS.velocitySensitivity)),
      notificationsOn: parsed.notificationsOn !== false,
      recordingInput: normalizeRecordingInputMode(parsed.recordingInput),
      preferSf2Playback: parsed.preferSf2Playback !== false,
      sf2Instrument: normalizeSf2Instrument(parsed.sf2Instrument),
      pedalAssist: parsed.pedalAssist !== false,
      pedalAssistAmount: clampSettingNumber(parsed.pedalAssistAmount, 0, 1, DEFAULT_SETTINGS.pedalAssistAmount),
      fingerSuggestionAlgorithm: normalizeFingerSuggestionAlgorithm(parsed.fingerSuggestionAlgorithm),
      playbackProfile: normalizePlaybackProfile(parsed.playbackProfile),
    };
  } catch (error) {
    console.warn('Failed to load stored settings:', error);
    return null;
  }
};

const getStoredUiLanguage = () => normalizeUiLanguage(readLocalStorage(STORAGE_KEYS.uiLanguage));


const openAudioDb = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('IndexedDB is not available in this browser.'));
    return;
  }

  const request = indexedDB.open(AUDIO_DB.name, AUDIO_DB.version);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(AUDIO_DB.store)) {
      const store = db.createObjectStore(AUDIO_DB.store, { keyPath: 'id' });
      store.createIndex('createdAt', 'createdAt');
    }
    if (!db.objectStoreNames.contains(AUDIO_DB.historyStore)) {
      const historyStore = db.createObjectStore(AUDIO_DB.historyStore, { keyPath: 'id' });
      historyStore.createIndex('createdAt', 'createdAt');
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const saveAudioEntry = async ({ blob, name, source, durationMs }) => {
  const id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `audio_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const entry = {
    id,
    name,
    source,
    size: blob.size,
    type: blob.type || 'audio/wav',
    durationMs: durationMs || null,
    createdAt: new Date().toISOString(),
    blob,
  };

  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_DB.store, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve(entry);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.objectStore(AUDIO_DB.store).put(entry);
  });
};

const loadAudioEntry = async (id) => {
  if (!id) return null;
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_DB.store, 'readonly');
    const req = tx.objectStore(AUDIO_DB.store).get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result || null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
};

const makeEntityId = (prefix) => {
  if (window.crypto && window.crypto.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const normalizeHistoryEntry = (entry) => {
  const status = entry?.status === 'failed' ? 'failed' : 'completed';
  const modelId = normalizeModelId(entry?.modelId || entry?.model) || 'transkun';
  const createdAtRaw = String(entry?.createdAt || '');
  const createdAt = Number.isNaN(Date.parse(createdAtRaw)) ? new Date().toISOString() : createdAtRaw;
  const notes = Math.max(0, Math.round(Number(entry?.notes) || 0));
  const durationSec = Number(entry?.durationSec);
  const normalizedDuration = Number.isFinite(durationSec) && durationSec >= 0 ? durationSec : null;
  const audioSizeBytes = Math.max(0, Math.round(Number(entry?.audioSizeBytes || entry?.sizeBytes) || 0));
  const midiSizeBytes = Math.max(0, Math.round(Number(entry?.midiSizeBytes) || 0)) || null;

  return {
    id: String(entry?.id || makeEntityId('hist')),
    createdAt,
    fileName: String(entry?.fileName || entry?.name || 'unknown_audio'),
    modelId,
    status,
    notes,
    durationSec: normalizedDuration,
    audioSizeBytes,
    midiSizeBytes,
    audioEntryId: entry?.audioEntryId ? String(entry.audioEntryId) : null,
    errorMessage: entry?.errorMessage ? String(entry.errorMessage) : '',
    midiBlob: entry?.midiBlob instanceof Blob ? entry.midiBlob : null,
  };
};

const listHistoryEntriesFromDb = async () => {
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_DB.historyStore, 'readonly');
    const store = tx.objectStore(AUDIO_DB.historyStore);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      const rows = Array.isArray(request.result) ? request.result : [];
      const normalized = rows.map(normalizeHistoryEntry);
      normalized.sort((a, b) => {
        const ta = Number.isNaN(Date.parse(a.createdAt)) ? 0 : Date.parse(a.createdAt);
        const tb = Number.isNaN(Date.parse(b.createdAt)) ? 0 : Date.parse(b.createdAt);
        return tb - ta;
      });
      resolve(normalized);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

const saveHistoryEntryToDb = async (entry) => {
  const normalized = normalizeHistoryEntry(entry);
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_DB.historyStore, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve(normalized);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.objectStore(AUDIO_DB.historyStore).put(normalized);
  });
};

const deleteHistoryEntryFromDb = async (id) => {
  if (!id) return;
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_DB.historyStore, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.objectStore(AUDIO_DB.historyStore).delete(id);
  });
};

const loadHistoryEntryFromDb = async (id) => {
  if (!id) return null;
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_DB.historyStore, 'readonly');
    const req = tx.objectStore(AUDIO_DB.historyStore).get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result ? normalizeHistoryEntry(req.result) : null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
};

const applyAudioEntryToState = (entry) => {
  if (!entry || !entry.blob) return;
  if (_audioUrlRef) URL.revokeObjectURL(_audioUrlRef);
  _audioUrlRef = URL.createObjectURL(entry.blob);
  state.audioUrl = _audioUrlRef;
  state.audioFile = new File([entry.blob], entry.name, { type: entry.type || entry.blob.type || 'audio/wav' });
  state.fileName = entry.name;
  state.audioEntryId = entry.id;
  state.stage = 'loaded';
};

const hydrateStoredAudio = async (content) => {
  const lastId = localStorage.getItem(STORAGE_KEYS.lastAudioId);
  if (!lastId) return;
  try {
    const entry = await loadAudioEntry(lastId);
    if (entry) {
      applyAudioEntryToState(entry);
      if (state.page === 'dashboard') {
        renderDashboard(content);
      }
    }
  } catch (error) {
    console.warn('Failed to load stored audio:', error);
  }
};

const resolveAudioForTranscription = async () => {
  if (state.audioFile) return state.audioFile;
  if (!state.audioEntryId) return null;
  try {
    const entry = await loadAudioEntry(state.audioEntryId);
    if (!entry || !entry.blob) return null;
    const file = new File([entry.blob], entry.name, { type: entry.type || entry.blob.type || 'audio/wav' });
    state.audioFile = file;
    state.fileName = entry.name;
    return file;
  } catch (error) {
    console.warn('Failed to resolve stored audio:', error);
    return null;
  }
};

const storedModel = getStoredModel();
const storedGuideOpen = getStoredGuideOpen();
const storedSettings = getStoredSettings();
const storedUiLanguage = getStoredUiLanguage();

const state = {
  page: 'home',
  apiUrl: storedSettings?.apiUrl || getConfiguredApiUrl(),
  // Dashboard
  stage: 'idle',   // idle | loaded | processing | ready
  isRecording: false,
  selectedModel: storedSettings?.selectedModel || storedModel || 'transkun',
  progress: 0,
  midiPlaying: false,
  midiTime: 0,
  fileName: null,
  audioUrl: null,
  audioFile: null,
  audioEntryId: null,
  midiBlob: null,
  midiUrl: null,
  midiSourceName: null,
  rawMidiNotes: [],
  rawMidiDuration: 0,
  midiNotes: [],
  midiDuration: 0,
  midiTempo: null,
  noteEditMode: false,
  noteEditorView: 'roll',
  keyboardNoteHintsOpen: false,
  noteGuideOpen: storedGuideOpen,
  noteHistoryOpen: false,
  scoreReadableMode: false,
  fingerSuggestionMode: false,
  fingerSuggestionAlgorithm: storedSettings?.fingerSuggestionAlgorithm || DEFAULT_SETTINGS.fingerSuggestionAlgorithm,
  fingerSuggestionLevel: 'beginner',
  rollZoomX: 1,
  rollZoomY: 1,
  scoreZoomX: 1,
  scoreZoomY: 1,
  statusMessage: '',
  statusType: 'info',
  modelDropdownOpen: false,
  compareRunning: false,
  compareProgress: 0,
  compareResults: null,
  uiLanguage: storedUiLanguage,
  // History
  histSearch: '',
  histStatus: 'all',
  histModel: 'all',
  histSort: 'date',
  histSortOpen: false,
  historyEntries: [],
  // Settings
  autoConvert: storedSettings?.autoConvert ?? DEFAULT_SETTINGS.autoConvert,
  velocitySensitivity: storedSettings?.velocitySensitivity ?? DEFAULT_SETTINGS.velocitySensitivity,
  notificationsOn: storedSettings?.notificationsOn ?? DEFAULT_SETTINGS.notificationsOn,
  recordingInput: storedSettings?.recordingInput || DEFAULT_SETTINGS.recordingInput,
  preferSf2Playback: storedSettings?.preferSf2Playback ?? DEFAULT_SETTINGS.preferSf2Playback,
  sf2Instrument: storedSettings?.sf2Instrument || DEFAULT_SETTINGS.sf2Instrument,
  pedalAssist: storedSettings?.pedalAssist ?? DEFAULT_SETTINGS.pedalAssist,
  pedalAssistAmount: storedSettings?.pedalAssistAmount ?? DEFAULT_SETTINGS.pedalAssistAmount,
  playbackProfile: storedSettings?.playbackProfile ?? DEFAULT_SETTINGS.playbackProfile,
  fingerSuggestionReport: null,
};

// Mutable references (not state, just handles)
let _midiRaf = 0;
let _recTimer = null, _progressTimer = null, _recordingStartedAt = 0;
let _mediaRecorder = null, _audioChunks = [];
let _activeRecordingStream = null, _activeRecordingInputMode = DEFAULT_SETTINGS.recordingInput;
let _audioUrlRef = null;
let _pianoRoll = null, _scoreEditor = null, _audioPlayer = null, _waveform = null;
let _recordWaveCtx = null, _recordWaveAnalyser = null, _recordWaveSource = null, _recordWaveData = null, _recordWaveRaf = 0;
let _nativeAudioCtx = null, _nativeMasterGain = null;
let _internalRecordDestination = null;
let _nativeTimers = [], _nativeNodes = new Set();
let _nativeStartPerf = 0, _nativeStartOffset = 0;
let _audioUnlockBound = false;
let _transportKeysBound = false;
let _sf2Synth = null, _sf2AudioNode = null;
let _sf2InitPromise = null, _sf2UnavailableReason = '';
let _sf2LoadedInstrument = '';
const _keyboardPianoPressedKeys = new Set();
let _notesUndoStack = [];
let _notesRedoStack = [];
let _lastCommittedNotesSnapshot = null;
let _editHistoryEntries = [];
let _appHeader = null;
let _navigateToPage = null;
let _dashboardUiCache = null;
let _lastFingerWarningSignature = '';

const fmtTime = s => (!isFinite(s) || isNaN(s)) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const PROCESS_STEP_BOUNDS = [22, 86, 100];
const getMidiDuration = () => {
  if (state.midiDuration > 0) return state.midiDuration;
  return state.stage === 'ready' ? DEFAULT_TOTAL_DURATION : 0;
};
const getNotesForRoll = () => Array.isArray(state.midiNotes) ? state.midiNotes : [];
const getBackendModel = () => state.selectedModel;
const setStatusMessage = (message, type = 'info') => {
  state.statusMessage = message;
  state.statusType = type;
};
const clearStatusMessage = () => {
  state.statusMessage = '';
  state.statusType = 'info';
};

function getSf2InstrumentPreset(instrumentId = DEFAULT_SETTINGS.sf2Instrument) {
  const normalized = normalizeSf2Instrument(instrumentId);
  return SF2_INSTRUMENT_PRESETS[normalized] || SF2_INSTRUMENT_PRESETS[DEFAULT_SETTINGS.sf2Instrument];
}

function getMidiSourceNameFallback() {
  const normalizedModel = normalizeModelId(state.selectedModel) || 'transkun';
  return `transcription_${normalizedModel}.mid`;
}

function normalizeMidiFileName(rawName) {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) return getMidiSourceNameFallback();
  if (/\.midi?$/i.test(trimmed)) return trimmed;
  return `${trimmed}.mid`;
}

function _buildPedalCompensatedNotes(notes, amount = state.pedalAssistAmount) {
  const source = Array.isArray(notes) ? notes : [];
  if (!source.length) return [];
  const strength = Math.max(0, Math.min(1, Number(amount) || 0));
  const tailSec = 0.05 + (0.2 * strength);
  const maxExtendSec = 0.4 + (0.8 * strength);
  const minGapSec = 0.012;

  const sorted = source.map(note => ({
    note: clampMidi(note.note),
    startTime: Math.max(0, Number(note.startTime) || 0),
    duration: Math.max(0.03, Number(note.duration) || 0.12),
    velocity: Math.max(1, Math.min(127, Math.round(Number(note.velocity) || 96))),
    ...(Number.isInteger(Number(note.fingerOverride)) && Number(note.fingerOverride) >= 1 && Number(note.fingerOverride) <= 5
      ? { fingerOverride: Math.round(Number(note.fingerOverride)) }
      : {}),
  })).sort((a, b) => (a.startTime - b.startTime) || (a.note - b.note));

  const nextOnsetByIndex = new Array(sorted.length).fill(Number.POSITIVE_INFINITY);
  for (let i = 0; i < sorted.length; i += 1) {
    const start = sorted[i].startTime;
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (sorted[j].startTime > start + 0.0001) {
        nextOnsetByIndex[i] = sorted[j].startTime;
        break;
      }
    }
  }

  const nextSamePitchStart = new Array(sorted.length).fill(Number.POSITIVE_INFINITY);
  const lastPitchIndex = new Map();
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const midi = sorted[i].note;
    if (lastPitchIndex.has(midi)) {
      const nextIdx = lastPitchIndex.get(midi);
      nextSamePitchStart[i] = sorted[nextIdx].startTime;
    }
    lastPitchIndex.set(midi, i);
  }

  return sorted.map((note, index) => {
    const noteStart = note.startTime;
    const originalEnd = noteStart + note.duration;
    let targetEnd = originalEnd;
    const nextOnset = nextOnsetByIndex[index];
    if (Number.isFinite(nextOnset)) {
      const desiredEnd = Math.min(noteStart + maxExtendSec, nextOnset + tailSec);
      if (desiredEnd > targetEnd) targetEnd = desiredEnd;
    } else {
      targetEnd = Math.max(targetEnd, noteStart + Math.min(maxExtendSec, note.duration + tailSec));
    }
    const nextSame = nextSamePitchStart[index];
    if (Number.isFinite(nextSame)) {
      targetEnd = Math.min(targetEnd, Math.max(noteStart + 0.03, nextSame - minGapSec));
    }

    return {
      ...note,
      duration: Math.max(0.03, targetEnd - noteStart),
    };
  });
}

function _applyPlaybackPerformanceStyle(notes) {
  const source = Array.isArray(notes) ? notes : [];
  if (!source.length) return [];
  const profiled = applyPlaybackProfileToNotes(source, state.playbackProfile);
  if (!state.pedalAssist) return profiled.map(note => ({ ...note }));
  const pedalAmount = applyProfileToPedalAmount(state.pedalAssistAmount, state.playbackProfile);
  return _buildPedalCompensatedNotes(profiled, pedalAmount);
}

const getSettingsSnapshot = () => ({
  apiUrl: normalizeApiUrl(state.apiUrl),
  selectedModel: normalizeModelId(state.selectedModel) || 'transkun',
  autoConvert: Boolean(state.autoConvert),
  velocitySensitivity: Math.round(clampSettingNumber(state.velocitySensitivity, 0, 127, DEFAULT_SETTINGS.velocitySensitivity)),
  notificationsOn: Boolean(state.notificationsOn),
  recordingInput: normalizeRecordingInputMode(state.recordingInput),
  preferSf2Playback: Boolean(state.preferSf2Playback),
  sf2Instrument: normalizeSf2Instrument(state.sf2Instrument),
  pedalAssist: Boolean(state.pedalAssist),
  pedalAssistAmount: clampSettingNumber(state.pedalAssistAmount, 0, 1, DEFAULT_SETTINGS.pedalAssistAmount),
  fingerSuggestionAlgorithm: normalizeFingerSuggestionAlgorithm(state.fingerSuggestionAlgorithm),
  playbackProfile: normalizePlaybackProfile(state.playbackProfile),
});

function persistAppSettings() {
  const snapshot = getSettingsSnapshot();
  state.apiUrl = snapshot.apiUrl;
  state.selectedModel = snapshot.selectedModel;
  state.autoConvert = snapshot.autoConvert;
  state.velocitySensitivity = snapshot.velocitySensitivity;
  state.notificationsOn = snapshot.notificationsOn;
  state.recordingInput = snapshot.recordingInput;
  state.preferSf2Playback = snapshot.preferSf2Playback;
  state.sf2Instrument = snapshot.sf2Instrument;
  state.pedalAssist = snapshot.pedalAssist;
  state.pedalAssistAmount = snapshot.pedalAssistAmount;
  state.fingerSuggestionAlgorithm = snapshot.fingerSuggestionAlgorithm;
  state.playbackProfile = snapshot.playbackProfile;
  persistSelectedModel(snapshot.selectedModel);
  try {
    localStorage.setItem(STORAGE_KEYS.apiUrl, snapshot.apiUrl);
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Failed to persist app settings:', error);
  }
}

function persistUiLanguageSettings() {
  state.uiLanguage = normalizeUiLanguage(state.uiLanguage);
  try {
    localStorage.setItem(STORAGE_KEYS.uiLanguage, state.uiLanguage);
  } catch (error) {
    console.warn('Failed to persist UI language settings:', error);
  }
}

const getVelocitySensitivityGain = () => {
  const normalized = clampSettingNumber(state.velocitySensitivity, 0, 127, DEFAULT_SETTINGS.velocitySensitivity) / 127;
  return 0.35 + (normalized * 1.3);
};

const applyVelocitySensitivity = (velocityNorm) => {
  const base = Math.min(1, Math.max(0.02, Number(velocityNorm) || 0.8));
  return Math.min(1, Math.max(0.02, base * getVelocitySensitivityGain()));
};

function notifyConversionEvent(title, body) {
  if (!state.notificationsOn) return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try { new Notification(title, { body }); } catch (_) {}
    return;
  }
  if (Notification.permission === 'default') {
    Notification.requestPermission()
      .then(permission => {
        if (permission === 'granted') {
          try { new Notification(title, { body }); } catch (_) {}
        }
      })
      .catch(() => {});
  }
}

function _cloneNotes(notes) {
  return (Array.isArray(notes) ? notes : []).map(note => ({
    note: Math.max(MIDI_LO, Math.min(MIDI_HI, Math.round(Number(note.note) || MIDI_LO))),
    startTime: Math.max(0, Number(note.startTime) || 0),
    duration: Math.max(0.03, Number(note.duration) || 0.12),
    velocity: Math.max(1, Math.min(127, Math.round(Number(note.velocity) || 96))),
    ...(Number.isInteger(Number(note.fingerOverride)) && Number(note.fingerOverride) >= 1 && Number(note.fingerOverride) <= 5
      ? { fingerOverride: Math.round(Number(note.fingerOverride)) }
      : {}),
  }));
}

function _notesEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const na = a[i];
    const nb = b[i];
    if (
      na.note !== nb.note ||
      Math.abs((na.startTime || 0) - (nb.startTime || 0)) > 0.0001 ||
      Math.abs((na.duration || 0) - (nb.duration || 0)) > 0.0001 ||
      na.velocity !== nb.velocity ||
      (Number.isFinite(Number(na.fingerOverride)) ? Math.round(Number(na.fingerOverride)) : 0) !==
      (Number.isFinite(Number(nb.fingerOverride)) ? Math.round(Number(nb.fingerOverride)) : 0)
    ) {
      return false;
    }
  }
  return true;
}

function _replaceMidiNotesInPlace(nextNotes) {
  const next = _cloneNotes(nextNotes);
  if (!Array.isArray(state.midiNotes)) {
    state.midiNotes = next;
    return;
  }
  state.midiNotes.splice(0, state.midiNotes.length, ...next);
}

function _recordEditHistory(action, type = 'edit') {
  const label = String(action || 'Edit notes').trim();
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  _editHistoryEntries.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    action: label,
    type,
    stamp,
    notes: _cloneNotes(state.midiNotes),
  });
  if (_editHistoryEntries.length > 120) _editHistoryEntries.pop();
}

function _resetEditHistory() {
  _notesUndoStack = [];
  _notesRedoStack = [];
  _lastCommittedNotesSnapshot = _cloneNotes(state.midiNotes);
  _editHistoryEntries = [];
}

function _pushUndoSnapshotIfNeeded(action = 'Edit notes') {
  const current = _cloneNotes(state.midiNotes);
  if (_lastCommittedNotesSnapshot && _notesEqual(current, _lastCommittedNotesSnapshot)) return false;
  if (_lastCommittedNotesSnapshot) {
    _notesUndoStack.push({
      notes: _cloneNotes(_lastCommittedNotesSnapshot),
      action: String(action || 'Edit notes').trim(),
    });
    if (_notesUndoStack.length > 120) _notesUndoStack.shift();
  }
  _notesRedoStack = [];
  _lastCommittedNotesSnapshot = current;
  return true;
}

function _applyEditorNotesCommit(content, notes, action = 'Edit notes') {
  if (state.stage !== 'ready') return false;
  _replaceMidiNotesInPlace(notes);
  const changed = _pushUndoSnapshotIfNeeded(action);
  if (!changed) {
    _updateSeek(content);
    _syncEditToolbar(content);
    return false;
  }
  _recordEditHistory(action, 'edit');
  const rebuilt = _rebuildMidiBlobFromEditedNotes();
  if (!rebuilt) {
    console.warn('MIDI notes changed, but MIDI export refresh failed.');
  }
  _updateSeek(content);
  _syncEditToolbar(content);
  _syncHistoryOverlay(content);
  return true;
}

function _undoNoteEdit(content) {
  if (state.stage !== 'ready' || state.midiPlaying || !_notesUndoStack.length) return false;
  const snapshotEntry = _notesUndoStack.pop();
  const action = snapshotEntry?.action || 'Edit notes';
  _notesRedoStack.push({
    notes: _cloneNotes(state.midiNotes),
    action,
  });
  if (_notesRedoStack.length > 120) _notesRedoStack.shift();
  _replaceMidiNotesInPlace(snapshotEntry?.notes || []);
  _lastCommittedNotesSnapshot = _cloneNotes(state.midiNotes);
  _recordEditHistory(`Undo · ${action}`, 'undo');
  const rebuilt = _rebuildMidiBlobFromEditedNotes();
  if (!rebuilt) console.warn('Undo applied, but MIDI export refresh failed.');
  if (state.midiTime > getMidiDuration()) state.midiTime = getMidiDuration();
  _updateSeek(content);
  _syncEditToolbar(content);
  _syncHistoryOverlay(content);
  return true;
}

function _redoNoteEdit(content) {
  if (state.stage !== 'ready' || state.midiPlaying || !_notesRedoStack.length) return false;
  const snapshotEntry = _notesRedoStack.pop();
  const action = snapshotEntry?.action || 'Edit notes';
  _notesUndoStack.push({
    notes: _cloneNotes(state.midiNotes),
    action,
  });
  if (_notesUndoStack.length > 120) _notesUndoStack.shift();
  _replaceMidiNotesInPlace(snapshotEntry?.notes || []);
  _lastCommittedNotesSnapshot = _cloneNotes(state.midiNotes);
  _recordEditHistory(`Redo · ${action}`, 'redo');
  const rebuilt = _rebuildMidiBlobFromEditedNotes();
  if (!rebuilt) console.warn('Redo applied, but MIDI export refresh failed.');
  if (state.midiTime > getMidiDuration()) state.midiTime = getMidiDuration();
  _updateSeek(content);
  _syncEditToolbar(content);
  _syncHistoryOverlay(content);
  return true;
}

function _restoreEditHistoryEntry(content, historyId) {
  if (state.stage !== 'ready' || state.midiPlaying) return false;
  const entry = _editHistoryEntries.find(item => item.id === historyId);
  if (!entry || !Array.isArray(entry.notes)) return false;
  const targetNotes = _cloneNotes(entry.notes);
  if (_notesEqual(state.midiNotes, targetNotes)) return false;

  _notesUndoStack.push({
    notes: _cloneNotes(state.midiNotes),
    action: `Restore to ${entry.stamp}`,
  });
  if (_notesUndoStack.length > 120) _notesUndoStack.shift();
  _notesRedoStack = [];

  _replaceMidiNotesInPlace(targetNotes);
  _lastCommittedNotesSnapshot = _cloneNotes(state.midiNotes);
  _recordEditHistory(`Restore · ${entry.action}`, 'restore');

  const rebuilt = _rebuildMidiBlobFromEditedNotes();
  if (!rebuilt) console.warn('History restore applied, but MIDI export refresh failed.');
  if (state.midiTime > getMidiDuration()) state.midiTime = getMidiDuration();
  _updateSeek(content);
  _syncEditToolbar(content);
  _syncHistoryOverlay(content);
  return true;
}

function _bindHistoryOverlayActions(content) {
  if (!content) return;
  content.querySelectorAll('[data-history-restore]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.midiPlaying) return;
      _restoreEditHistoryEntry(content, btn.dataset.historyRestore);
    });
  });
}

function _syncEditToolbar(content) {
  if (!content) return;
  const playbackLocked = state.midiPlaying || state.stage !== 'ready';
  const undoBtn = content.querySelector('#edit-undo');
  const redoBtn = content.querySelector('#edit-redo');
  if (undoBtn) undoBtn.disabled = playbackLocked || _notesUndoStack.length === 0;
  if (redoBtn) redoBtn.disabled = playbackLocked || _notesRedoStack.length === 0;

  const guideToggle = content.querySelector('#guide-toggle');
  if (guideToggle) {
    guideToggle.textContent = state.noteGuideOpen ? _uiText('Hide Guide') : _uiText('Show Guide');
    guideToggle.classList.toggle('active', state.noteGuideOpen);
  }
  const historyToggle = content.querySelector('#history-toggle');
  if (historyToggle) {
    historyToggle.classList.toggle('active', state.noteHistoryOpen);
    historyToggle.textContent = state.noteHistoryOpen ? _uiText('Hide History') : _uiText('History');
  }
  const fingerToggle = content.querySelector('#finger-suggest-toggle');
  if (fingerToggle) {
    fingerToggle.classList.toggle('active', state.fingerSuggestionMode);
    fingerToggle.textContent = state.fingerSuggestionMode ? _uiText('Finger Labels On') : _uiText('Finger Labels');
  }
  const keyboardHintsToggle = content.querySelector('#keyboard-note-hints-toggle');
  if (keyboardHintsToggle) {
    keyboardHintsToggle.classList.toggle('active', state.keyboardNoteHintsOpen);
    keyboardHintsToggle.textContent = state.keyboardNoteHintsOpen
      ? _uiText('Hide Keyboard Notes')
      : _uiText('Keyboard Notes');
  }
  const readableToggle = content.querySelector('#score-readable-toggle');
  if (readableToggle) {
    readableToggle.classList.toggle('active', state.scoreReadableMode);
  }

  const activeZoomX = state.noteEditorView === 'score' ? state.scoreZoomX : state.rollZoomX;
  const activeZoomY = state.noteEditorView === 'score' ? state.scoreZoomY : state.rollZoomY;
  const xReset = content.querySelector('#zoom-x-reset');
  const yReset = content.querySelector('#zoom-y-reset');
  if (xReset) xReset.textContent = `${activeZoomX.toFixed(2)}x`;
  if (yReset) yReset.textContent = `${activeZoomY.toFixed(2)}x`;
  ['#zoom-x-in', '#zoom-x-out', '#zoom-x-reset', '#zoom-y-in', '#zoom-y-out', '#zoom-y-reset'].forEach(selector => {
    const button = content.querySelector(selector);
    if (button) button.disabled = playbackLocked;
  });
  content.querySelectorAll('[data-finger-set]').forEach(button => {
    button.disabled = playbackLocked;
  });
  content.querySelectorAll('[data-finger-algo]').forEach(button => {
    button.disabled = playbackLocked;
  });

  if (state.noteHistoryOpen) _syncHistoryOverlay(content);
  _syncKeyboardNoteHintsPanel(content);
}

function _syncFingerConfidencePill(content, report = null) {
  if (!content) return;
  const pill = content.querySelector('#finger-confidence-pill');
  if (!pill) return;
  pill.style.display = 'none';
  pill.textContent = '';
}

function resetMidiData() {
  cancelAnimationFrame(_midiRaf);
  state.midiPlaying = false;
  stopNativePlayback();

  if (state.midiUrl) {
    URL.revokeObjectURL(state.midiUrl);
    state.midiUrl = null;
  }
  state.midiBlob = null;
  state.midiSourceName = null;
  state.rawMidiNotes = [];
  state.rawMidiDuration = 0;
  state.midiNotes = [];
  state.midiDuration = 0;
  state.midiTempo = null;
  state.midiTime = 0;
  state.noteEditMode = false;
  state.noteEditorView = 'roll';
  state.keyboardNoteHintsOpen = false;
  state.noteHistoryOpen = false;
  state.scoreReadableMode = false;
  state.fingerSuggestionMode = false;
  state.fingerSuggestionLevel = 'beginner';
  state.rollZoomX = 1;
  state.rollZoomY = 1;
  state.scoreZoomX = 1;
  state.scoreZoomY = 1;
  state.fingerSuggestionReport = null;
  _keyboardPianoPressedKeys.clear();
  _resetEditHistory();
}

function getNativeAudioContext() {
  if (_nativeAudioCtx) return _nativeAudioCtx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error('Web Audio API is not available in this browser.');
  try {
    _nativeAudioCtx = new AudioCtx({ latencyHint: 'interactive' });
  } catch (_) {
    _nativeAudioCtx = new AudioCtx();
  }
  _nativeMasterGain = _nativeAudioCtx.createGain();
  _nativeMasterGain.gain.value = 0.8;
  _nativeMasterGain.connect(_nativeAudioCtx.destination);
  _internalRecordDestination = null;
  return _nativeAudioCtx;
}

function getInternalRecordingStream() {
  const ctx = getNativeAudioContext();
  if (!_nativeMasterGain) {
    throw new Error('Internal audio bus is unavailable.');
  }
  if (!_internalRecordDestination || _internalRecordDestination.context !== ctx) {
    _internalRecordDestination = ctx.createMediaStreamDestination();
    _nativeMasterGain.connect(_internalRecordDestination);
  }
  if (!_internalRecordDestination.stream) {
    throw new Error('Internal recording stream is unavailable.');
  }
  return _internalRecordDestination.stream;
}

function inferRecordingFileExtension(blobType = '') {
  const normalized = String(blobType || '').toLowerCase();
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('wav')) return 'wav';
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a';
  return 'webm';
}

function bindAudioUnlock() {
  if (_audioUnlockBound) return;
  _audioUnlockBound = true;

  const unlock = async () => {
    try {
      await ensureNativeAudioReady();
    } catch (_) {
      // Ignore unlock errors here; explicit playback actions will report them.
    }
    if (state.preferSf2Playback && !_sf2Synth && !_sf2UnavailableReason) {
      ensureSf2SynthReady().catch(() => {});
    }
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown', unlock, true);
  };

  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
}

function disposeSf2Synth() {
  if (_sf2Synth) {
    try { _sf2Synth.midiAllSoundsOff(); } catch (_) {}
    try { _sf2Synth.close(); } catch (_) {}
  }
  if (_sf2AudioNode) {
    try { _sf2AudioNode.disconnect(); } catch (_) {}
  }
  _sf2Synth = null;
  _sf2AudioNode = null;
  _sf2InitPromise = null;
  _sf2LoadedInstrument = '';
}

function loadExternalScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existingByData = document.querySelector(`script[data-widi-src="${src}"]`);
    const existingBySrc = Array.from(document.scripts).find(script => script.src === src);
    const existing = existingByData || existingBySrc;

    if (existing) {
      if (existing.dataset.widiLoaded === 'true' || existing.readyState === 'complete') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.widiSrc = src;
    script.addEventListener('load', () => {
      script.dataset.widiLoaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function ensureNativeAudioReady() {
  let ctx = getNativeAudioContext();
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    await ctx.resume();
  }

  // Safari can keep a context in a bad state after output device changes.
  // Recreate once if resume did not move it to running.
  if (ctx.state !== 'running') {
    disposeSf2Synth();
    try { await ctx.close(); } catch (_) {}
    _nativeAudioCtx = null;
    _nativeMasterGain = null;
    _internalRecordDestination = null;
    ctx = getNativeAudioContext();
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      await ctx.resume();
    }
  }

  return ctx;
}

async function ensureSf2SynthReady() {
  const sf2Preset = getSf2InstrumentPreset(state.sf2Instrument);
  if (_sf2Synth && _sf2LoadedInstrument !== sf2Preset.id) {
    disposeSf2Synth();
    _sf2UnavailableReason = '';
  }
  if (_sf2UnavailableReason) throw new Error(_sf2UnavailableReason);
  if (_sf2Synth) return _sf2Synth;
  if (_sf2InitPromise) return _sf2InitPromise;

  _sf2InitPromise = (async () => {
    await ensureNativeAudioReady();
    await loadExternalScriptOnce(SF2_FLUID_SCRIPT_URL);
    await loadExternalScriptOnce(SF2_SYNTH_SCRIPT_URL);

    if (!window.JSSynth || typeof window.JSSynth.waitForReady !== 'function') {
      throw new Error('SF2 runtime did not load correctly.');
    }

    await window.JSSynth.waitForReady();
    const synth = new window.JSSynth.Synthesizer();
    synth.init(_nativeAudioCtx.sampleRate);
    const node = synth.createAudioNode(_nativeAudioCtx, 1024);
    node.connect(_nativeMasterGain || _nativeAudioCtx.destination);

    let sf2Buffer = null;
    let sf2LoadedFrom = '';
    for (let i = 0; i < sf2Preset.candidates.length; i += 1) {
      const url = sf2Preset.candidates[i];
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        sf2Buffer = await response.arrayBuffer();
        sf2LoadedFrom = url;
        break;
      } catch (_) {
        continue;
      }
    }
    if (!(sf2Buffer instanceof ArrayBuffer) || sf2Buffer.byteLength === 0) {
      throw new Error(`Failed to load soundfont preset: ${sf2Preset.label}.`);
    }
    await synth.loadSFont(sf2Buffer);
    synth.midiProgramChange(0, 0);

    _sf2Synth = synth;
    _sf2AudioNode = node;
    _sf2LoadedInstrument = sf2Preset.id;
    _sf2UnavailableReason = '';
    try {
      console.info(`SF2 (${sf2Preset.label}) loaded from: ${sf2LoadedFrom}`);
    } catch (_) {}
    return synth;
  })();

  try {
    return await _sf2InitPromise;
  } catch (error) {
    disposeSf2Synth();
    _sf2UnavailableReason = `SF2 playback unavailable (${sf2Preset.label}: ${error.message}).`;
    throw new Error(_sf2UnavailableReason);
  }
}

async function playPreviewNote(noteNumber, durationSec = 0.5, velocityNorm = 0.9) {
  await ensureNativeAudioReady();
  if (state.preferSf2Playback && !_sf2Synth && !_sf2UnavailableReason) {
    try {
      await ensureSf2SynthReady();
    } catch (_) {
      // Fall back to the built-in synth if the soundfont cannot load.
    }
  }
  triggerNativeNote(noteNumber, durationSec, velocityNorm);
}

function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function stopNativePlayback() {
  _nativeTimers.forEach(id => clearTimeout(id));
  _nativeTimers = [];
  if (_sf2Synth) {
    try { _sf2Synth.midiAllNotesOff(); } catch (_) {}
    try { _sf2Synth.midiAllSoundsOff(); } catch (_) {}
  }
  _nativeNodes.forEach(node => {
    try { node.stop(); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  });
  _nativeNodes.clear();
}

function triggerNativeNote(noteNumber, durationSec, velocityNorm = 0.85) {
  const normalizedVelocity = applyVelocitySensitivity(velocityNorm);
  const playbackProfile = normalizePlaybackProfile(state.playbackProfile);

  if (_sf2Synth && state.preferSf2Playback) {
    const midiNote = Math.max(0, Math.min(127, Math.round(Number(noteNumber) || 0)));
    const velocity = Math.max(1, Math.min(127, Math.round(normalizedVelocity * 127)));
    const baseDurationMs = Math.max(25, Math.round(Math.max(0.03, Number(durationSec) || 0.12) * 1000));
    const pedalTailMs = computeSf2TailMs({
      playbackProfile,
      pedalAssist: state.pedalAssist,
      pedalAssistAmount: state.pedalAssistAmount,
    });
    const noteDurationMs = baseDurationMs + pedalTailMs;
    _sf2Synth.midiNoteOn(0, midiNote, velocity);
    const noteOffTimer = setTimeout(() => {
      if (!_sf2Synth) return;
      try { _sf2Synth.midiNoteOff(0, midiNote); } catch (_) {}
    }, noteDurationMs);
    _nativeTimers.push(noteOffTimer);
    return;
  }

  if (!_nativeAudioCtx || !_nativeMasterGain) return;
  const ctx = _nativeAudioCtx;
  const now = ctx.currentTime;
  const freq = midiToFrequency(noteNumber);
  const velocity = Math.min(1, Math.max(0.08, normalizedVelocity));

  const noteDurationBase = Math.max(0.05, durationSec);
  const profileGate = playbackProfile === 'dry' ? 0.83 : (playbackProfile === 'studio' ? 0.93 : 1.0);
  const profileRelease = playbackProfile === 'dry' ? 0.36 : (playbackProfile === 'studio' ? 0.46 : 0.55);
  const noteDuration = Math.max(0.04, noteDurationBase * profileGate);
  const release = Math.min(2.4, Math.max(0.28, noteDuration * profileRelease));
  const stopAt = now + noteDuration + release + 0.08;
  const brightness = Math.max(0.45, Math.min(1, (noteNumber - 28) / 72));
  const bodyPeak = Math.min(0.34, 0.06 + velocity * 0.22);

  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.setValueAtTime(Math.min(8200, 1700 + freq * (5.2 + brightness * 1.4)), now);
  bodyFilter.Q.setValueAtTime(0.7, now);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(bodyPeak, now + 0.012);
  bodyGain.gain.exponentialRampToValueAtTime(bodyPeak * 0.58, now + 0.16);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  const partials = [
    { ratio: 1.000, level: 1.00, detune: 0 },
    { ratio: 2.010, level: 0.32, detune: -3 },
    { ratio: 3.030, level: 0.18, detune: 4 },
    { ratio: 4.080, level: 0.09, detune: -6 },
  ];

  let endedPartials = 0;
  const oscs = partials.map(partial => {
    const osc = ctx.createOscillator();
    const partialGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * partial.ratio, now);
    osc.detune.setValueAtTime(partial.detune, now);
    partialGain.gain.setValueAtTime(partial.level, now);
    osc.connect(partialGain);
    partialGain.connect(bodyFilter);
    osc.start(now);
    osc.stop(stopAt);
    _nativeNodes.add(osc);
    osc.onended = () => {
      try { osc.disconnect(); } catch (_) {}
      try { partialGain.disconnect(); } catch (_) {}
      _nativeNodes.delete(osc);
      endedPartials += 1;
      if (endedPartials >= partials.length) {
        try { bodyFilter.disconnect(); } catch (_) {}
        try { bodyGain.disconnect(); } catch (_) {}
      }
    };
    return osc;
  });

  const hammerBuffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.028)), ctx.sampleRate);
  const hammerData = hammerBuffer.getChannelData(0);
  for (let i = 0; i < hammerData.length; i += 1) {
    const t = i / hammerData.length;
    hammerData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 4);
  }

  const hammer = ctx.createBufferSource();
  const hammerFilter = ctx.createBiquadFilter();
  const hammerGain = ctx.createGain();
  hammer.buffer = hammerBuffer;
  hammerFilter.type = 'bandpass';
  hammerFilter.frequency.setValueAtTime(Math.min(7200, 1800 + freq * 5), now);
  hammerFilter.Q.setValueAtTime(1.2, now);
  hammerGain.gain.setValueAtTime(0.045 * velocity, now);
  hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  bodyFilter.connect(bodyGain);
  bodyGain.connect(_nativeMasterGain);
  hammer.connect(hammerFilter);
  hammerFilter.connect(hammerGain);
  hammerGain.connect(_nativeMasterGain);

  hammer.start(now);
  hammer.stop(now + 0.05);
  _nativeNodes.add(hammer);
  hammer.onended = () => {
    try { hammer.disconnect(); } catch (_) {}
    try { hammerFilter.disconnect(); } catch (_) {}
    try { hammerGain.disconnect(); } catch (_) {}
    _nativeNodes.delete(hammer);
  };
}

function scheduleNativePlayback(fromSec) {
  stopNativePlayback();
  const notes = state.midiNotes || [];
  notes.forEach(note => {
    const start = Number(note.startTime) || 0;
    const duration = Math.max(0.03, Number(note.duration) || 0.12);
    const relativeStart = start - fromSec;
    if (relativeStart + duration <= 0) return;

    const effectiveStart = Math.max(0, relativeStart);
    const clipHead = Math.max(0, -relativeStart);
    const effectiveDuration = Math.max(0.03, duration - clipHead);
    const velocityNorm = Math.min(1, Math.max(0, (Number(note.velocity) || 96) / 127));

    const timerId = setTimeout(() => {
      triggerNativeNote(note.note, effectiveDuration, velocityNorm);
    }, Math.max(0, effectiveStart * 1000));
    _nativeTimers.push(timerId);
  });

  _nativeStartPerf = performance.now();
  _nativeStartOffset = fromSec;
}

function _stopRecordingWaveform() {
  if (_recordWaveRaf) {
    cancelAnimationFrame(_recordWaveRaf);
    _recordWaveRaf = 0;
  }
  if (_recordWaveSource) {
    try { _recordWaveSource.disconnect(); } catch (_) {}
    _recordWaveSource = null;
  }
  if (_recordWaveAnalyser) {
    try { _recordWaveAnalyser.disconnect(); } catch (_) {}
    _recordWaveAnalyser = null;
  }
  if (_recordWaveCtx) {
    try { _recordWaveCtx.close(); } catch (_) {}
    _recordWaveCtx = null;
  }
  _recordWaveData = null;
}

function _renderRecordingWaveformFrame() {
  if (!state.isRecording || !_waveform || !_recordWaveAnalyser || !_recordWaveData) return;

  _recordWaveAnalyser.getByteTimeDomainData(_recordWaveData);
  const bars = 110;
  const chunkSize = Math.max(1, Math.floor(_recordWaveData.length / bars));
  const levels = new Array(bars);

  for (let i = 0; i < bars; i += 1) {
    let peak = 0;
    const start = i * chunkSize;
    const end = Math.min(_recordWaveData.length, start + chunkSize);
    for (let j = start; j < end; j += 1) {
      const normalized = (_recordWaveData[j] - 128) / 128;
      const amp = Math.abs(normalized);
      if (amp > peak) peak = amp;
    }
    levels[i] = Math.min(1, Math.max(0.02, peak * 1.9));
  }

  _waveform.update(levels, 0, 1, true);
  _recordWaveRaf = requestAnimationFrame(_renderRecordingWaveformFrame);
}

function _startRecordingWaveform(stream) {
  _stopRecordingWaveform();

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || !stream) return;

  try {
    _recordWaveCtx = new AudioCtx();
    _recordWaveAnalyser = _recordWaveCtx.createAnalyser();
    _recordWaveAnalyser.fftSize = 2048;
    _recordWaveSource = _recordWaveCtx.createMediaStreamSource(stream);
    _recordWaveSource.connect(_recordWaveAnalyser);
    _recordWaveData = new Uint8Array(_recordWaveAnalyser.fftSize);
    _renderRecordingWaveformFrame();
  } catch (error) {
    console.error('Waveform setup error:', error);
    _stopRecordingWaveform();
  }
}

// ═══════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════

function injectCSS(container) {
  const style = document.createElement('style');
  style.textContent = `
/* Base reset & layout */
.widi-app,.widi-app *,.widi-app *::before,.widi-app *::after{box-sizing:border-box;}
.widi-app *{margin:0;padding:0;}
.widi-app{width:100%;height:100%;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,sans-serif;background:#07070f;color:#e5e7eb;overflow:hidden;display:flex;flex-direction:column;position:relative;}
.widi-app button{cursor:pointer;font-family:inherit;}
.widi-app input,.widi-app select,.widi-app textarea{font-family:inherit;}

/* Header - Premium Navigation Bar */
.w-header{display:flex;align-items:center;justify-content:space-between;padding:12px 28px;flex-shrink:0;position:sticky;top:0;z-index:120;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(180deg,rgba(10,10,18,0.95),rgba(7,7,15,0.92));backdrop-filter:blur(24px) saturate(180%);box-shadow:0 4px 16px rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.04) inset;}
.w-logo{display:flex;align-items:center;gap:14px;}
.w-logo-btn{border:none;background:transparent;color:inherit;cursor:pointer;padding:0;display:flex;align-items:center;gap:14px;text-align:left;}
.w-logo-icon{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);box-shadow:0 4px 12px rgba(139,92,246,0.4),0 0 24px rgba(139,92,246,0.2),0 1px 0 rgba(255,255,255,0.2) inset;flex-shrink:0;position:relative;}
.w-logo-icon::before{content:'';position:absolute;inset:0;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,0.15),transparent);pointer-events:none;}
.w-logo-name{font-size:20px;font-weight:700;letter-spacing:-0.03em;background:linear-gradient(135deg,#60a5fa 0%,#c4b5fd 50%,#a78bfa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 2px 8px rgba(139,92,246,0.3);}
.w-logo-sub{font-size:10px;color:#6b7280;margin-top:2px;letter-spacing:0.06em;text-transform:uppercase;}
.w-beta{font-size:9px;font-weight:600;letter-spacing:0.1em;background:rgba(139,92,246,0.18);color:#c4b5fd;border:1px solid rgba(139,92,246,0.35);border-radius:6px;padding:3px 8px;box-shadow:0 0 8px rgba(139,92,246,0.2);}

/* Header navigation */
.w-header-controls{display:flex;align-items:center;gap:12px;}
.w-header-launch{border:1px solid rgba(139,92,246,0.42);background:linear-gradient(135deg,#4f7df7 0%,#8b5cf6 100%);color:#eef2ff;font-size:20px;font-weight:700;padding:14px 32px;border-radius:18px;box-shadow:0 12px 28px rgba(99,102,241,0.35),0 1px 0 rgba(255,255,255,0.2) inset;cursor:pointer;transition:transform 0.18s ease,box-shadow 0.18s ease,opacity 0.18s ease;}
.w-header-launch:hover{transform:translateY(-1px);box-shadow:0 16px 34px rgba(99,102,241,0.42),0 1px 0 rgba(255,255,255,0.24) inset;}
.w-header-launch.active{opacity:0.72;}

/* Dashboard/History/Settings navigation */
.w-nav{display:flex;align-items:center;gap:6px;}
.w-nav-btn{font-size:12px;font-weight:500;padding:7px 16px;border-radius:10px;background:transparent;border:1px solid transparent;color:#6b7280;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);position:relative;}
.w-nav-btn::before{content:'';position:absolute;inset:0;border-radius:10px;background:rgba(255,255,255,0.04);opacity:0;transition:opacity 0.25s;}
.w-nav-btn:hover{color:#9ca3af;}
.w-nav-btn:hover::before{opacity:1;}
.w-nav-btn.active{font-weight:600;color:#c4b5fd;background:rgba(139,92,246,0.15);border-color:rgba(139,92,246,0.3);box-shadow:0 0 12px rgba(139,92,246,0.15),0 1px 0 rgba(255,255,255,0.05) inset;}
.w-header-right{display:flex;align-items:center;gap:10px;min-width:0;}
.w-lang-switch{display:flex;align-items:center;gap:4px;padding:4px;border-radius:11px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.3);}
.w-lang-btn{min-width:36px;padding:6px 10px;border-radius:8px;border:1px solid transparent;background:transparent;color:#9ca3af;font-size:10px;font-weight:700;letter-spacing:0.08em;cursor:pointer;transition:all 0.2s;}
.w-lang-btn:hover{color:#d1d5db;background:rgba(255,255,255,0.05);}
.w-lang-btn.active{background:linear-gradient(135deg,rgba(59,130,246,0.26),rgba(139,92,246,0.26));border-color:rgba(139,92,246,0.36);color:#ede9fe;box-shadow:0 0 12px rgba(139,92,246,0.2);}

/* Ambient Orbs */
.w-orb{position:fixed;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);filter:blur(80px);opacity:0.12;width:480px;height:480px;animation:float 20s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translate(-50%,-50%) scale(1);}50%{transform:translate(-50%,-50%) scale(1.15);}}

/* Layout */
.w-content{flex:1;overflow:hidden;display:flex;flex-direction:column;position:relative;z-index:1;min-width:0;}

/* Home / Landing */
.w-home{flex:1;overflow-y:auto;padding:22px 24px 28px;display:flex;flex-direction:column;gap:16px;}
.w-home-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:14px;}
.w-home-panel{border-radius:20px;padding:22px;background:linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015));border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(16px);box-shadow:0 10px 26px rgba(0,0,0,0.28);}
.w-home-title{font-size:34px;line-height:1.02;font-weight:800;letter-spacing:-0.03em;background:linear-gradient(145deg,#dbeafe 0%,#93c5fd 35%,#c4b5fd 70%,#ddd6fe 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.w-home-sub{margin-top:10px;font-size:14px;color:#cbd5e1;line-height:1.45;max-width:740px;}
.w-home-actions{margin-top:16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.w-home-launch{display:inline-flex;align-items:center;gap:9px;padding:11px 18px;border-radius:12px;border:1px solid rgba(139,92,246,0.42);background:linear-gradient(135deg,rgba(59,130,246,0.32),rgba(139,92,246,0.34));color:#f5f3ff;font-size:12px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;box-shadow:0 8px 22px rgba(79,70,229,0.24);}
.w-home-launch:hover{transform:translateY(-1px);}
.w-home-ghost{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.04);color:#d1d5db;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;}
.w-home-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px;}
.w-home-kpi{border-radius:12px;padding:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.2);}
.w-home-kpi p:first-child{font-size:20px;font-weight:800;color:#e9d5ff;line-height:1;}
.w-home-kpi p:last-child{margin-top:4px;font-size:10px;color:#94a3b8;letter-spacing:0.05em;text-transform:uppercase;}
.w-home-preview{height:100%;min-height:250px;border-radius:16px;padding:14px;border:1px solid rgba(59,130,246,0.28);background:radial-gradient(circle at 20% 14%,rgba(59,130,246,0.22),transparent 42%),radial-gradient(circle at 84% 76%,rgba(139,92,246,0.26),transparent 46%),rgba(5,8,20,0.84);}
.w-home-preview-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;height:130px;align-items:end;margin-top:8px;}
.w-home-preview-note{border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,rgba(96,165,250,0.95),rgba(139,92,246,0.72));box-shadow:0 0 12px rgba(139,92,246,0.4);}
.w-home-preview-keys{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:2px;height:68px;margin-top:12px;}
.w-home-preview-key{border-radius:0 0 4px 4px;border:1px solid rgba(255,255,255,0.15);background:linear-gradient(180deg,#f8fafc,#e2e8f0);}
.w-home-preview-key.black{background:linear-gradient(180deg,#111827,#020617);border-color:rgba(15,23,42,0.7);}
.w-home-section{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
.w-home-card{border-radius:14px;padding:14px;border:1px solid rgba(255,255,255,0.1);background:linear-gradient(155deg,rgba(255,255,255,0.03),rgba(0,0,0,0.15));}
.w-home-card h3{font-size:12px;color:#e2e8f0;letter-spacing:0.05em;text-transform:uppercase;}
.w-home-card p{margin-top:6px;font-size:12px;color:#9ca3af;line-height:1.45;}
.w-home-pill{display:inline-flex;align-items:center;gap:6px;margin-top:9px;padding:5px 8px;border-radius:999px;border:1px solid rgba(59,130,246,0.32);background:rgba(59,130,246,0.13);font-size:9px;color:#bfdbfe;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;}

/* Premium Glass Panels */
.w-panel{border-radius:20px;padding:20px;background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015));border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(16px) saturate(160%);box-shadow:0 8px 32px rgba(0,0,0,0.35),0 1px 0 rgba(255,255,255,0.06) inset,0 -1px 0 rgba(0,0,0,0.2) inset;position:relative;min-width:0;}
.w-panel::before{content:'';position:absolute;inset:0;border-radius:20px;background:radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(139,92,246,0.08),transparent 40%);opacity:0;transition:opacity 0.3s;pointer-events:none;}
.w-panel:hover::before{opacity:1;}
.w-panel-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;font-size:11px;color:#a1a1aa;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}

/* Dashboard Layout */
.w-dashboard{display:flex;flex-direction:column;flex:1;padding:20px 24px 24px;gap:14px;overflow-y:auto;overflow-x:hidden;min-width:0;}
.w-dashboard.editing-focus{padding-bottom:0;}
.w-top-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;min-width:0;}
.w-top-grid > .w-panel{min-width:0;}

/* Record Button - Professional */
.w-rec-btn{width:64px;height:64px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;transition:all 0.35s cubic-bezier(0.4,0,0.2,1);background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.35);box-shadow:0 4px 16px rgba(239,68,68,0.12),0 1px 0 rgba(255,255,255,0.05) inset;}
.w-rec-btn:hover:not(.recording){background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.45);box-shadow:0 6px 20px rgba(239,68,68,0.2);}
.w-rec-btn.recording{background:radial-gradient(circle at 30% 30%,#f87171,#ef4444,#b91c1c);border-color:#f87171;box-shadow:0 0 30px rgba(239,68,68,0.7),0 0 60px rgba(239,68,68,0.25),0 2px 0 rgba(255,255,255,0.15) inset;}
@keyframes pulse-ring{0%{transform:scale(1);opacity:0.7;}100%{transform:scale(1.6);opacity:0;}}
.w-rec-pulse{position:absolute;inset:-2px;border-radius:50%;border:3px solid rgba(239,68,68,0.5);animation:pulse-ring 1.5s cubic-bezier(0.4,0,0.6,1) infinite;}

/* Upload Button */
.w-upload-btn{display:flex;align-items:center;gap:10px;width:100%;border-radius:10px;padding:10px 14px;font-size:11px;font-weight:500;color:#93c5fd;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);transition:all 0.25s;box-shadow:0 2px 8px rgba(59,130,246,0.05);}
.w-upload-btn:hover{background:rgba(59,130,246,0.18);border-color:rgba(59,130,246,0.4);box-shadow:0 4px 12px rgba(59,130,246,0.15);transform:translateY(-1px);}
.w-upload-btn:active{transform:translateY(0);}
.w-panel.drag-active{border-color:rgba(59,130,246,0.58);box-shadow:0 0 0 2px rgba(59,130,246,0.26) inset,0 8px 24px rgba(59,130,246,0.2);}

/* File Badge */
.w-file-badge{display:flex;align-items:center;gap:10px;border-radius:10px;padding:8px 14px;margin-bottom:14px;background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.06));border:1px solid rgba(16,185,129,0.25);box-shadow:0 2px 8px rgba(16,185,129,0.08);}

/* Waveform Container */
.w-waveform{width:100%;height:72px;min-width:0;border-radius:10px;overflow:hidden;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);box-shadow:0 2px 8px rgba(0,0,0,0.2) inset;}
.w-waveform canvas{display:block;width:100%!important;height:100%!important;max-width:100%;}

/* Audio Player - Premium Design */
.w-audio-player{border-radius:14px;padding:14px;margin-top:10px;background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(59,130,246,0.04));border:1px solid rgba(59,130,246,0.2);box-shadow:0 4px 12px rgba(59,130,246,0.08),0 1px 0 rgba(255,255,255,0.04) inset;}
.w-audio-filename{font-size:10px;font-weight:500;color:#93c5fd;letter-spacing:0.06em;margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.w-audio-track{position:relative;height:5px;margin-bottom:5px;cursor:pointer;}
.w-audio-track-bg{position:absolute;inset:0;border-radius:3px;background:rgba(255,255,255,0.1);}
.w-audio-track-fill{position:absolute;left:0;top:0;height:100%;border-radius:3px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);box-shadow:0 0 10px rgba(139,92,246,0.6);transition:width 0.05s linear;}
.w-audio-track input[type=range]{position:absolute;inset:0;width:100%;opacity:0;height:100%;cursor:pointer;margin:0;}
.w-audio-times{display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-top:3px;font-variant-numeric:tabular-nums;}
.w-audio-controls{display:flex;align-items:center;justify-content:space-between;}
.w-audio-btns{display:flex;align-items:center;gap:10px;}
.w-ap-play{width:38px;height:38px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 4px 12px rgba(139,92,246,0.4),0 1px 0 rgba(255,255,255,0.15) inset;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);cursor:pointer;}
.w-ap-play:hover:not(:disabled){box-shadow:0 6px 16px rgba(139,92,246,0.5);transform:translateY(-1px);}
.w-ap-play:active:not(:disabled){transform:translateY(0);}
.w-ap-play:disabled{background:rgba(255,255,255,0.04);box-shadow:none;opacity:0.35;cursor:not-allowed;}
.w-ap-play.active{box-shadow:0 0 20px rgba(139,92,246,0.7),0 4px 12px rgba(139,92,246,0.4);}
.w-ap-stop{width:30px;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.25s;}
.w-ap-stop:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.18);}
.w-ap-dl{display:flex;align-items:center;gap:7px;border-radius:9px;padding:7px 11px;font-size:10px;font-weight:500;color:#93c5fd;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.28);cursor:pointer;transition:all 0.25s;}
.w-ap-dl:hover{background:rgba(59,130,246,0.22);border-color:rgba(59,130,246,0.45);box-shadow:0 2px 8px rgba(59,130,246,0.2);}

/* Animated Bars */
@keyframes bar-bounce{0%,100%{height:5px;}50%{height:12px;}}
.w-vis-bar{width:3px;background:linear-gradient(180deg,#60a5fa,#3b82f6);border-radius:2px;height:5px;box-shadow:0 0 6px rgba(59,130,246,0.4);}
.w-vis-bar:nth-child(1){animation:bar-bounce 0.6s 0s infinite ease-in-out;}
.w-vis-bar:nth-child(2){animation:bar-bounce 0.6s 0.15s infinite ease-in-out;}
.w-vis-bar:nth-child(3){animation:bar-bounce 0.6s 0.3s infinite ease-in-out;}

/* Model Selector */
.w-model-btn{width:100%;display:flex;align-items:center;justify-content:space-between;border-radius:14px;padding:14px 18px;cursor:pointer;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);transition:all 0.25s;box-shadow:0 2px 8px rgba(139,92,246,0.08);}
.w-model-btn:hover{background:rgba(139,92,246,0.18);border-color:rgba(139,92,246,0.4);box-shadow:0 4px 12px rgba(139,92,246,0.15);}
.w-model-dropdown{position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:50;background:rgba(12,12,22,0.98);border:1px solid rgba(139,92,246,0.35);border-radius:14px;backdrop-filter:blur(24px) saturate(180%);overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.05) inset;}
@keyframes fadeInDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
.w-model-opt{width:100%;display:flex;align-items:center;gap:14px;padding:14px 18px;cursor:pointer;transition:background 0.2s;background:transparent;border:none;text-align:left;}
.w-model-opt:hover{background:rgba(255,255,255,0.05);}
.w-model-opt.active{background:rgba(139,92,246,0.18);}

/* Progress Bar */
.w-progress-bar{width:100%;border-radius:3px;height:7px;overflow:hidden;background:rgba(255,255,255,0.08);margin:8px 0;box-shadow:0 1px 3px rgba(0,0,0,0.2) inset;}
.w-progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);box-shadow:0 0 12px rgba(139,92,246,0.7);transition:width 0.1s;position:relative;overflow:hidden;}
.w-progress-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:shimmer 2s infinite;}
@keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}
.w-step{display:flex;align-items:center;gap:5px;border-radius:6px;padding:3px 8px;}

/* MIDI Player Controls */
.w-ctrl-btn{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.25s;color:#9ca3af;box-shadow:0 2px 6px rgba(0,0,0,0.1);}
.w-ctrl-btn:hover:not(:disabled){background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.18);box-shadow:0 3px 10px rgba(0,0,0,0.15);}
.w-ctrl-btn:disabled{opacity:0.25;cursor:not-allowed;}
.w-ctrl-btn.accent{background:rgba(59,130,246,0.14);border-color:rgba(59,130,246,0.35);color:#93c5fd;}
.w-ctrl-btn.accent:hover:not(:disabled){background:rgba(59,130,246,0.24);border-color:rgba(59,130,246,0.5);}
.w-midi-play{width:56px;height:56px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;transition:all 0.35s cubic-bezier(0.4,0,0.2,1);cursor:pointer;background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 6px 20px rgba(139,92,246,0.4),0 2px 0 rgba(255,255,255,0.15) inset;}
.w-midi-play:hover:not(:disabled){box-shadow:0 8px 24px rgba(139,92,246,0.5);transform:translateY(-2px);}
.w-midi-play:active:not(:disabled){transform:translateY(0);}
.w-midi-play:disabled{background:rgba(255,255,255,0.04)!important;opacity:0.3!important;cursor:not-allowed!important;box-shadow:none!important;}

/* Seek Slider */
.w-seek{width:100%;height:5px;border-radius:3px;outline:none;appearance:none;cursor:pointer;background:rgba(255,255,255,0.1);}
.w-seek:disabled{cursor:default;}
.w-seek::-webkit-slider-thumb{appearance:none;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#8b5cf6);box-shadow:0 0 12px rgba(139,92,246,0.8),0 2px 6px rgba(0,0,0,0.3);cursor:pointer;transition:all 0.2s;}
.w-seek::-webkit-slider-thumb:hover{transform:scale(1.15);}
.w-seek:disabled::-webkit-slider-thumb{background:#374151;box-shadow:none;}
.w-seek::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#8b5cf6);box-shadow:0 0 12px rgba(139,92,246,0.8);cursor:pointer;}
.w-stat-box{border-radius:10px;padding:10px;text-align:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);box-shadow:0 2px 6px rgba(0,0,0,0.1) inset;}

/* Convert Button */
.w-convert-btn{width:100%;border-radius:14px;padding:14px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:13px;font-weight:600;transition:all 0.35s cubic-bezier(0.4,0,0.2,1);}

/* Piano Roll - Premium Container */
.w-piano-wrap{position:relative;border-radius:20px 20px 0 0;overflow:hidden;flex-shrink:0;height:330px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);border-bottom:none;box-shadow:0 -4px 24px rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.04) inset;display:flex;flex-direction:column;}
.w-piano-wrap.edit-mode{height:clamp(730px,95vh,940px);min-height:730px;}
.w-piano-wrap.edit-mode .w-piano-body{min-height:510px;}
.w-piano-header{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(180deg,rgba(0,0,0,0.4),rgba(0,0,0,0.3));backdrop-filter:blur(12px);}
.w-piano-body{flex:1;min-height:180px;}
.w-roll-scroll{width:100%;height:100%;overflow-y:hidden;overflow-x:hidden;}
.w-roll-scroll.scroll-x{overflow-x:auto;}
.w-live-badge{display:flex;align-items:center;gap:7px;border-radius:24px;padding:5px 12px;background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.3);box-shadow:0 0 12px rgba(16,185,129,0.15);}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.25;}}
.w-live-dot{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.8);animation:blink 1.2s infinite;}
.w-piano-meta{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;}
.w-edit-pill{display:flex;align-items:center;gap:7px;border-radius:999px;padding:5px 12px;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.32);box-shadow:0 0 12px rgba(139,92,246,0.14);}
.w-edit-pill-dot{width:7px;height:7px;border-radius:50%;background:#a78bfa;box-shadow:0 0 8px rgba(167,139,250,0.8);}
.w-note-view-switch{display:flex;align-items:center;gap:4px;padding:3px;border-radius:9px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);}
.w-note-view-btn{border:none;border-radius:7px;padding:5px 9px;background:transparent;color:#9ca3af;font-size:9px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
.w-note-view-btn:hover{background:rgba(255,255,255,0.06);color:#d1d5db;}
.w-note-view-btn.active{background:linear-gradient(135deg,rgba(59,130,246,0.35),rgba(139,92,246,0.35));color:#e9d5ff;box-shadow:0 0 12px rgba(139,92,246,0.22);}
.w-note-edit-btn{border-radius:8px;padding:6px 10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;transition:all 0.2s;}
.w-note-edit-btn:hover:not(:disabled){background:rgba(139,92,246,0.14);border-color:rgba(139,92,246,0.34);color:#c4b5fd;}
.w-note-edit-btn.active{background:rgba(139,92,246,0.2);border-color:rgba(139,92,246,0.44);color:#ddd6fe;box-shadow:0 0 12px rgba(139,92,246,0.22);}
.w-note-edit-btn:disabled{opacity:0.45;cursor:not-allowed;}
.w-score-readable-btn{border-radius:8px;padding:6px 10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;transition:all 0.2s;}
.w-score-readable-btn:hover:not(:disabled){background:rgba(16,185,129,0.14);border-color:rgba(16,185,129,0.34);color:#86efac;}
.w-score-readable-btn:disabled{opacity:0.45;cursor:not-allowed;}
.w-score-readable-btn.active{background:rgba(16,185,129,0.2);border-color:rgba(16,185,129,0.42);color:#bbf7d0;box-shadow:0 0 12px rgba(16,185,129,0.18);}
.w-note-guide-btn{border-radius:8px;padding:6px 10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;transition:all 0.2s;}
.w-note-guide-btn:hover:not(:disabled){background:rgba(59,130,246,0.14);border-color:rgba(59,130,246,0.34);color:#bfdbfe;}
.w-note-guide-btn:disabled{opacity:0.45;cursor:not-allowed;}
.w-note-guide-btn.active{background:rgba(59,130,246,0.2);border-color:rgba(59,130,246,0.44);color:#dbeafe;box-shadow:0 0 12px rgba(59,130,246,0.2);}
.w-finger-suggest-btn{border-radius:8px;padding:6px 10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;transition:all 0.2s;}
.w-finger-suggest-btn:hover:not(:disabled){background:rgba(245,158,11,0.14);border-color:rgba(245,158,11,0.34);color:#fde68a;}
.w-finger-suggest-btn:disabled{opacity:0.45;cursor:not-allowed;}
.w-finger-suggest-btn.active{background:rgba(245,158,11,0.22);border-color:rgba(245,158,11,0.45);color:#fef3c7;box-shadow:0 0 12px rgba(245,158,11,0.2);}
.w-finger-level-switch{display:flex;align-items:center;gap:4px;padding:3px;border-radius:9px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);}
.w-finger-level-btn{border:none;border-radius:7px;padding:5px 9px;background:transparent;color:#9ca3af;font-size:9px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
.w-finger-level-btn:hover{background:rgba(255,255,255,0.06);color:#d1d5db;}
.w-finger-level-btn.active{background:linear-gradient(135deg,rgba(245,158,11,0.34),rgba(251,191,36,0.3));color:#fef3c7;box-shadow:0 0 12px rgba(251,191,36,0.2);}
.w-edit-tools{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(180deg,rgba(12,12,22,0.7),rgba(10,10,18,0.55));}
.w-finger-quick{display:flex;align-items:center;gap:5px;padding:4px 7px;border-radius:8px;border:1px solid rgba(245,158,11,0.25);background:rgba(245,158,11,0.08);}
.w-edit-tool-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:1px solid rgba(255,255,255,0.12);border-radius:7px;background:rgba(255,255,255,0.04);color:#d1d5db;padding:5px 9px;font-size:10px;font-weight:700;letter-spacing:0.03em;cursor:pointer;transition:all 0.2s;}
.w-edit-tool-btn:hover{background:rgba(139,92,246,0.16);border-color:rgba(139,92,246,0.38);}
.w-edit-tool-btn:disabled{opacity:0.35;cursor:not-allowed;}
.w-edit-tool-btn.active{background:rgba(16,185,129,0.18);border-color:rgba(16,185,129,0.35);color:#86efac;}
.w-edit-tool-btn.active:hover{background:rgba(16,185,129,0.24);}
.w-edit-zoom{display:flex;align-items:center;gap:5px;padding:4px 7px;border-radius:8px;border:1px solid rgba(255,255,255,0.09);background:rgba(0,0,0,0.26);}
.w-edit-zoom-label{font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.04em;min-width:15px;}
.w-edit-help-overlay{position:absolute;left:10px;right:10px;top:92px;bottom:auto;z-index:35;border-radius:14px;padding:11px;background:linear-gradient(180deg,rgba(7,10,24,0.94),rgba(8,8,18,0.9));border:1px solid rgba(139,92,246,0.34);box-shadow:0 10px 32px rgba(0,0,0,0.5),0 0 22px rgba(139,92,246,0.16) inset;backdrop-filter:blur(10px);}
.w-edit-help-overlay-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;}
.w-edit-help-overlay-title{font-size:10px;color:#e9d5ff;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;}
.w-edit-help-overlay-hint{font-size:9px;color:#93c5fd;letter-spacing:0.04em;}
.w-edit-help-topics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;align-content:start;}
.w-guide-topic{position:relative;min-width:0;}
.w-guide-topic-title{width:100%;display:flex;align-items:center;justify-content:center;min-height:30px;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:#e5e7eb;font-size:10px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.w-guide-topic:hover .w-guide-topic-title,.w-guide-topic:focus-within .w-guide-topic-title{background:rgba(139,92,246,0.22);border-color:rgba(139,92,246,0.44);color:#f5f3ff;}
.w-guide-tooltip{position:absolute;left:0;top:calc(100% + 8px);width:min(360px,72vw);padding:10px 11px;border-radius:10px;border:1px solid rgba(139,92,246,0.38);background:linear-gradient(145deg,rgba(8,8,18,0.98),rgba(10,14,26,0.97));box-shadow:0 8px 20px rgba(0,0,0,0.45);opacity:0;transform:translateY(-5px);pointer-events:none;transition:opacity 0.18s ease,transform 0.18s ease;z-index:40;}
.w-guide-topic:hover .w-guide-tooltip,.w-guide-topic:focus-within .w-guide-tooltip{opacity:1;transform:translateY(0);}
.w-guide-topic:nth-child(5n) .w-guide-tooltip,.w-guide-topic:nth-child(5n-1) .w-guide-tooltip{left:auto;right:0;}
.w-guide-tooltip-title{font-size:10px;font-weight:800;color:#ddd6fe;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:5px;}
.w-guide-tooltip p{font-size:10px;color:#cbd5e1;line-height:1.35;margin-top:3px;}
.w-guide-tooltip strong{color:#f5f3ff;font-weight:700;}
.w-edit-history-panel{position:absolute;top:94px;right:12px;z-index:34;width:min(360px,42vw);max-height:min(58vh,420px);display:flex;flex-direction:column;border-radius:12px;border:1px solid rgba(59,130,246,0.34);background:linear-gradient(170deg,rgba(9,12,24,0.97),rgba(10,10,18,0.96));box-shadow:0 12px 28px rgba(0,0,0,0.45);}
.w-edit-history-head{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;border-bottom:1px solid rgba(255,255,255,0.08);}
.w-edit-history-head p{font-size:10px;color:#bfdbfe;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;}
.w-edit-history-meta{font-size:9px;color:#9ca3af;}
.w-edit-history-list{overflow:auto;padding:7px 8px 8px;display:flex;flex-direction:column;gap:6px;}
.w-edit-history-item{width:100%;border-radius:8px;padding:7px 8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);text-align:left;cursor:pointer;transition:all 0.18s;}
.w-edit-history-item:hover{background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.35);}
.w-edit-history-item:focus-visible{outline:none;box-shadow:0 0 0 2px rgba(59,130,246,0.45);}
.w-edit-history-item-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.w-edit-history-item p{font-size:10px;color:#e5e7eb;line-height:1.3;}
.w-edit-history-item span{font-size:9px;color:#9ca3af;}
.w-edit-history-type{font-size:8px;color:#bfdbfe;text-transform:uppercase;letter-spacing:0.06em;padding:1px 5px;border-radius:999px;border:1px solid rgba(59,130,246,0.35);background:rgba(59,130,246,0.15);}
.w-edit-history-item-sub{display:block;margin-top:4px;font-size:8px;color:#6b7280;letter-spacing:0.03em;text-transform:uppercase;}
.w-edit-history-empty{padding:18px 10px 20px;text-align:center;font-size:10px;color:#6b7280;}
.w-keyboard-hints-panel{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(180deg,rgba(8,10,20,0.72),rgba(8,8,16,0.68));}
.w-keyboard-hints-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;}
.w-keyboard-hints-title{font-size:10px;color:#bfdbfe;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;}
.w-keyboard-hints-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:6px;}
.w-keyboard-hint-chip{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:5px 7px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);}
.w-keyboard-hint-note{font-size:10px;color:#e5e7eb;font-weight:700;letter-spacing:0.03em;}
.w-keyboard-hint-keys{font-size:9px;color:#93c5fd;font-weight:700;letter-spacing:0.06em;}
.w-score-disclaimer{position:absolute;right:10px;bottom:8px;z-index:28;max-width:430px;padding:8px 11px;border-radius:10px;border:1px solid rgba(139,92,246,0.32);background:linear-gradient(135deg,rgba(59,130,246,0.3),rgba(139,92,246,0.24));font-size:10px;color:#f1f5f9;letter-spacing:0.01em;box-shadow:0 8px 18px rgba(0,0,0,0.35);}
.w-score-disclaimer strong{color:#f5f3ff;font-weight:800;}

/* History Page */
.w-history{display:flex;flex-direction:column;flex:1;overflow:hidden;padding:20px 24px;gap:14px;}
.w-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;flex-shrink:0;}
.w-stat-card{border-radius:20px;padding:18px;display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015));border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(16px);box-shadow:0 4px 16px rgba(0,0,0,0.2),0 1px 0 rgba(255,255,255,0.05) inset;}
.w-toolbar{display:flex;align-items:center;gap:14px;border-radius:14px;padding:10px 14px;flex-shrink:0;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);box-shadow:0 2px 8px rgba(0,0,0,0.15);}
.w-search{display:flex;align-items:center;gap:10px;flex:1;border-radius:10px;padding:8px 14px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);transition:all 0.25s;}
.w-search:focus-within{border-color:rgba(139,92,246,0.4);box-shadow:0 0 12px rgba(139,92,246,0.15);}
.w-search input{background:transparent;border:none;outline:none;font-size:12px;color:#e5e7eb;width:100%;}
.w-search input::placeholder{color:#6b7280;}
.w-filter-group{display:flex;align-items:center;gap:5px;border-radius:10px;padding:5px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);}
.w-filter-btn{font-size:11px;font-weight:500;padding:5px 12px;border-radius:7px;cursor:pointer;transition:all 0.2s;border:1px solid transparent;background:transparent;color:#6b7280;white-space:nowrap;}
.w-filter-btn:hover:not(.active-p):not(.active-b){background:rgba(255,255,255,0.04);}
.w-filter-btn.active-p{background:rgba(139,92,246,0.22);color:#c4b5fd;border-color:rgba(139,92,246,0.35);box-shadow:0 0 8px rgba(139,92,246,0.15);}
.w-filter-btn.active-b{background:rgba(59,130,246,0.18);color:#93c5fd;border-color:rgba(59,130,246,0.35);box-shadow:0 0 8px rgba(59,130,246,0.12);}
.w-sort-wrap{position:relative;}
.w-sort-btn{display:flex;align-items:center;gap:9px;border-radius:10px;padding:8px 14px;cursor:pointer;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);font-size:11px;color:#9ca3af;transition:all 0.25s;}
.w-sort-btn:hover{background:rgba(0,0,0,0.45);border-color:rgba(255,255,255,0.15);}
.w-sort-dropdown{position:absolute;top:calc(100% + 8px);right:0;z-index:50;min-width:140px;background:rgba(12,12,22,0.98);border:1px solid rgba(255,255,255,0.12);border-radius:12px;overflow:hidden;backdrop-filter:blur(24px);animation:fadeInDown 0.2s ease;box-shadow:0 8px 32px rgba(0,0,0,0.5);}
.w-sort-opt{width:100%;padding:11px 18px;font-size:12px;text-align:left;cursor:pointer;border:none;background:transparent;color:#9ca3af;transition:all 0.15s;border-bottom:1px solid rgba(255,255,255,0.06);}
.w-sort-opt:last-child{border-bottom:none;}
.w-sort-opt.active{background:rgba(139,92,246,0.15);color:#c4b5fd;}
.w-sort-opt:hover:not(.active){background:rgba(255,255,255,0.05);}

/* Table - Premium Design */
.w-table{flex:1;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 16px rgba(0,0,0,0.25),0 1px 0 rgba(255,255,255,0.04) inset;}
.w-table-head{display:grid;padding:12px 18px;flex-shrink:0;background:rgba(0,0,0,0.25);border-bottom:1px solid rgba(255,255,255,0.08);grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr auto;}
.w-table-head span{font-size:10px;color:#6b7280;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}
.w-table-body{flex:1;overflow-y:auto;}
.w-table-row{display:grid;padding:12px 18px;align-items:center;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr auto;border-bottom:1px solid rgba(255,255,255,0.04);transition:all 0.2s;}
.w-table-row:hover{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06);}
.w-row-actions{opacity:0;transition:opacity 0.2s;display:flex;align-items:center;gap:7px;}
.w-table-row:hover .w-row-actions{opacity:1;}
.w-table-foot{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;flex-shrink:0;border-top:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.25);}
.w-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 0;}

/* Icon Buttons */
.w-icon-btn{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;border:1px solid;}
.w-icon-btn-dl{background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.25);color:#60a5fa;}
.w-icon-btn-dl:hover{background:rgba(59,130,246,0.22);box-shadow:0 2px 8px rgba(59,130,246,0.2);}
.w-icon-btn-retry{background:rgba(245,158,11,0.12);border-color:rgba(245,158,11,0.25);color:#fbbf24;}
.w-icon-btn-retry:hover{background:rgba(245,158,11,0.22);box-shadow:0 2px 8px rgba(245,158,11,0.2);}
.w-icon-btn-del{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2);color:#f87171;}
.w-icon-btn-del:hover{background:rgba(239,68,68,0.2);box-shadow:0 2px 8px rgba(239,68,68,0.15);}

/* Status Pills */
.w-status-pill{display:flex;align-items:center;gap:5px;border-radius:24px;padding:3px 10px;font-size:9px;font-weight:600;border:1px solid;}
.w-status-ok{background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.25);color:#10b981;}
.w-status-fail{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.25);color:#ef4444;}

/* Settings Page */
.w-settings{flex:1;overflow-y:auto;padding:20px 24px 32px;}
.w-settings-inner{max-width:800px;margin:0 auto;}
.w-section-card{border-radius:20px;padding:24px;margin-bottom:18px;background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015));border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(16px);box-shadow:0 4px 16px rgba(0,0,0,0.2),0 1px 0 rgba(255,255,255,0.05) inset;}
.w-section-title{display:flex;align-items:center;gap:12px;margin-bottom:18px;}
.w-section-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.3);color:#c4b5fd;flex-shrink:0;box-shadow:0 2px 8px rgba(139,92,246,0.15);}
.w-setting-row{display:flex;align-items:center;justify-content:space-between;gap:18px;}
.w-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);margin:18px 0;}

/* Toggle Switch */
.w-toggle{width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:all 0.3s;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.15) inset;}
.w-toggle-thumb{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:left 0.3s cubic-bezier(0.4,0,0.2,1);}

/* Select Dropdown */
.w-select{background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#d1d5db;font-size:12px;padding:7px 32px 7px 12px;cursor:pointer;outline:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;transition:all 0.25s;}
.w-select:hover{background:rgba(0,0,0,0.55);border-color:rgba(255,255,255,0.18);}
.w-select option{background:#0f0f1a;padding:8px;}

/* Slider */
.w-slider{appearance:none;width:130px;height:5px;border-radius:3px;outline:none;cursor:pointer;background:rgba(255,255,255,0.1);}
.w-slider::-webkit-slider-thumb{appearance:none;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#8b5cf6);box-shadow:0 0 10px rgba(139,92,246,0.8),0 2px 6px rgba(0,0,0,0.3);cursor:pointer;transition:all 0.2s;}
.w-slider::-webkit-slider-thumb:hover{transform:scale(1.12);}
.w-slider::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#8b5cf6);box-shadow:0 0 10px rgba(139,92,246,0.8);cursor:pointer;}

/* Model Pills */
.w-model-pill{display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:14px;cursor:pointer;transition:all 0.25s;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);font-size:12px;color:#9ca3af;}
.w-model-pill:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.12);box-shadow:0 2px 8px rgba(0,0,0,0.15);}

/* Quality Tabs */
.w-quality-tab{font-size:11px;font-weight:500;padding:6px 14px;border-radius:8px;cursor:pointer;transition:all 0.2s;border:1px solid transparent;background:transparent;color:#6b7280;}
.w-quality-tab:hover:not(.active){background:rgba(255,255,255,0.04);}
.w-quality-tab.active{background:rgba(139,92,246,0.22);color:#c4b5fd;border-color:rgba(139,92,246,0.35);box-shadow:0 0 10px rgba(139,92,246,0.15);}

/* Scrollbar */
.widi-app ::-webkit-scrollbar{width:6px;}
.widi-app ::-webkit-scrollbar-track{background:rgba(0,0,0,0.2);}
.widi-app ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:3px;transition:background 0.25s;}
.widi-app ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.22);}

/* Animations */
@keyframes fadeIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.w-fade-in{animation:fadeIn 0.25s ease;}

@media (max-width: 1040px){
  .w-header{padding:10px 12px;}
  .w-logo-name{font-size:18px;}
  .w-header-controls{gap:8px;}
  .w-header-right{gap:6px;}
  .w-nav{gap:4px;}
  .w-nav-btn{padding:6px 10px;font-size:11px;}
  .w-lang-btn{min-width:30px;padding:5px 7px;}
  .w-header-launch{font-size:16px;padding:11px 18px;border-radius:14px;}
  .w-home{padding:16px 14px 20px;}
  .w-home-hero{grid-template-columns:minmax(0,1fr);}
  .w-home-title{font-size:28px;}
  .w-home-kpis{grid-template-columns:repeat(3,minmax(0,1fr));}
  .w-home-section{grid-template-columns:minmax(0,1fr);}
  .w-top-grid{grid-template-columns:minmax(0,1fr);}
  .w-piano-wrap.edit-mode{height:clamp(660px,93vh,820px);min-height:660px;}
  .w-piano-wrap.edit-mode .w-piano-body{min-height:430px;}
  .w-edit-help-overlay{top:86px;}
  .w-edit-help-topics{grid-template-columns:repeat(3,minmax(0,1fr));}
  .w-guide-topic:nth-child(5n) .w-guide-tooltip,.w-guide-topic:nth-child(5n-1) .w-guide-tooltip{left:0;right:auto;}
  .w-guide-topic:nth-child(3n) .w-guide-tooltip{left:auto;right:0;}
  .w-edit-history-panel{left:10px;right:10px;width:auto;max-height:44vh;}
  .w-edit-tools{gap:5px;padding:7px 8px;}
  .w-edit-tool-btn{padding:4px 7px;font-size:9px;}
  .w-score-disclaimer{left:10px;right:10px;max-width:none;}
}
  `;
  container.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════
// PIANO ROLL CLASS (Canvas + Web Audio)
// ═══════════════════════════════════════════════════════════════════

const MIDI_LO = 21, MIDI_HI = 108;
const BLACK_S = new Set([1, 3, 6, 8, 10]);
const KEY_H = 130, BK_RATIO = 0.62;
const STEP_BY_PC = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const TREBLE_LINE_STEPS = [38, 36, 34, 32, 30];
const BASS_LINE_STEPS = [26, 24, 22, 20, 18];
const STAFF_TOP_STEP = TREBLE_LINE_STEPS[0];
const STAFF_BOTTOM_STEP = BASS_LINE_STEPS[BASS_LINE_STEPS.length - 1];
const STAFF_MIDDLE_C_STEP = 28;
const STEP_E4 = 30;

function clampMidi(midi) {
  return Math.max(MIDI_LO, Math.min(MIDI_HI, Math.round(Number(midi) || MIDI_LO)));
}

function midiToNoteName(midi) {
  const normalized = clampMidi(midi);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(normalized / 12) - 1;
  return `${noteNames[normalized % 12]}${octave}`;
}

function midiToDiatonicStep(midi) {
  const normalized = clampMidi(midi);
  const pc = ((normalized % 12) + 12) % 12;
  const octave = Math.floor(normalized / 12) - 1;
  return octave * 7 + STEP_BY_PC[pc];
}

function normalizeFingerSuggestionLevel(level) {
  return String(level || '').trim().toLowerCase() === 'advanced' ? 'advanced' : 'beginner';
}

function normalizeFingerOverride(rawFinger) {
  const finger = Math.round(Number(rawFinger));
  if (!Number.isFinite(finger)) return 0;
  if (finger < 1 || finger > 5) return 0;
  return finger;
}

function _clamp01(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function _groupNotesByOnset(entries, tolerance = 0.045) {
  const groups = [];
  entries.forEach(entry => {
    const last = groups[groups.length - 1];
    if (!last || Math.abs(entry.start - last.start) > tolerance) {
      groups.push({ start: entry.start, notes: [entry] });
    } else {
      last.notes.push(entry);
    }
  });
  groups.forEach(group => {
    group.notes.sort((a, b) => a.midi - b.midi);
  });
  return groups;
}

function _meanMidi(entries, fallback) {
  if (!Array.isArray(entries) || !entries.length) return fallback;
  let total = 0;
  entries.forEach(entry => { total += entry.midi; });
  return total / entries.length;
}

function _chooseEventHandSplit(groupNotes, leftCenter, rightCenter, splitMidi, level) {
  const notes = Array.isArray(groupNotes) ? groupNotes : [];
  const advanced = normalizeFingerSuggestionLevel(level) === 'advanced';
  const wideSpan = notes.length > 1 ? (notes[notes.length - 1].midi - notes[0].midi) : 0;

  let best = { cut: 0, cost: Number.POSITIVE_INFINITY };
  for (let cut = 0; cut <= notes.length; cut += 1) {
    const left = notes.slice(0, cut);
    const right = notes.slice(cut);
    let cost = 0;

    left.forEach(note => {
      cost += Math.abs(note.midi - leftCenter) * 0.82;
      cost += Math.max(0, note.midi - (splitMidi + 2)) * (advanced ? 0.9 : 1.3);
    });
    right.forEach(note => {
      cost += Math.abs(note.midi - rightCenter) * 0.82;
      cost += Math.max(0, (splitMidi - 2) - note.midi) * (advanced ? 0.9 : 1.3);
    });

    if (left.length > 5 || right.length > 5) cost += 1000;
    if (wideSpan >= 9 && (!left.length || !right.length)) cost += advanced ? 2.6 : 4.4;
    if (wideSpan <= 4 && left.length && right.length) cost += advanced ? 0.35 : 0.7;

    if (left.length && right.length) {
      const topLeft = left[left.length - 1].midi;
      const lowRight = right[0].midi;
      cost += Math.max(0, 2 - (lowRight - topLeft)) * (advanced ? 0.6 : 1.0);
      if ((left.length === 1 || right.length === 1) && wideSpan <= 5) cost += 0.35;
    }

    if (cost < best.cost) best = { cut, cost };
  }
  return best.cut;
}

function _midiKeyPosCm(midi) {
  const normalized = clampMidi(midi);
  const keybSize = 16.5;
  const k = keybSize / 7.0;
  const step = (normalized % 12) * k;
  return keybSize * Math.floor(normalized / 12) + step;
}

function _buildHandInternalNotes(entries, hand, level) {
  const notes = [];
  if (!Array.isArray(entries) || !entries.length) return notes;
  const groups = _groupNotesByOnset(entries, 0.04);
  const stagger = normalizeFingerSuggestionLevel(level) === 'advanced' ? 0.035 : 0.05;
  let chordId = 0;
  let noteId = 0;
  const mirror = hand === 'left' ? -1 : 1;

  groups.forEach(group => {
    const g = group.notes.slice().sort((a, b) => a.midi - b.midi);
    if (g.length === 1) {
      const n = g[0];
      notes.push({
        index: n.index,
        noteID: noteId++,
        pitch: n.midi,
        x: _midiKeyPosCm(n.midi) * mirror,
        time: n.start,
        duration: Math.max(0.03, n.duration),
        isBlack: BLACK_S.has(n.midi % 12),
        isChord: false,
        chordID: -1,
        chordnr: 0,
        NinChord: 0,
        fingering: 0,
        anchorFinger: n.override || 0,
      });
      return;
    }

    g.forEach((n, idx) => {
      const offset = stagger * (g.length - idx - 1);
      notes.push({
        index: n.index,
        noteID: noteId++,
        pitch: n.midi,
        x: _midiKeyPosCm(n.midi) * mirror,
        time: n.start - offset,
        duration: Math.max(0.03, n.duration) + (stagger * (g.length - 1)),
        isBlack: BLACK_S.has(n.midi % 12),
        isChord: true,
        chordID: chordId,
        chordnr: idx,
        NinChord: g.length,
        fingering: 0,
        anchorFinger: n.override || 0,
      });
    });
    chordId += 1;
  });
  return notes;
}

function _createHandModel(hand, level) {
  const advanced = normalizeFingerSuggestionLevel(level) === 'advanced';
  const sizeFactors = { XXS: 0.33, XS: 0.46, S: 0.64, M: 0.82, L: 1.0, XL: 1.1, XXL: 1.2 };
  const sizeKey = advanced ? 'L' : 'M';
  const hf = sizeFactors[sizeKey] || sizeFactors.M;
  const frest = [null, -7.0, -2.8, 0.0, 2.8, 5.6];
  for (let i = 1; i <= 5; i += 1) frest[i] *= hf;
  return {
    LR: hand,
    hf,
    frest,
    weights: [null, 1.1, 1.0, 1.1, 0.9, 0.8],
    bfactor: [null, 0.3, 1.0, 1.1, 0.8, 0.7],
    fingers: [1, 2, 3, 4, 5],
    depth: advanced ? 9 : 7,
    autodepth: true,
    preservePostureMemory: false,
    relocationAlpha: 0.3,
    hasPositionState: false,
    maxSpanCm: 21.0 * hf,
    maxFollowLagCm: 2.5 * hf,
    minFingerGapCm: 0.15 * hf,
    fingerPositions: frest.slice(),
  };
}

function _relaxedTargets(model, finger, noteX) {
  const ifx = model.frest[finger];
  if (ifx == null) return {};
  const targets = {};
  for (let j = 1; j <= 5; j += 1) {
    const jfx = model.frest[j];
    if (jfx == null) continue;
    targets[j] = (jfx - ifx) + noteX;
  }
  return targets;
}

function _applyPositionConstraints(model, fingerPositions, activeFinger, noteX, targets) {
  for (let j = 1; j <= 5; j += 1) {
    if (j === activeFinger) continue;
    const pos = fingerPositions[j];
    const target = targets[j];
    if (!Number.isFinite(pos) || !Number.isFinite(target)) continue;
    const lag = pos - target;
    if (lag > model.maxFollowLagCm) fingerPositions[j] = target + model.maxFollowLagCm;
    else if (lag < -model.maxFollowLagCm) fingerPositions[j] = target - model.maxFollowLagCm;
  }

  for (let j = 2; j <= 5; j += 1) {
    const a = fingerPositions[j - 1];
    const b = fingerPositions[j];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    const minAllowed = a + model.minFingerGapCm;
    if (b < minAllowed) fingerPositions[j] = minAllowed;
  }

  if (Number.isFinite(fingerPositions[1]) && Number.isFinite(fingerPositions[5])) {
    const span = fingerPositions[5] - fingerPositions[1];
    if (span > model.maxSpanCm) {
      const limit = model.maxSpanCm / 2.0;
      for (let j = 1; j <= 5; j += 1) {
        if (j === activeFinger || !Number.isFinite(fingerPositions[j])) continue;
        const off = fingerPositions[j] - noteX;
        if (off > limit) fingerPositions[j] = noteX + limit;
        else if (off < -limit) fingerPositions[j] = noteX - limit;
      }
    }
  }
  fingerPositions[activeFinger] = noteX;
}

function _setFingerPositions(model, fingering, notes, idx, fingerPositions = model.fingerPositions, forceRelaxed = false) {
  const fi = fingering[idx];
  const note = notes[idx];
  if (!note || !fi) return;
  const noteX = note.x;
  const targets = _relaxedTargets(model, fi, noteX);
  if (!targets || !Object.keys(targets).length) return;

  if (forceRelaxed || !model.preservePostureMemory) {
    for (let j = 1; j <= 5; j += 1) fingerPositions[j] = Number.isFinite(targets[j]) ? targets[j] : null;
    fingerPositions[fi] = noteX;
    if (fingerPositions === model.fingerPositions) model.hasPositionState = true;
    return;
  }

  for (let j = 1; j <= 5; j += 1) {
    const target = targets[j];
    if (!Number.isFinite(target)) {
      fingerPositions[j] = null;
      continue;
    }
    if (j === fi) {
      fingerPositions[j] = noteX;
      continue;
    }
    const prev = fingerPositions[j];
    if (!Number.isFinite(prev)) fingerPositions[j] = target;
    else fingerPositions[j] = (model.relocationAlpha * prev) + ((1.0 - model.relocationAlpha) * target);
  }
  _applyPositionConstraints(model, fingerPositions, fi, noteX, targets);
  if (fingerPositions === model.fingerPositions) model.hasPositionState = true;
}

function _avgVelocity(model, fingering, notes, depth) {
  const fingerPositions = model.fingerPositions.slice();
  _setFingerPositions(model, fingering, notes, 0, fingerPositions, false);
  let vmean = 0;
  const steps = Math.max(1, depth - 1);
  for (let i = 1; i < depth; i += 1) {
    const na = notes[i - 1];
    const nb = notes[i];
    const fb = fingering[i];
    const fingerPos = fingerPositions[fb];
    if (!na || !nb || !Number.isFinite(fingerPos)) continue;
    const dx = Math.abs(nb.x - fingerPos);
    const dt = Math.abs(nb.time - na.time) + 0.1;
    let v = dx / dt;
    const weight = model.weights[fb] || 1;
    if (nb.isBlack) v /= (weight * (model.bfactor[fb] || 1));
    else v /= weight;
    vmean += v;
    _setFingerPositions(model, fingering, notes, i, fingerPositions, false);
  }
  return vmean / steps;
}

function _skipTransition(model, fa, fb, na, nb) {
  const xba = nb.x - na.x;
  if (!na.isChord && !nb.isChord) {
    if (fa === fb && xba !== 0 && na.duration < 4) return true;
    if (fa > 1) {
      if (fb > 1 && ((fb - fa) * xba) < 0) return true;
      if (fb === 1 && nb.isBlack && xba > 0) return true;
    } else if (na.isBlack && xba < 0 && fb > 1 && na.duration < 2) {
      return true;
    }
  } else if (na.isChord && nb.isChord && na.chordID === nb.chordID) {
    const axba = (Math.abs(xba) * model.hf) / 0.8;
    if (fa === fb) return true;
    if (fa < fb && model.LR === 'left') return true;
    if (fa > fb && model.LR === 'right') return true;
    const a = Math.min(fa, fb);
    const b = Math.max(fa, fb);
    const thresholds = {
      '3-4': 5, '4-5': 5, '2-3': 6, '2-4': 7, '3-5': 8, '2-5': 11,
      '1-2': 12, '1-3': 14, '1-4': 16,
    };
    const key = `${a}-${b}`;
    const limit = thresholds[key];
    if (Number.isFinite(limit) && axba > limit) return true;
  }
  return false;
}

function _optimizeWindow(model, notes, startFinger, level) {
  if (!Array.isArray(notes) || !notes.length) return { out: [], vel: 0, depth: 0 };
  const advanced = normalizeFingerSuggestionLevel(level) === 'advanced';
  let depth = model.depth;

  if (model.autodepth) {
    if (notes[0].isChord) {
      depth = Math.max(3, (notes[0].NinChord - notes[0].chordnr + 1));
    } else {
      const t0 = notes[0].time;
      for (let i = 4; i <= 9; i += 1) {
        depth = i;
        if ((notes[i - 1].time - t0) > 3.5) break;
      }
    }
  }
  depth = Math.max(3, Math.min(depth, advanced ? 9 : 7));

  const uStart = startFinger === 0 ? model.fingers : [startFinger];
  const candidate = new Array(9).fill(0);
  let best = new Array(9).fill(0);
  let minVel = Number.POSITIVE_INFINITY;

  const backtrack = (idx) => {
    if (idx === depth) {
      const vel = _avgVelocity(model, candidate, notes, depth);
      if (vel < minVel) {
        minVel = vel;
        best = candidate.slice();
      }
      return;
    }
    const choices = idx === 0 ? uStart : model.fingers;
    for (let c = 0; c < choices.length; c += 1) {
      const finger = choices[c];
      if (idx > 0 && _skipTransition(model, candidate[idx - 1], finger, notes[idx - 1], notes[idx])) continue;
      candidate[idx] = finger;
      backtrack(idx + 1);
    }
  };
  backtrack(0);
  if (!normalizeFingerOverride(best[0])) {
    const fallback = normalizeFingerOverride(startFinger) || (model.LR === 'left' ? 5 : 1);
    best = new Array(9).fill(fallback);
  }
  return { out: best, vel: Number.isFinite(minVel) ? minVel : 0, depth };
}

function _runHandFingering(entries, hand, level, outMap, meta = null) {
  if (!Array.isArray(entries) || !entries.length) return { events: 0, lowConfidenceEvents: 0, fallbackEvents: 0, avgConfidence: 0 };
  const notes = _buildHandInternalNotes(entries, hand, level);
  if (!notes.length) return { events: 0, lowConfidenceEvents: 0, fallbackEvents: 0, avgConfidence: 0 };
  const model = _createHandModel(hand, level);
  model.fingerPositions = model.frest.slice();
  model.hasPositionState = false;

  let startFinger = 0;
  let out = [];
  const nTotal = notes.length;

  for (let i = 0; i < nTotal; i += 1) {
    if (i > nTotal - 11 && model.autodepth) {
      model.autodepth = false;
      model.depth = 9;
    }

    const ninenotes = notes.slice(i, i + 9);
    if (!ninenotes.length) break;
    while (ninenotes.length < 9) ninenotes.push(ninenotes[ninenotes.length - 1]);

    const anchor = normalizeFingerOverride(notes[i].anchorFinger);
    if (anchor) {
      notes[i].fingering = anchor;
      const optimized = _optimizeWindow(model, ninenotes, anchor, level);
      out = optimized.out;
      startFinger = out.length > 1 ? out[1] : anchor;
      _setFingerPositions(model, out, ninenotes, 0);
      continue;
    }

    let bestFinger = 0;
    if (i > nTotal - 10) {
      if (Array.isArray(out) && out.length > 1) {
        bestFinger = out[1];
        out = [bestFinger].concat(out.slice(2));
        startFinger = out.length > 1 ? out[1] : bestFinger;
      } else {
        const optimized = _optimizeWindow(model, ninenotes, startFinger, level);
        out = optimized.out;
        bestFinger = out[0];
        startFinger = out.length > 1 ? out[1] : out[0];
      }
    } else {
      const optimized = _optimizeWindow(model, ninenotes, startFinger, level);
      out = optimized.out;
      bestFinger = out[0];
      startFinger = out.length > 1 ? out[1] : out[0];
    }

    notes[i].fingering = bestFinger;
    _setFingerPositions(model, out, ninenotes, 0);
  }

  notes.forEach(n => {
    const finger = normalizeFingerOverride(n.fingering);
    if (!finger) return;
    outMap.set(n.index, {
      finger,
      hand,
      confidence: _clamp01(meta?.confidence, 0.54),
      source: String(meta?.source || 'legacy'),
    });
  });
  return {
    events: notes.length,
    lowConfidenceEvents: 0,
    fallbackEvents: meta?.source === 'fallback' ? notes.length : 0,
    avgConfidence: _clamp01(meta?.confidence, 0.54),
  };
}

function _buildHandEventsForSmartFingering(entries) {
  const sorted = (Array.isArray(entries) ? entries : [])
    .slice()
    .sort((a, b) => (a.start - b.start) || (a.midi - b.midi));
  if (!sorted.length) return [];
  const groups = _groupNotesByOnset(sorted, 0.045);
  return groups.map((group, groupIndex) => ({
    id: groupIndex,
    start: Number(group.start) || 0,
    notes: (group.notes || []).slice().sort((a, b) => a.midi - b.midi).map(note => ({
      ...note,
      x: _midiKeyPosCm(note.midi),
      isBlack: BLACK_S.has(note.midi % 12),
    })),
  }));
}

function _buildFallbackFingerSequence(notes, hand) {
  const ordered = hand === 'left' ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5];
  const fallback = [];
  for (let i = 0; i < notes.length; i += 1) {
    const override = normalizeFingerOverride(notes[i]?.override);
    fallback.push(override || ordered[Math.min(i, ordered.length - 1)]);
  }
  return fallback;
}

function _enumerateEventFingerings(notes, hand) {
  const orderedNotes = Array.isArray(notes) ? notes : [];
  if (!orderedNotes.length) return [];
  const out = [];
  const current = new Array(orderedNotes.length).fill(0);
  const used = new Set();
  const allFingers = [1, 2, 3, 4, 5];

  const backtrack = (idx, previousFinger) => {
    if (idx >= orderedNotes.length) {
      out.push(current.slice());
      return;
    }
    const override = normalizeFingerOverride(orderedNotes[idx].override);
    const choices = override ? [override] : allFingers;
    for (let c = 0; c < choices.length; c += 1) {
      const finger = choices[c];
      if (used.has(finger)) continue;
      if (idx > 0) {
        if (hand === 'right' && finger <= previousFinger) continue;
        if (hand === 'left' && finger >= previousFinger) continue;
      }
      used.add(finger);
      current[idx] = finger;
      backtrack(idx + 1, finger);
      used.delete(finger);
    }
  };

  backtrack(0, hand === 'left' ? 6 : 0);
  if (!out.length) out.push(_buildFallbackFingerSequence(orderedNotes, hand));
  return out;
}

function _singleNoteFingerCost(note, finger, hand, level) {
  const advanced = normalizeFingerSuggestionLevel(level) === 'advanced';
  let cost = 0;
  if (note.isBlack && finger === 1) cost += advanced ? 0.55 : 0.95;
  if (note.isBlack && finger === 5) cost += advanced ? 0.35 : 0.65;
  if (!note.isBlack && (finger === 2 || finger === 3 || finger === 4)) cost += 0.08;
  if (hand === 'left' && note.midi >= 72 && finger >= 4) cost += 0.25;
  if (hand === 'right' && note.midi <= 48 && finger <= 2) cost += 0.25;
  return cost;
}

function _eventFingeringCost(notes, fingers, hand, level) {
  const advanced = normalizeFingerSuggestionLevel(level) === 'advanced';
  let cost = 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < notes.length; i += 1) {
    const note = notes[i];
    const finger = normalizeFingerOverride(fingers[i]);
    if (!finger) return Number.POSITIVE_INFINITY;
    if (normalizeFingerOverride(note.override) && note.override !== finger) return Number.POSITIVE_INFINITY;
    cost += _singleNoteFingerCost(note, finger, hand, level);
    minX = Math.min(minX, note.x);
    maxX = Math.max(maxX, note.x);
    if (i > 0) {
      const pitchDelta = Math.max(1, notes[i].midi - notes[i - 1].midi);
      const fingerDelta = Math.abs(fingers[i] - fingers[i - 1]);
      if (fingerDelta === 0) cost += 4;
      else if (fingerDelta > pitchDelta + 1) cost += (fingerDelta - pitchDelta) * 0.7;
    }
  }
  if (notes.length > 1) {
    const spanSemitone = notes[notes.length - 1].midi - notes[0].midi;
    const spanCm = Math.max(0, maxX - minX);
    const maxComfortSemitone = advanced ? 15 : 13;
    const maxComfortCm = advanced ? 12.4 : 11.2;
    if (spanSemitone > maxComfortSemitone) cost += (spanSemitone - maxComfortSemitone) * 0.8;
    if (spanCm > maxComfortCm) cost += (spanCm - maxComfortCm) * 1.2;
  }
  return cost;
}

function _buildEventCandidates(event, hand, level) {
  const notes = Array.isArray(event?.notes) ? event.notes : [];
  if (!notes.length) return [];
  const raw = _enumerateEventFingerings(notes, hand);
  const candidates = raw
    .map(fingers => ({
      fingers,
      cost: _eventFingeringCost(notes, fingers, hand, level),
    }))
    .filter(c => Number.isFinite(c.cost))
    .sort((a, b) => a.cost - b.cost);
  if (!candidates.length) {
    return [{
      fingers: _buildFallbackFingerSequence(notes, hand),
      cost: 6,
    }];
  }
  return candidates.slice(0, 42);
}

function _getEventAnchor(event, candidate, hand) {
  const notes = event.notes || [];
  if (!notes.length) return { x: 0, midi: 60, finger: hand === 'left' ? 5 : 1 };
  const idx = hand === 'left' ? 0 : notes.length - 1;
  return {
    x: notes[idx].x,
    midi: notes[idx].midi,
    finger: normalizeFingerOverride(candidate.fingers[idx]) || (hand === 'left' ? 5 : 1),
  };
}

function _transitionFingeringCost(prevEvent, prevCandidate, nextEvent, nextCandidate, hand, level) {
  const advanced = normalizeFingerSuggestionLevel(level) === 'advanced';
  const prevAnchor = _getEventAnchor(prevEvent, prevCandidate, hand);
  const nextAnchor = _getEventAnchor(nextEvent, nextCandidate, hand);
  const dt = Math.max(0.06, (nextEvent.start - prevEvent.start) || 0);
  const dx = nextAnchor.x - prevAnchor.x;
  const adx = Math.abs(dx);
  const df = nextAnchor.finger - prevAnchor.finger;
  let cost = 0;

  if (prevAnchor.midi !== nextAnchor.midi && prevAnchor.finger === nextAnchor.finger) {
    cost += 2.3 + (adx * 0.12);
  }

  if (hand === 'right') {
    if (dx > 0 && df < -1) cost += 1.7 + Math.abs(df + 1) * 1.05;
    if (dx < 0 && df > 1) cost += 1.4 + Math.abs(df - 1) * 0.95;
  } else {
    if (dx > 0 && df > 1) cost += 1.7 + Math.abs(df - 1) * 1.05;
    if (dx < 0 && df < -1) cost += 1.4 + Math.abs(df + 1) * 0.95;
  }

  const speed = adx / dt;
  cost += speed * (advanced ? 0.045 : 0.058);
  if (dt < 0.17 && adx > 5.5) cost += (adx - 5.5) * (advanced ? 0.35 : 0.48);
  if (Math.abs(df) > 3) cost += (Math.abs(df) - 3) * 0.7;

  if (prevEvent.notes.length > 1 || nextEvent.notes.length > 1) {
    const prevMid = prevEvent.notes[Math.floor((prevEvent.notes.length - 1) / 2)];
    const nextMid = nextEvent.notes[Math.floor((nextEvent.notes.length - 1) / 2)];
    if (prevMid && nextMid) {
      const middleJump = Math.abs(nextMid.x - prevMid.x);
      cost += middleJump * (advanced ? 0.018 : 0.024);
    }
  }
  return cost;
}

function _runHandFingeringSmart(entries, hand, level, outMap) {
  const events = _buildHandEventsForSmartFingering(entries);
  if (!events.length) return { events: 0, lowConfidenceEvents: 0, fallbackEvents: 0, avgConfidence: 0 };
  events.forEach(event => {
    event.candidates = _buildEventCandidates(event, hand, level);
  });
  if (events.some(event => !event.candidates.length)) {
    return _runHandFingering(entries, hand, level, outMap, {
      confidence: 0.46,
      source: 'fallback',
    });
  }

  const n = events.length;
  const dpCosts = Array.from({ length: n }, () => []);
  const dpPrev = Array.from({ length: n }, () => []);

  for (let i = 0; i < events[0].candidates.length; i += 1) {
    dpCosts[0][i] = events[0].candidates[i].cost;
    dpPrev[0][i] = -1;
  }

  for (let e = 1; e < n; e += 1) {
    const currEvent = events[e];
    const prevEvent = events[e - 1];
    for (let j = 0; j < currEvent.candidates.length; j += 1) {
      const currCandidate = currEvent.candidates[j];
      let bestCost = Number.POSITIVE_INFINITY;
      let bestPrev = -1;
      for (let k = 0; k < prevEvent.candidates.length; k += 1) {
        const prevCandidate = prevEvent.candidates[k];
        const transition = _transitionFingeringCost(prevEvent, prevCandidate, currEvent, currCandidate, hand, level);
        const total = (dpCosts[e - 1][k] || 0) + transition + currCandidate.cost;
        if (total < bestCost) {
          bestCost = total;
          bestPrev = k;
        }
      }
      dpCosts[e][j] = bestCost;
      dpPrev[e][j] = bestPrev;
    }
  }

  let bestFinal = 0;
  let bestFinalCost = Number.POSITIVE_INFINITY;
  const lastIdx = n - 1;
  for (let i = 0; i < events[lastIdx].candidates.length; i += 1) {
    const value = dpCosts[lastIdx][i];
    if (value < bestFinalCost) {
      bestFinalCost = value;
      bestFinal = i;
    }
  }

  const chosen = new Array(n).fill(0);
  let ptr = bestFinal;
  for (let e = n - 1; e >= 0; e -= 1) {
    chosen[e] = ptr;
    ptr = dpPrev[e][ptr];
    if (e > 0 && !Number.isInteger(ptr)) ptr = 0;
  }

  const fallbackMap = new Map();
  _runHandFingering(entries, hand, level, fallbackMap, {
    confidence: 0.48,
    source: 'fallback',
  });

  let lowConfidenceEvents = 0;
  let fallbackEvents = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (let e = 0; e < n; e += 1) {
    const event = events[e];
    const chosenIdx = Number.isInteger(chosen[e]) ? chosen[e] : 0;
    const candidate = event.candidates[chosenIdx] || event.candidates[0];
    const secondCandidate = event.candidates[Math.min(event.candidates.length - 1, chosenIdx === 0 ? 1 : 0)];
    const chosenCost = Number(candidate?.cost);
    const secondCost = Number(secondCandidate?.cost);
    const margin = Number.isFinite(secondCost) ? Math.max(0, secondCost - chosenCost) : 0;
    const normalizedMargin = Number.isFinite(chosenCost) ? (margin / Math.max(1, Math.abs(chosenCost))) : 0;
    const confidence = _clamp01(0.2 + Math.min(0.78, normalizedMargin), 0.45);
    const shouldFallback = confidence < 0.34;

    if (shouldFallback) {
      lowConfidenceEvents += 1;
      fallbackEvents += 1;
    }
    confidenceSum += confidence;
    confidenceCount += 1;

    for (let i = 0; i < event.notes.length; i += 1) {
      const noteRef = event.notes[i];
      const fallback = fallbackMap.get(noteRef.index);
      const candidateFinger = normalizeFingerOverride(candidate.fingers[i]);
      const finger = shouldFallback
        ? normalizeFingerOverride(fallback?.finger) || candidateFinger
        : candidateFinger;
      if (!finger) continue;
      outMap.set(noteRef.index, {
        finger,
        hand,
        confidence: shouldFallback ? _clamp01(fallback?.confidence, 0.48) : confidence,
        source: shouldFallback ? 'fallback' : 'smart',
      });
    }
  }
  return {
    events: n,
    lowConfidenceEvents,
    fallbackEvents,
    avgConfidence: confidenceCount ? (confidenceSum / confidenceCount) : 0,
  };
}

function computeFingerSuggestions(notes, level = 'beginner', algorithm = 'legacy') {
  const normalizedLevel = normalizeFingerSuggestionLevel(level);
  const normalizedAlgorithm = normalizeFingerSuggestionAlgorithm(algorithm);
  const map = new Map();
  const sourceNotes = Array.isArray(notes) ? notes : [];
  if (!sourceNotes.length) {
    return {
      map,
      splitMidi: 60,
      diagnostics: {
        avgConfidence: 0,
        lowConfidenceEvents: 0,
        fallbackEvents: 0,
        source: normalizedAlgorithm,
      },
    };
  }

  const entries = sourceNotes.map((note, index) => {
    const midi = clampMidi(note.note);
    return {
      index,
      midi,
      start: Math.max(0, Number(note.startTime) || 0),
      duration: Math.max(0.03, Number(note.duration) || 0.12),
      override: normalizeFingerOverride(note.fingerOverride),
    };
  });
  const sortedPitches = entries.map(item => item.midi).sort((a, b) => a - b);
  const medianPitch = sortedPitches[Math.floor(sortedPitches.length / 2)] || 60;
  const splitMidi = normalizedLevel === 'advanced'
    ? Math.max(52, Math.min(68, medianPitch))
    : 60;
  const reports = [];

  if (normalizedAlgorithm === 'legacy') {
    const sorted = entries.slice().sort((a, b) => (a.start - b.start) || (a.midi - b.midi));
    const groups = _groupNotesByOnset(sorted, 0.04);
    const leftEntries = [];
    const rightEntries = [];
    let leftCenter = splitMidi - 8;
    let rightCenter = splitMidi + 8;
    groups.forEach(group => {
      const notesInGroup = (group.notes || []).slice().sort((a, b) => a.midi - b.midi);
      const cut = _chooseEventHandSplit(notesInGroup, leftCenter, rightCenter, splitMidi, normalizedLevel);
      const left = notesInGroup.slice(0, cut);
      const right = notesInGroup.slice(cut);
      leftEntries.push(...left);
      rightEntries.push(...right);
      if (left.length) leftCenter = _meanMidi(left, leftCenter);
      if (right.length) rightCenter = _meanMidi(right, rightCenter);
    });
    reports.push(_runHandFingeringSmart(leftEntries, 'left', normalizedLevel, map));
    reports.push(_runHandFingeringSmart(rightEntries, 'right', normalizedLevel, map));
  }

  entries.forEach(entry => {
    if (!entry.override) return;
    const resolvedHand = entry.midi <= splitMidi ? 'left' : 'right';
    map.set(entry.index, {
      finger: entry.override,
      hand: resolvedHand,
      confidence: 1,
      source: 'manual',
    });
  });

  let events = 0;
  let lowConfidenceEvents = 0;
  let fallbackEvents = 0;
  let weightedConfidence = 0;
  reports.forEach(report => {
    const safeReport = report && typeof report === 'object' ? report : {};
    const eventCount = Math.max(0, Number(safeReport.events) || 0);
    const avg = _clamp01(safeReport.avgConfidence, 0.5);
    events += eventCount;
    lowConfidenceEvents += Math.max(0, Number(safeReport.lowConfidenceEvents) || 0);
    fallbackEvents += Math.max(0, Number(safeReport.fallbackEvents) || 0);
    weightedConfidence += avg * eventCount;
  });
  const avgConfidence = events > 0 ? (weightedConfidence / events) : 0.5;

  return {
    map,
    splitMidi,
    diagnostics: {
      avgConfidence,
      lowConfidenceEvents,
      fallbackEvents,
      source: normalizedAlgorithm,
    },
  };
}

function _drawFingerBadge(ctx, x, y, finger, hand, active = false, confidence = 1) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.save();
  ctx.globalAlpha = 0.5 + (_clamp01(confidence, 0.65) * 0.5);
  const safeFinger = Math.max(1, Math.min(5, Number(finger) || 3));
  const isLeft = hand === 'left';
  const fingerPalette = {
    1: ['#14b8a6', '#0f766e'],
    2: ['#60a5fa', '#1d4ed8'],
    3: ['#a78bfa', '#6d28d9'],
    4: ['#f472b6', '#be185d'],
    5: ['#f59e0b', '#b45309'],
  };
  const fillPair = fingerPalette[safeFinger] || fingerPalette[3];
  const ring = isLeft
    ? (active ? 'rgba(147,197,253,0.95)' : 'rgba(96,165,250,0.9)')
    : (active ? 'rgba(253,186,116,0.95)' : 'rgba(251,191,36,0.9)');
  const fillA = fillPair[0];
  const fillB = fillPair[1];
  const radius = active ? 9.2 : 8.4;
  const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  gradient.addColorStop(0, fillA);
  gradient.addColorStop(1, fillB);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(safeFinger), x, y + 0.2);
  const markerX = isLeft ? (x - radius + 2.4) : (x + radius - 2.4);
  const markerColor = isLeft ? '#93c5fd' : '#fcd34d';
  ctx.fillStyle = markerColor;
  ctx.beginPath();
  ctx.arc(markerX, y - radius + 2.2, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

class PianoRoll {
  constructor(container, notes, options = {}) {
    this.container = container;
    this.notes = notes;
    this.editMode = Boolean(options.editMode);
    this.onNotesChange = typeof options.onNotesChange === 'function' ? options.onNotesChange : null;
    this.onEditCommit = typeof options.onEditCommit === 'function' ? options.onEditCommit : null;
    this.onUndoRequest = typeof options.onUndoRequest === 'function' ? options.onUndoRequest : null;
    this.onRedoRequest = typeof options.onRedoRequest === 'function' ? options.onRedoRequest : null;
    this.onFingerSuggestionUpdate = typeof options.onFingerSuggestionUpdate === 'function' ? options.onFingerSuggestionUpdate : null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.pressedKeys = new Set();
    this.noteHitboxes = [];
    this.hoverNoteIndex = -1;
    this.selectedNoteIndex = -1;
    this.selectedNoteIndices = new Set();
    this.hoverNoteMode = null;
    this.draggingNote = null;
    this.lasso = null;
    this.isLassoSelecting = false;
    this.zoomX = Math.max(0.6, Math.min(2.4, Number(options.zoomX) || 1));
    this.zoomY = Math.max(0.6, Math.min(2.4, Number(options.zoomY) || 1));
    this.fingerSuggestionMode = Boolean(options.fingerSuggestionMode);
    this.showComputerKeyHints = Boolean(options.showComputerKeyHints);
    this.fingerSuggestionLevel = normalizeFingerSuggestionLevel(options.fingerSuggestionLevel);
    this.fingerSuggestionAlgorithm = normalizeFingerSuggestionAlgorithm(options.fingerSuggestionAlgorithm);
    this.fingerSuggestionMap = new Map();
    this.fingerSuggestionDiagnostics = null;
    this.fingerSuggestionDirty = true;
    this.fingerSuggestionSignature = '';
    this.nextFingerSuggestionScanAt = 0;
    this.animId = 0;
    this.lastTs = null;
    this.internalTime = 0;
    this.W = 0; this.H = 0;
    this.viewportW = 0;
    this.scrollRatio = 0;
    this.keys = [];

    this.scrollHost = document.createElement('div');
    this.scrollHost.className = 'w-roll-scroll';
    container.appendChild(this.scrollHost);

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;';
    this.scrollHost.appendChild(this.canvas);

    this._ro = new ResizeObserver(() => this._setup());
    this._ro.observe(container);
    this._setup();
    this._bindEvents();
  }

  _localPointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.W / Math.max(1, rect.width));
    const y = (e.clientY - rect.top) * (this.H / Math.max(1, rect.height));
    return { x, y };
  }

  _isSelected(index) {
    return this.selectedNoteIndices.has(index);
  }

  _setSingleSelection(index) {
    this.selectedNoteIndices.clear();
    if (Number.isInteger(index) && index >= 0 && index < this.notes.length) {
      this.selectedNoteIndices.add(index);
      this.selectedNoteIndex = index;
    } else {
      this.selectedNoteIndex = -1;
    }
  }

  _toggleSelection(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.notes.length) return;
    if (this.selectedNoteIndices.has(index)) {
      this.selectedNoteIndices.delete(index);
      this.selectedNoteIndex = this.selectedNoteIndices.size
        ? Array.from(this.selectedNoteIndices).sort((a, b) => a - b)[this.selectedNoteIndices.size - 1]
        : -1;
      return;
    }
    this.selectedNoteIndices.add(index);
    this.selectedNoteIndex = index;
  }

  _clearSelection() {
    this.selectedNoteIndices.clear();
    this.selectedNoteIndex = -1;
  }

  _rectsIntersect(a, b) {
    return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
  }

  _normalizedRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    return { x, y, w, h };
  }

  _startLasso(x, y, additive = false) {
    this.isLassoSelecting = true;
    this.lasso = {
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      additive: Boolean(additive),
    };
    if (!additive) this._clearSelection();
    this.canvas.style.cursor = 'crosshair';
  }

  _updateLasso(x, y) {
    if (!this.isLassoSelecting || !this.lasso) return;
    this.lasso.endX = x;
    this.lasso.endY = y;
    const rect = this._normalizedRect(this.lasso.startX, this.lasso.startY, this.lasso.endX, this.lasso.endY);
    if (rect.w < 2 && rect.h < 2) return;

    const selected = this.lasso.additive ? new Set(this.selectedNoteIndices) : new Set();
    this.noteHitboxes.forEach(box => {
      if (this._rectsIntersect(rect, box)) selected.add(box.index);
    });

    this.selectedNoteIndices = selected;
    this.selectedNoteIndex = selected.size ? Array.from(selected).sort((a, b) => a - b)[selected.size - 1] : -1;
    this.hoverNoteIndex = -1;
    this.hoverNoteMode = null;
  }

  _finishLasso() {
    if (!this.isLassoSelecting) return;
    this.isLassoSelecting = false;
    if (this.lasso) {
      const rect = this._normalizedRect(this.lasso.startX, this.lasso.startY, this.lasso.endX, this.lasso.endY);
      if (rect.w >= 2 || rect.h >= 2) {
        const selected = this.lasso.additive ? new Set(this.selectedNoteIndices) : new Set();
        this.noteHitboxes.forEach(box => {
          if (this._rectsIntersect(rect, box)) selected.add(box.index);
        });
        this.selectedNoteIndices = selected;
        this.selectedNoteIndex = selected.size ? Array.from(selected).sort((a, b) => a - b)[selected.size - 1] : -1;
      }
    }
    this.lasso = null;
    this.canvas.style.cursor = 'default';
  }

  _getSelectedIndicesOrdered() {
    return Array.from(this.selectedNoteIndices).filter(index => index >= 0 && index < this.notes.length).sort((a, b) => a - b);
  }

  _getEditableIndicesForOperations(activeIndex = -1) {
    const selected = this._getSelectedIndicesOrdered();
    if (selected.length) return selected;
    if (Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < this.notes.length) return [activeIndex];
    return [];
  }

  _deleteNotesByIndices(indices) {
    if (!Array.isArray(indices) || !indices.length) return false;
    const unique = Array.from(new Set(indices))
      .filter(index => Number.isInteger(index) && index >= 0 && index < this.notes.length)
      .sort((a, b) => b - a);
    if (!unique.length) return false;

    unique.forEach(index => {
      this.notes.splice(index, 1);
    });

    this.draggingNote = null;
    this.hoverNoteIndex = -1;
    this.hoverNoteMode = null;
    this._clearSelection();
    this._emitNotesMutation('Delete notes');
    return true;
  }

  getSelectionTimeRange() {
    const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
    if (!indices.length) return null;
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = 0;
    indices.forEach(index => {
      const note = this.notes[index];
      if (!note) return;
      const start = Math.max(0, Number(note.startTime) || 0);
      const duration = Math.max(0.03, Number(note.duration) || 0.12);
      minStart = Math.min(minStart, start);
      maxEnd = Math.max(maxEnd, start + duration);
    });
    if (!Number.isFinite(minStart) || maxEnd <= minStart) return null;
    return { start: minStart, end: maxEnd };
  }

  _playNote(midi) {
    playPreviewNote(midi).catch(error => {
      console.error('Preview note error:', error);
    });
  }

  _setCursor(y, noteMode = null) {
    if (this.draggingNote) {
      this.canvas.style.cursor = (this.draggingNote.mode === 'duration' || this.draggingNote.mode === 'time')
        ? 'ns-resize'
        : 'ew-resize';
      return;
    }
    if (this.editMode && y < this.H - KEY_H && noteMode) {
      this.canvas.style.cursor = (noteMode === 'duration' || noteMode === 'time')
        ? 'ns-resize'
        : 'ew-resize';
      return;
    }
    this.canvas.style.cursor = y >= this.H - KEY_H ? 'pointer' : 'default';
  }

  _getRollPixelsPerSecond() {
    const rollHeight = Math.max(60, this.H - KEY_H);
    return (rollHeight / 3.5) * this.zoomY;
  }

  _resolveNoteDragMode(box, y) {
    if (!box) return null;
    const topHandle = Math.min(10, Math.max(4, box.h * 0.35));
    if (y <= box.y + topHandle) return 'duration';
    return 'pitch';
  }

  _hitNote(x, y) {
    for (let i = this.noteHitboxes.length - 1; i >= 0; i -= 1) {
      const box = this.noteHitboxes[i];
      if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
        return { ...box, mode: this._resolveNoteDragMode(box, y) };
      }
    }
    return null;
  }

  _startNoteDrag(hit, localY) {
    if (!hit || !hit.noteRef) return false;
    const targetIndices = this._isSelected(hit.index)
      ? this._getEditableIndicesForOperations(hit.index)
      : [hit.index];
    if (!this._isSelected(hit.index)) this._setSingleSelection(hit.index);
    const snapshots = targetIndices.map(index => {
      const note = this.notes[index];
      return {
        index,
        noteRef: note,
        startDuration: Math.max(0.03, Number(note?.duration) || 0.12),
        startStartTime: Math.max(0, Number(note?.startTime) || 0),
        startMidi: clampMidi(note?.note),
      };
    });

    this.draggingNote = {
      index: hit.index,
      noteRef: hit.noteRef,
      mode: hit.mode || 'pitch',
      startDuration: Math.max(0.03, Number(hit.noteRef.duration) || 0.12),
      startStartTime: Math.max(0, Number(hit.noteRef.startTime) || 0),
      startMidi: clampMidi(hit.noteRef.note),
      startClientY: localY,
      targets: snapshots,
      changed: false,
    };
    this.hoverNoteIndex = hit.index;
    this.hoverNoteMode = this.draggingNote.mode;
    this.canvas.style.cursor = (this.draggingNote.mode === 'duration' || this.draggingNote.mode === 'time')
      ? 'ns-resize'
      : 'ew-resize';
    return true;
  }

  _keyAtX(x) {
    const clamped = Math.max(0, Math.min(this.W - 1, x));
    for (const key of this.keys) {
      if (key.isBlack && clamped >= key.x && clamped <= key.x + key.w) {
        return key;
      }
    }
    for (const key of this.keys) {
      if (!key.isBlack && clamped >= key.x && clamped <= key.x + key.w) {
        return key;
      }
    }
    let closest = null;
    let closestDist = Number.POSITIVE_INFINITY;
    for (const key of this.keys) {
      const cx = key.x + key.w / 2;
      const d = Math.abs(cx - clamped);
      if (d < closestDist) {
        closestDist = d;
        closest = key;
      }
    }
    return closest;
  }

  _rollTimeAtY(y) {
    const rollHeight = this.H - KEY_H;
    const clampedY = Math.max(0, Math.min(rollHeight, y));
    const pps = this._getRollPixelsPerSecond();
    return Math.max(0, this.currentTime + (rollHeight - clampedY) / pps);
  }

  _emitNotesMutation(action = 'Edit notes') {
    this._markFingerSuggestionDirty();
    if (this.onNotesChange) this.onNotesChange(this.notes);
    if (this.onEditCommit) this.onEditCommit(this.notes, { action });
  }

  _markFingerSuggestionDirty() {
    this.fingerSuggestionDirty = true;
    this.nextFingerSuggestionScanAt = 0;
  }

  _buildFingerSuggestionSignature() {
    const notes = Array.isArray(this.notes) ? this.notes : [];
    if (!notes.length) return `0|${this.fingerSuggestionLevel}|${this.fingerSuggestionAlgorithm}`;
    let checksum = 0;
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      const midi = clampMidi(note.note);
      const startBucket = Math.round((Number(note.startTime) || 0) * 100);
      const durationBucket = Math.round((Number(note.duration) || 0.12) * 100);
      const fingerOverride = normalizeFingerOverride(note.fingerOverride);
      checksum = (checksum + ((midi * 31) + (startBucket * 17) + (durationBucket * 13) + (fingerOverride * 19) + (i * 7))) >>> 0;
    }
    return `${notes.length}|${this.fingerSuggestionLevel}|${this.fingerSuggestionAlgorithm}|${checksum.toString(16)}`;
  }

  _refreshFingerSuggestionCache(force = false) {
    if (!this.fingerSuggestionMode) {
      this.fingerSuggestionMap.clear();
      this.fingerSuggestionDiagnostics = null;
      if (this.onFingerSuggestionUpdate) {
        this.onFingerSuggestionUpdate(null);
      }
      this.fingerSuggestionSignature = '';
      this.fingerSuggestionDirty = false;
      return;
    }
    if (!force && !this.fingerSuggestionDirty) return;
    const suggestion = computeFingerSuggestions(this.notes, this.fingerSuggestionLevel, this.fingerSuggestionAlgorithm);
    this.fingerSuggestionMap = suggestion.map;
    this.fingerSuggestionDiagnostics = suggestion.diagnostics || null;
    if (this.onFingerSuggestionUpdate) {
      this.onFingerSuggestionUpdate(this.fingerSuggestionDiagnostics);
    }
    this.fingerSuggestionSignature = '';
    this.fingerSuggestionDirty = false;
  }

  _hitFingerBadge(x, y) {
    if (!this.fingerSuggestionMode) return null;
    for (let i = this.noteHitboxes.length - 1; i >= 0; i -= 1) {
      const box = this.noteHitboxes[i];
      if (!box || !box.fingerBadge) continue;
      const dx = x - box.fingerBadge.x;
      const dy = y - box.fingerBadge.y;
      if ((dx * dx) + (dy * dy) <= (box.fingerBadge.r * box.fingerBadge.r)) return box;
    }
    return null;
  }

  _setFingerOverrideForIndices(indices, nextFinger, action = 'Set manual fingering') {
    if (!Array.isArray(indices) || !indices.length) return false;
    const normalized = normalizeFingerOverride(nextFinger);
    let changed = false;
    indices.forEach(index => {
      const note = this.notes[index];
      if (!note) return;
      const prev = normalizeFingerOverride(note.fingerOverride);
      if (prev === normalized) return;
      if (normalized === 0) delete note.fingerOverride;
      else note.fingerOverride = normalized;
      changed = true;
    });
    if (!changed) return false;
    this._markFingerSuggestionDirty();
    if (this.onNotesChange) this.onNotesChange(this.notes);
    if (this.onEditCommit) this.onEditCommit(this.notes, { action });
    return true;
  }

  _addNoteAt(x, y) {
    const key = this._keyAtX(x);
    if (!key) return false;

    const note = {
      note: key.midi,
      startTime: this._rollTimeAtY(y),
      duration: 0.35,
      velocity: 96,
    };

    this.notes.push(note);
    this._setSingleSelection(this.notes.length - 1);
    this.hoverNoteIndex = this.selectedNoteIndex;
    this.hoverNoteMode = 'pitch';
    this._playNote(note.note);
    this._emitNotesMutation('Add note');
    return true;
  }

  _deleteNoteAtIndex(index) {
    return this._deleteNotesByIndices([index]);
  }

  _deleteHoveredOrSelectedNote() {
    const idx = this._getActiveNoteIndex();
    const indices = this._getEditableIndicesForOperations(idx);
    return this._deleteNotesByIndices(indices);
  }

  _getActiveNoteIndex() {
    if (this.hoverNoteIndex >= 0) return this.hoverNoteIndex;
    if (this.selectedNoteIndex >= 0 && this.selectedNoteIndex < this.notes.length) return this.selectedNoteIndex;
    const selected = this._getSelectedIndicesOrdered();
    if (selected.length) return selected[selected.length - 1];
    return -1;
  }

  _duplicateSelectedNote() {
    const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
    if (!indices.length) return false;

    const notesToCopy = indices.map(index => ({ index, note: this.notes[index] })).filter(item => item.note);
    if (!notesToCopy.length) return false;

    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = 0;
    notesToCopy.forEach(item => {
      const noteStart = Math.max(0, Number(item.note.startTime) || 0);
      const duration = Math.max(0.03, Number(item.note.duration) || 0.12);
      minStart = Math.min(minStart, noteStart);
      maxEnd = Math.max(maxEnd, noteStart + duration);
    });
    const shiftSec = Math.max(0.05, maxEnd - minStart);

    const newIndices = [];
    notesToCopy.forEach(item => {
      const source = item.note;
      const duplicate = {
        note: Math.max(MIDI_LO, Math.min(MIDI_HI, Math.round(Number(source.note) || MIDI_LO))),
        startTime: Math.max(0, (Number(source.startTime) || 0) + shiftSec),
        duration: Math.max(0.03, Number(source.duration) || 0.12),
        velocity: Math.max(1, Math.min(127, Math.round(Number(source.velocity) || 96))),
      };
      this.notes.push(duplicate);
      newIndices.push(this.notes.length - 1);
    });

    this.selectedNoteIndices.clear();
    newIndices.forEach(index => this.selectedNoteIndices.add(index));
    this.selectedNoteIndex = newIndices.length ? newIndices[newIndices.length - 1] : -1;
    this.hoverNoteIndex = this.selectedNoteIndex;
    this.hoverNoteMode = 'pitch';
    this._emitNotesMutation('Duplicate notes');
    return true;
  }

  _updateNoteDrag(localX, localY) {
    if (!this.draggingNote || !this.draggingNote.noteRef) return;
    const targets = Array.isArray(this.draggingNote.targets) && this.draggingNote.targets.length
      ? this.draggingNote.targets
      : [{
        index: this.draggingNote.index,
        noteRef: this.draggingNote.noteRef,
        startDuration: this.draggingNote.startDuration,
        startStartTime: this.draggingNote.startStartTime,
        startMidi: this.draggingNote.startMidi,
      }];

    if (this.draggingNote.mode === 'time') {
      const pps = this._getRollPixelsPerSecond();
      const deltaSec = (this.draggingNote.startClientY - localY) / pps;
      let changed = false;
      targets.forEach(target => {
        if (!target.noteRef) return;
        const nextStartTime = Math.max(0, target.startStartTime + deltaSec);
        if (Math.abs(nextStartTime - (Number(target.noteRef.startTime) || 0)) > 0.0001) {
          target.noteRef.startTime = nextStartTime;
          changed = true;
        }
      });
      if (changed) {
        this.draggingNote.changed = true;
        this._markFingerSuggestionDirty();
        if (this.onNotesChange) this.onNotesChange(this.notes);
      }
      return;
    }

    if (this.draggingNote.mode === 'duration') {
      const pps = this._getRollPixelsPerSecond();
      const deltaSec = (this.draggingNote.startClientY - localY) / pps;
      let changed = false;
      targets.forEach(target => {
        if (!target.noteRef) return;
        const nextDuration = Math.max(0.03, target.startDuration + deltaSec);
        if (Math.abs(nextDuration - (Number(target.noteRef.duration) || 0)) > 0.0001) {
          target.noteRef.duration = nextDuration;
          changed = true;
        }
      });
      if (changed) {
        this.draggingNote.changed = true;
        this._markFingerSuggestionDirty();
        if (this.onNotesChange) this.onNotesChange(this.notes);
      }
      return;
    }

    const key = this._keyAtX(localX);
    if (!key) return;
    const deltaMidi = key.midi - this.draggingNote.startMidi;
    let changed = false;
    targets.forEach(target => {
      if (!target.noteRef) return;
      const nextMidi = clampMidi(target.startMidi + deltaMidi);
      if (nextMidi !== target.noteRef.note) {
        target.noteRef.note = nextMidi;
        changed = true;
      }
    });
    if (changed) {
      this.draggingNote.changed = true;
      this._markFingerSuggestionDirty();
      if (this.onNotesChange) this.onNotesChange(this.notes);
    }
  }

  _finishNoteDrag(shouldCommit = true) {
    if (!this.draggingNote) return;
    if (!this._isSelected(this.draggingNote.index)) {
      this._setSingleSelection(this.draggingNote.index);
    } else {
      this.selectedNoteIndex = this.draggingNote.index;
    }
    const dragMode = this.draggingNote.mode;
    const changed = Boolean(this.draggingNote.changed);
    this.draggingNote = null;
    this.hoverNoteMode = null;
    if (shouldCommit && changed && this.onEditCommit) {
      const action = dragMode === 'duration'
        ? 'Change note duration'
        : dragMode === 'time'
          ? 'Move note timing'
          : 'Change note pitch';
      this.onEditCommit(this.notes, { action });
    }
  }

  _buildKeys(W) {
    const keys = [], wkw = W / 52, bkw = wkw * 0.62;
    let wki = 0;
    for (let m = MIDI_LO; m <= MIDI_HI; m++) {
      if (!BLACK_S.has(m % 12)) { keys.push({ midi: m, x: wki * wkw, w: wkw, isBlack: false }); wki++; }
      else keys.push({ midi: m, x: (wki - 1) * wkw + wkw - bkw / 2, w: bkw, isBlack: true });
    }
    return keys;
  }

  _hitTest(x, y) {
    const ROLL_H = this.H - KEY_H, bkh = KEY_H * BK_RATIO;
    if (y < ROLL_H) return null;
    if (y - ROLL_H <= bkh) for (const k of this.keys) if (k.isBlack && x >= k.x && x <= k.x + k.w) return k;
    for (const k of this.keys) if (!k.isBlack && x >= k.x && x <= k.x + k.w) return k;
    return null;
  }

  _bindEvents() {
    const c = this.canvas;
    const xy = e => this._localPointFromEvent(e);
    const press = m => { if (!this.pressedKeys.has(m)) { this.pressedKeys.add(m); this._playNote(m); } };
    const release = m => { this.pressedKeys.delete(m); };
    const releaseAll = () => { this.pressedKeys.clear(); };

    this._h = {
      md: e => {
        const { x, y } = xy(e);
        if (this.editMode && y < this.H - KEY_H) {
          if (this.fingerSuggestionMode && e.button === 0) {
            const fingerHit = this._hitFingerBadge(x, y);
            if (fingerHit) {
              if (!this._isSelected(fingerHit.index)) this._setSingleSelection(fingerHit.index);
              const current = normalizeFingerOverride(fingerHit.noteRef?.fingerOverride) || 0;
              const next = e.shiftKey
                ? (current <= 1 ? 5 : current - 1)
                : (current >= 5 ? 1 : current + 1);
              this._setFingerOverrideForIndices([fingerHit.index], next, 'Set manual fingering');
              this.hoverNoteIndex = fingerHit.index;
              this.hoverNoteMode = 'pitch';
              this._setCursor(y, 'pitch');
              return;
            }
          }
          const hit = this._hitNote(x, y);
          if (hit) {
            if (e.metaKey || e.ctrlKey) {
              this._toggleSelection(hit.index);
              this.hoverNoteIndex = hit.index;
              this.hoverNoteMode = hit.mode;
              this._setCursor(y, hit.mode);
              return;
            }
            if (!this._isSelected(hit.index)) this._setSingleSelection(hit.index);
            if (e.shiftKey) hit.mode = 'time';
            this._startNoteDrag(hit, y);
            return;
          }
          if (e.button === 0) {
            this._startLasso(x, y, e.metaKey || e.ctrlKey);
            return;
          }
          if (!(e.metaKey || e.ctrlKey)) this._clearSelection();
          return;
        }
        const k = this._hitTest(x, y);
        if (k) press(k.midi);
      },
      mm: e => {
        const { x, y } = xy(e);
        if (this.draggingNote) {
          this._updateNoteDrag(x, y);
          this._setCursor(y, this.draggingNote.mode);
          return;
        }
        if (this.isLassoSelecting) {
          this._updateLasso(x, y);
          this.canvas.style.cursor = 'crosshair';
          return;
        }

        const noteHit = this.editMode && y < this.H - KEY_H
          ? this._hitNote(x, y)
          : null;
        this.hoverNoteIndex = noteHit ? noteHit.index : -1;
        this.hoverNoteMode = noteHit ? noteHit.mode : null;
        this._setCursor(y, noteHit ? noteHit.mode : null);

        if (e.buttons !== 1) return;
        const k = this._hitTest(x, y);
        if (k && !this.pressedKeys.has(k.midi)) { releaseAll(); press(k.midi); }
      },
      mu: () => { this._finishNoteDrag(); this._finishLasso(); releaseAll(); },
      ml: () => {
        if (this.draggingNote || this.isLassoSelecting) return;
        releaseAll();
        this.hoverNoteIndex = -1;
        this.hoverNoteMode = null;
        this.canvas.style.cursor = 'default';
      },
      wm: e => {
        if (!this.draggingNote) return;
        const { x, y } = xy(e);
        this._updateNoteDrag(x, y);
      },
      wu: () => { this._finishNoteDrag(); this._finishLasso(); releaseAll(); },
      wb: () => { this._finishNoteDrag(); this._finishLasso(); releaseAll(); this.canvas.style.cursor = 'default'; },
      db: e => {
        if (!this.editMode) return;
        const { x, y } = xy(e);
        if (y >= this.H - KEY_H) return;
        if (this._hitNote(x, y)) return;
        e.preventDefault();
        this._addNoteAt(x, y);
      },
      cm: e => {
        if (!this.editMode) return;
        const { x, y } = xy(e);
        if (y >= this.H - KEY_H) return;
        if (this.fingerSuggestionMode) {
          const fingerHit = this._hitFingerBadge(x, y);
          if (fingerHit) {
            e.preventDefault();
            if (!this._isSelected(fingerHit.index)) this._setSingleSelection(fingerHit.index);
            this._setFingerOverrideForIndices([fingerHit.index], 0, 'Clear manual fingering');
            return;
          }
        }
        const hit = this._hitNote(x, y);
        if (!hit) return;
        e.preventDefault();
        if (!this._isSelected(hit.index)) this._setSingleSelection(hit.index);
        this._deleteHoveredOrSelectedNote();
      },
      wk: e => {
        if (!this.editMode) return;
        const active = document.activeElement;
        if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;

        if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
          if (e.shiftKey) {
            if (this.onRedoRequest) this.onRedoRequest();
          } else if (this.onUndoRequest) {
            this.onUndoRequest();
          }
          e.preventDefault();
          return;
        }
        if ((e.ctrlKey && (e.key === 'y' || e.key === 'Y')) || ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
          if (this.onRedoRequest) this.onRedoRequest();
          e.preventDefault();
          return;
        }

        if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
          this.selectedNoteIndices.clear();
          for (let i = 0; i < this.notes.length; i += 1) this.selectedNoteIndices.add(i);
          this.selectedNoteIndex = this.notes.length ? this.notes.length - 1 : -1;
          this.hoverNoteIndex = this.selectedNoteIndex;
          e.preventDefault();
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (this._deleteHoveredOrSelectedNote()) {
            e.preventDefault();
          }
          return;
        }

        if (e.key === 'Escape') {
          this._clearSelection();
          this.hoverNoteIndex = -1;
          this.hoverNoteMode = null;
          e.preventDefault();
          return;
        }

        if ((e.metaKey || e.ctrlKey) && (e.key === 'd' || e.key === 'D')) {
          if (this._duplicateSelectedNote()) {
            e.preventDefault();
          }
          return;
        }

        const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
        if (!indices.length) return;
        let changed = false;

        if (this.fingerSuggestionMode && /^[0-5]$/.test(e.key)) {
          const finger = e.key === '0' ? 0 : Number(e.key);
          if (this._setFingerOverrideForIndices(
            indices,
            finger,
            finger === 0 ? 'Clear manual fingering' : 'Set manual fingering'
          )) {
            e.preventDefault();
          }
          return;
        }

        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const step = e.shiftKey ? 12 : 1;
          const delta = e.key === 'ArrowRight' ? step : -step;
          indices.forEach(index => {
            const note = this.notes[index];
            if (!note) return;
            const next = clampMidi((Number(note.note) || MIDI_LO) + delta);
            if (next !== note.note) {
              note.note = next;
              changed = true;
            }
          });
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const step = e.shiftKey ? 0.25 : 0.1;
          const delta = e.key === 'ArrowUp' ? step : -step;
          indices.forEach(index => {
            const note = this.notes[index];
            if (!note) return;
            const next = Math.max(0, (Number(note.startTime) || 0) + delta);
            if (Math.abs(next - (Number(note.startTime) || 0)) > 0.0001) {
              note.startTime = next;
              changed = true;
            }
          });
        }

        if (changed) {
          this.selectedNoteIndex = indices[indices.length - 1];
          this.hoverNoteIndex = this.selectedNoteIndex;
          this.hoverNoteMode = 'pitch';
          this._emitNotesMutation(e.key === 'ArrowRight' || e.key === 'ArrowLeft' ? 'Change note pitch' : 'Move note timing');
          e.preventDefault();
        }
      },
      ts: e => {
        e.preventDefault();
        releaseAll();
        Array.from(e.touches).forEach(t => {
          const p = this._localPointFromEvent(t);
          const k = this._hitTest(p.x, p.y);
          if (k) press(k.midi);
        });
      },
      tm: e => {
        e.preventDefault();
        releaseAll();
        Array.from(e.touches).forEach(t => {
          const p = this._localPointFromEvent(t);
          const k = this._hitTest(p.x, p.y);
          if (k) press(k.midi);
        });
      },
      te: e => {
        e.preventDefault();
        const still = new Set();
        Array.from(e.touches).forEach(t => {
          const p = this._localPointFromEvent(t);
          const k = this._hitTest(p.x, p.y);
          if (k) still.add(k.midi);
        });
        this.pressedKeys.forEach(m => { if (!still.has(m)) release(m); });
      },
      hs: () => {
        if (!this.scrollHost) return;
        const maxScroll = Math.max(0, this.scrollHost.scrollWidth - this.scrollHost.clientWidth);
        this.scrollRatio = maxScroll > 0 ? (this.scrollHost.scrollLeft / maxScroll) : 0;
      },
    };
    c.addEventListener('mousedown', this._h.md);
    c.addEventListener('mousemove', this._h.mm);
    c.addEventListener('mouseup', this._h.mu);
    c.addEventListener('mouseleave', this._h.ml);
    c.addEventListener('dblclick', this._h.db);
    c.addEventListener('contextmenu', this._h.cm);
    c.addEventListener('touchstart', this._h.ts, { passive: false });
    c.addEventListener('touchmove', this._h.tm, { passive: false });
    c.addEventListener('touchend', this._h.te, { passive: false });
    this.scrollHost.addEventListener('scroll', this._h.hs, { passive: true });
    window.addEventListener('mousemove', this._h.wm);
    window.addEventListener('mouseup', this._h.wu);
    window.addEventListener('blur', this._h.wb);
    window.addEventListener('keydown', this._h.wk);
  }

  _setup() {
    cancelAnimationFrame(this.animId);
    this.lastTs = null;
    const dpr = window.devicePixelRatio || 1;
    const viewportW = this.container.clientWidth || 800;
    const H = this.container.clientHeight || 330;
    const W = Math.max(viewportW, Math.round(viewportW * this.zoomX));
    this.viewportW = viewportW;
    this.W = W;
    this.H = H;

    this.scrollHost.classList.toggle('scroll-x', this.zoomX > 1.02);
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width = `${W}px`;
    this.canvas.style.height = `${H}px`;

    const nextMaxScroll = Math.max(0, W - viewportW);
    if (nextMaxScroll > 0) {
      this.scrollHost.scrollLeft = Math.round(nextMaxScroll * this.scrollRatio);
    } else {
      this.scrollHost.scrollLeft = 0;
      this.scrollRatio = 0;
    }

    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.keys = this._buildKeys(W);
    const loop = ts => {
      if (this.lastTs !== null) {
        const d = (ts - this.lastTs) / 1000;
        if (this.isPlaying || (this.notes && this.notes.length)) {
          this.internalTime = this.currentTime;
        } else {
          this.internalTime = (this.internalTime + d * 0.22) % 48;
        }
      }
      this.lastTs = ts;
      this._draw(ctx, W, H, this.internalTime);
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  _noteColor(midi) {
    const t = (midi - MIDI_LO) / (MIDI_HI - MIDI_LO);
    const lr = ([r1,g1,b1],[r2,g2,b2],t) => [r1+(r2-r1)*t,g1+(g2-g1)*t,b1+(b2-b1)*t].map(Math.round);
    const B=[59,130,246],P=[139,92,246],K=[236,72,153];
    const [r,g,b] = t<0.5 ? lr(B,P,t*2) : lr(P,K,(t-0.5)*2);
    return `rgb(${r},${g},${b})`;
  }

  _rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w/2, h/2);
    ctx.beginPath(); ctx.moveTo(x+rad,y);
    ctx.arcTo(x+w,y,x+w,y+h,rad); ctx.arcTo(x+w,y+h,x,y+h,rad);
    ctx.arcTo(x,y+h,x,y,rad); ctx.arcTo(x,y,x+w,y,rad); ctx.closePath();
  }

  _draw(ctx, W, H, time) {
    const ROLL_H = H - KEY_H;
    const PPS = this._getRollPixelsPerSecond();
    const km = new Map(this.keys.map(k => [k.midi, k]));
    const active = new Set();
    this._refreshFingerSuggestionCache();
    this.notes.forEach(n => { if (time >= n.startTime && time < n.startTime + n.duration) active.add(n.note); });
    this.pressedKeys.forEach(m => active.add(m));

    ctx.fillStyle = '#08080f'; ctx.fillRect(0, 0, W, H);
    this.keys.forEach(k => { if (k.isBlack) { ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(k.x,0,k.w,ROLL_H); } });
    for (let m=MIDI_LO;m<=MIDI_HI;m++) { if (m%12===0) { const k=km.get(m); if(k){ctx.fillStyle='rgba(139,92,246,0.06)';ctx.fillRect(k.x,0,k.w,ROLL_H);} } }
    for (let t=0;t<=3.5;t+=0.5) { const y=ROLL_H-t*PPS,isBar=Math.round(t/2)*2===t; ctx.strokeStyle=isBar?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.025)'; ctx.lineWidth=isBar?1:0.5; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=0.5;
    this.keys.filter(k=>!k.isBlack).forEach(k=>{ctx.beginPath();ctx.moveTo(k.x,0);ctx.lineTo(k.x,ROLL_H);ctx.stroke();});

    this.noteHitboxes = [];
    this.notes.forEach((n, index) => {
      const k=km.get(n.note); if(!k) return;
      const nb=ROLL_H-(n.startTime-time)*PPS, nt=nb-n.duration*PPS;
      if(nb<0||nt>ROLL_H) return;
      const color=this._noteColor(n.note), x=k.x+1, w=k.w-2, y=Math.max(0,nt), h=Math.min(nb,ROLL_H)-y;
      if(h<=0) return;

      const hitBox = { index, x, y, w, h, noteRef: n };
      this.noteHitboxes.push(hitBox);
      const selectedByDrag = this.draggingNote && this.draggingNote.index === index;
      const selected = selectedByDrag || this._isSelected(index);
      const hovered = !selectedByDrag && this.hoverNoteIndex === index;
      const hoverMode = hovered ? this.hoverNoteMode : null;
      const selectedMode = selectedByDrag && this.draggingNote ? this.draggingNote.mode : null;
      const fingerData = this.fingerSuggestionMode ? this.fingerSuggestionMap.get(index) : null;

      ctx.shadowColor=color; ctx.shadowBlur=10; ctx.fillStyle=color; ctx.globalAlpha=0.7+(n.velocity/127)*0.3;
      this._rr(ctx,x,y,w,h,2); ctx.fill(); ctx.globalAlpha=1; ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillRect(x,y,w,2);

      if (selected || hovered) {
        ctx.strokeStyle = selected ? 'rgba(196,181,253,0.95)' : 'rgba(196,181,253,0.7)';
        ctx.lineWidth = selected ? 1.6 : 1.2;
        this._rr(ctx, x, y, w, h, 2);
        ctx.stroke();
      }

      if (this.editMode && (selected || hovered)) {
        const durationMode = (selectedMode === 'duration') || (hoverMode === 'duration');
        ctx.fillStyle = durationMode ? 'rgba(196,181,253,0.95)' : 'rgba(196,181,253,0.55)';
        ctx.fillRect(x + 1, y + 1, Math.max(2, w - 2), 2);
      }

      if (fingerData && h >= 9 && w >= 7) {
        const bubbleX = x + (w * 0.5);
        const bubbleY = Math.min(y + 10, y + Math.max(8, h * 0.22));
        hitBox.fingerBadge = { x: bubbleX, y: bubbleY, r: selected || hovered ? 9.2 : 8.4 };
        _drawFingerBadge(
          ctx,
          bubbleX,
          bubbleY,
          fingerData.finger,
          fingerData.hand,
          selected || hovered,
          fingerData.confidence
        );
      }
    });
    ctx.shadowBlur=0; ctx.globalAlpha=1;

    if (this.isLassoSelecting && this.lasso) {
      const rect = this._normalizedRect(this.lasso.startX, this.lasso.startY, this.lasso.endX, this.lasso.endY);
      ctx.fillStyle = 'rgba(59,130,246,0.16)';
      ctx.strokeStyle = 'rgba(147,197,253,0.92)';
      ctx.lineWidth = 1;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, Math.max(0, rect.w - 1), Math.max(0, rect.h - 1));
    }

    const sg=ctx.createLinearGradient(0,ROLL_H,W,ROLL_H);
    sg.addColorStop(0,'rgba(59,130,246,0.15)');sg.addColorStop(0.3,'rgba(139,92,246,0.6)');sg.addColorStop(0.7,'rgba(139,92,246,0.6)');sg.addColorStop(1,'rgba(59,130,246,0.15)');
    ctx.strokeStyle=sg; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,ROLL_H); ctx.lineTo(W,ROLL_H); ctx.stroke();

    this.keys.filter(k=>!k.isBlack).forEach(k => {
      const act=active.has(k.midi), y=ROLL_H;

      // White key shadow/depth layer
      ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=4; ctx.shadowOffsetY=2;
      ctx.fillStyle='rgba(0,0,0,0.12)';
      this._rr(ctx,k.x+0.8,y+3,k.w-1.6,KEY_H-3,2.5); ctx.fill();

      if(act){
        // Active white key - glowing state
        ctx.shadowColor=this._noteColor(k.midi);ctx.shadowBlur=20;ctx.shadowOffsetY=0;
        const g=ctx.createLinearGradient(k.x,y,k.x,y+KEY_H);
        g.addColorStop(0,'#ddd6fe');g.addColorStop(0.12,'#c4b5fd');
        g.addColorStop(0.5,'#a78bfa');g.addColorStop(1,'#8b5cf6');
        ctx.fillStyle=g;
        this._rr(ctx,k.x+0.8,y+2,k.w-1.6,KEY_H-3,2.5); ctx.fill();

        // Highlight on active key
        ctx.shadowBlur=0;
        const hg=ctx.createLinearGradient(k.x,y,k.x,y+KEY_H*0.25);
        hg.addColorStop(0,'rgba(255,255,255,0.5)');hg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=hg;
        this._rr(ctx,k.x+1.2,y+3,k.w-2.4,KEY_H*0.22,2); ctx.fill();
      }
      else{
        // Inactive white key - realistic ivory
        ctx.shadowColor='rgba(0,0,0,0.15)';ctx.shadowBlur=2;ctx.shadowOffsetY=1;
        const g=ctx.createLinearGradient(k.x,y,k.x,y+KEY_H);
        g.addColorStop(0,'#fafafa');g.addColorStop(0.08,'#f5f5f7');
        g.addColorStop(0.85,'#e8e8ec');g.addColorStop(1,'#d4d4d9');
        ctx.fillStyle=g;
        this._rr(ctx,k.x+0.8,y+2,k.w-1.6,KEY_H-3,2.5); ctx.fill();

        // Subtle highlight at top
        ctx.shadowBlur=0;
        const hg=ctx.createLinearGradient(k.x,y,k.x,y+KEY_H*0.15);
        hg.addColorStop(0,'rgba(255,255,255,0.8)');hg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=hg;
        this._rr(ctx,k.x+1.2,y+3,k.w-2.4,KEY_H*0.12,2); ctx.fill();

        // Subtle shadow on sides for depth
        ctx.fillStyle='rgba(0,0,0,0.04)';
        ctx.fillRect(k.x+0.8,y+2,1.5,KEY_H-3);
        ctx.fillRect(k.x+k.w-2.3,y+2,1.5,KEY_H-3);
      }

      // Border
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.strokeStyle=act?'rgba(139,92,246,0.3)':'rgba(0,0,0,0.15)';
      ctx.lineWidth=act?1.2:0.8;
      this._rr(ctx,k.x+0.8,y+2,k.w-1.6,KEY_H-3,2.5); ctx.stroke();

      // Octave labels
      if(k.midi%12===0&&!act){
        const oct=Math.floor(k.midi/12)-1;
        ctx.fillStyle='rgba(100,100,110,0.5)';
        ctx.font='7.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign='center';ctx.fillText(`C${oct}`,k.x+k.w/2,y+KEY_H-7);
      }
      if (this.showComputerKeyHints) {
        const keyHint = COMPUTER_PIANO_PRIMARY_KEY_BY_MIDI[k.midi];
        if (keyHint) {
          ctx.fillStyle = act ? 'rgba(255,255,255,0.95)' : 'rgba(55,65,81,0.85)';
          ctx.font = `${act ? 700 : 600} 8px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(keyHint, k.x + (k.w / 2), y + KEY_H - 19);
        }
      }
    });

    this.keys.filter(k=>k.isBlack).forEach(k => {
      const act=active.has(k.midi), y=ROLL_H, bkh=KEY_H*BK_RATIO;

      // Black key shadow
      ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=6; ctx.shadowOffsetY=3;
      ctx.fillStyle='rgba(0,0,0,0.25)';
      this._rr(ctx,k.x+0.5,y+4,k.w-1,bkh-2,2); ctx.fill();

      if(act){
        // Active black key - glowing
        ctx.shadowColor=this._noteColor(k.midi);ctx.shadowBlur=16;ctx.shadowOffsetY=0;
        const g=ctx.createLinearGradient(k.x,y,k.x,y+bkh);
        g.addColorStop(0,'#8b5cf6');g.addColorStop(0.5,'#7c3aed');g.addColorStop(1,'#6d28d9');
        ctx.fillStyle=g;
        this._rr(ctx,k.x+0.5,y+2,k.w-1,bkh-2,2); ctx.fill();

        // Subtle highlight
        ctx.shadowBlur=0;
        const hg=ctx.createLinearGradient(k.x,y,k.x,y+bkh*0.3);
        hg.addColorStop(0,'rgba(255,255,255,0.3)');hg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=hg;
        this._rr(ctx,k.x+1,y+3,k.w-2,bkh*0.25,1.5); ctx.fill();
      }
      else{
        // Inactive black key - realistic ebony
        ctx.shadowColor='rgba(0,0,0,0.3)';ctx.shadowBlur=3;ctx.shadowOffsetY=2;
        const g=ctx.createLinearGradient(k.x,y,k.x,y+bkh);
        g.addColorStop(0,'#2a2a35');g.addColorStop(0.15,'#1e1e28');
        g.addColorStop(0.7,'#14141d');g.addColorStop(1,'#0c0c12');
        ctx.fillStyle=g;
        this._rr(ctx,k.x+0.5,y+2,k.w-1,bkh-2,2); ctx.fill();

        // Very subtle highlight for realism
        ctx.shadowBlur=0;
        const hg=ctx.createLinearGradient(k.x,y,k.x,y+bkh*0.25);
        hg.addColorStop(0,'rgba(255,255,255,0.12)');hg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=hg;
        this._rr(ctx,k.x+1,y+3,k.w-2,bkh*0.2,1.5); ctx.fill();

        // Bevel effect on sides
        ctx.fillStyle='rgba(255,255,255,0.03)';
        ctx.fillRect(k.x+0.8,y+3,0.8,bkh*0.6);
        ctx.fillStyle='rgba(0,0,0,0.15)';
        ctx.fillRect(k.x+k.w-1.6,y+3,0.8,bkh*0.6);
      }

      // Border
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.strokeStyle=act?'rgba(139,92,246,0.4)':'rgba(0,0,0,0.4)';
      ctx.lineWidth=act?1:0.6;
      this._rr(ctx,k.x+0.5,y+2,k.w-1,bkh-2,2); ctx.stroke();
      if (this.showComputerKeyHints) {
        const keyHint = COMPUTER_PIANO_PRIMARY_KEY_BY_MIDI[k.midi];
        if (keyHint) {
          ctx.fillStyle = act ? 'rgba(255,255,255,0.95)' : 'rgba(203,213,225,0.88)';
          ctx.font = `${act ? 700 : 600} 7px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(keyHint, k.x + (k.w / 2), y + bkh - 8);
        }
      }
    });

  }

  setTime(t) {
    const next = Number(t) || 0;
    if (Math.abs(next - this.currentTime) < 0.0001) return;
    this.currentTime = next;
  }
  setPlaying(p) {
    const next = Boolean(p);
    if (next === this.isPlaying) return;
    this.isPlaying = next;
  }
  setZoom(x, y) {
    const nextX = Math.max(0.6, Math.min(2.4, Number(x) || 1));
    const nextY = Math.max(0.6, Math.min(2.4, Number(y) || 1));
    const changed = Math.abs(nextX - this.zoomX) > 0.0001 || Math.abs(nextY - this.zoomY) > 0.0001;
    if (!changed) return;

    if (this.scrollHost) {
      const oldMaxScroll = Math.max(0, this.scrollHost.scrollWidth - this.scrollHost.clientWidth);
      this.scrollRatio = oldMaxScroll > 0 ? (this.scrollHost.scrollLeft / oldMaxScroll) : 0;
    }

    this.zoomX = nextX;
    this.zoomY = nextY;
    if (this.container && this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      this._setup();
    }
  }
  setFingerSuggestions(enabled, level = this.fingerSuggestionLevel, algorithm = this.fingerSuggestionAlgorithm) {
    const nextMode = Boolean(enabled);
    const nextLevel = normalizeFingerSuggestionLevel(level);
    const nextAlgorithm = normalizeFingerSuggestionAlgorithm(algorithm);
    const changed = nextMode !== this.fingerSuggestionMode || nextLevel !== this.fingerSuggestionLevel || nextAlgorithm !== this.fingerSuggestionAlgorithm;
    if (!changed) return;
    this.fingerSuggestionMode = nextMode;
    this.fingerSuggestionLevel = nextLevel;
    this.fingerSuggestionAlgorithm = nextAlgorithm;
    this._markFingerSuggestionDirty();
    if (!this.fingerSuggestionMode) {
      this.fingerSuggestionMap.clear();
      this.fingerSuggestionDiagnostics = null;
      if (this.onFingerSuggestionUpdate) this.onFingerSuggestionUpdate(null);
      this.fingerSuggestionSignature = '';
      this.fingerSuggestionDirty = false;
    }
  }
  setComputerKeyHintsVisibility(enabled) {
    this.showComputerKeyHints = Boolean(enabled);
  }

  applyFingerOverrideToSelection(finger) {
    const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
    if (!indices.length) return false;
    return this._setFingerOverrideForIndices(
      indices,
      finger,
      finger === 0 ? 'Clear manual fingering' : 'Set manual fingering'
    );
  }
  setEditMode(enabled) {
    const next = Boolean(enabled);
    if (next === this.editMode) return;
    this.editMode = next;
    this.hoverNoteIndex = -1;
    this.hoverNoteMode = null;
    if (!this.editMode) this._finishNoteDrag(false);
    this._finishLasso();
    this._clearSelection();
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    this._ro.disconnect();
    const c = this.canvas;
    c.removeEventListener('mousedown', this._h.md);
    c.removeEventListener('mousemove', this._h.mm);
    c.removeEventListener('mouseup', this._h.mu);
    c.removeEventListener('mouseleave', this._h.ml);
    c.removeEventListener('dblclick', this._h.db);
    c.removeEventListener('contextmenu', this._h.cm);
    c.removeEventListener('touchstart', this._h.ts);
    c.removeEventListener('touchmove', this._h.tm);
    c.removeEventListener('touchend', this._h.te);
    this.scrollHost.removeEventListener('scroll', this._h.hs);
    window.removeEventListener('mousemove', this._h.wm);
    window.removeEventListener('mouseup', this._h.wu);
    window.removeEventListener('blur', this._h.wb);
    window.removeEventListener('keydown', this._h.wk);
    this._finishNoteDrag(false);
    this._finishLasso();
    this.pressedKeys.clear();
    this.scrollHost.remove();
  }
}

class ScoreEditor {
  constructor(container, notes, options = {}) {
    this.container = container;
    this.notes = notes;
    this.editMode = Boolean(options.editMode);
    this.onNotesChange = typeof options.onNotesChange === 'function' ? options.onNotesChange : null;
    this.onEditCommit = typeof options.onEditCommit === 'function' ? options.onEditCommit : null;
    this.onUndoRequest = typeof options.onUndoRequest === 'function' ? options.onUndoRequest : null;
    this.onRedoRequest = typeof options.onRedoRequest === 'function' ? options.onRedoRequest : null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.hoverNoteIndex = -1;
    this.selectedNoteIndex = -1;
    this.selectedNoteIndices = new Set();
    this.draggingNote = null;
    this.lasso = null;
    this.isLassoSelecting = false;
    this.noteHitboxes = [];
    this.layout = null;
    this.zoomX = Math.max(0.6, Math.min(2.4, Number(options.zoomX) || 1));
    this.zoomY = Math.max(0.6, Math.min(2.4, Number(options.zoomY) || 1));
    this.readableMode = Boolean(options.readableMode);
    this.fingerSuggestionMode = Boolean(options.fingerSuggestionMode);
    this.fingerSuggestionLevel = normalizeFingerSuggestionLevel(options.fingerSuggestionLevel);
    this.fingerSuggestionAlgorithm = normalizeFingerSuggestionAlgorithm(options.fingerSuggestionAlgorithm);
    this.fingerSuggestionMap = new Map();
    this.fingerSuggestionDirty = true;
    this.fingerSuggestionSignature = '';
    this.nextFingerSuggestionScanAt = 0;
    this.animId = 0;
    this.viewportW = 0;
    this.scrollRatio = 0;

    this.container.style.overflow = 'hidden';
    this.scrollHost = document.createElement('div');
    this.scrollHost.className = 'w-roll-scroll w-score-scroll';
    this.container.appendChild(this.scrollHost);

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;';
    this.scrollHost.appendChild(this.canvas);

    this._ro = new ResizeObserver(() => this._setup());
    this._ro.observe(container);
    this._setup();
    this._bindEvents();
  }

  _localPointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.W / Math.max(1, rect.width));
    const y = (e.clientY - rect.top) * (this.H / Math.max(1, rect.height));
    return { x, y };
  }

  _isSelected(index) {
    return this.selectedNoteIndices.has(index);
  }

  _setSingleSelection(index) {
    this.selectedNoteIndices.clear();
    if (Number.isInteger(index) && index >= 0 && index < this.notes.length) {
      this.selectedNoteIndices.add(index);
      this.selectedNoteIndex = index;
    } else {
      this.selectedNoteIndex = -1;
    }
  }

  _toggleSelection(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.notes.length) return;
    if (this.selectedNoteIndices.has(index)) {
      this.selectedNoteIndices.delete(index);
      this.selectedNoteIndex = this.selectedNoteIndices.size
        ? Array.from(this.selectedNoteIndices).sort((a, b) => a - b)[this.selectedNoteIndices.size - 1]
        : -1;
      return;
    }
    this.selectedNoteIndices.add(index);
    this.selectedNoteIndex = index;
  }

  _clearSelection() {
    this.selectedNoteIndices.clear();
    this.selectedNoteIndex = -1;
  }

  _rectsIntersect(a, b) {
    return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
  }

  _normalizedRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    return { x, y, w, h };
  }

  _hitboxRect(box) {
    return {
      x: box.noteX,
      y: box.noteY,
      w: box.noteW,
      h: box.noteH,
    };
  }

  _startLasso(x, y, additive = false) {
    this.isLassoSelecting = true;
    this.lasso = {
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      additive: Boolean(additive),
    };
    if (!additive) this._clearSelection();
    this.canvas.style.cursor = 'crosshair';
  }

  _updateLasso(x, y) {
    if (!this.isLassoSelecting || !this.lasso) return;
    this.lasso.endX = x;
    this.lasso.endY = y;
    const rect = this._normalizedRect(this.lasso.startX, this.lasso.startY, this.lasso.endX, this.lasso.endY);
    if (rect.w < 2 && rect.h < 2) return;

    const selected = this.lasso.additive ? new Set(this.selectedNoteIndices) : new Set();
    this.noteHitboxes.forEach(box => {
      if (this._rectsIntersect(rect, this._hitboxRect(box))) selected.add(box.index);
    });
    this.selectedNoteIndices = selected;
    this.selectedNoteIndex = selected.size ? Array.from(selected).sort((a, b) => a - b)[selected.size - 1] : -1;
    this.hoverNoteIndex = -1;
  }

  _finishLasso() {
    if (!this.isLassoSelecting) return;
    this.isLassoSelecting = false;
    if (this.lasso) {
      const rect = this._normalizedRect(this.lasso.startX, this.lasso.startY, this.lasso.endX, this.lasso.endY);
      if (rect.w >= 2 || rect.h >= 2) {
        const selected = this.lasso.additive ? new Set(this.selectedNoteIndices) : new Set();
        this.noteHitboxes.forEach(box => {
          if (this._rectsIntersect(rect, this._hitboxRect(box))) selected.add(box.index);
        });
        this.selectedNoteIndices = selected;
        this.selectedNoteIndex = selected.size ? Array.from(selected).sort((a, b) => a - b)[selected.size - 1] : -1;
      }
    }
    this.lasso = null;
    this._setCursor(null);
  }

  _getSelectedIndicesOrdered() {
    return Array.from(this.selectedNoteIndices).filter(index => index >= 0 && index < this.notes.length).sort((a, b) => a - b);
  }

  _getEditableIndicesForOperations(activeIndex = -1) {
    const selected = this._getSelectedIndicesOrdered();
    if (selected.length) return selected;
    if (Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < this.notes.length) return [activeIndex];
    return [];
  }

  _deleteNotesByIndices(indices) {
    if (!Array.isArray(indices) || !indices.length) return false;
    const unique = Array.from(new Set(indices))
      .filter(index => Number.isInteger(index) && index >= 0 && index < this.notes.length)
      .sort((a, b) => b - a);
    if (!unique.length) return false;

    unique.forEach(index => {
      this.notes.splice(index, 1);
    });

    this.draggingNote = null;
    this.hoverNoteIndex = -1;
    this._clearSelection();
    this._emitNotesChange();
    this._emitNotesCommit('Delete notes');
    return true;
  }

  getSelectionTimeRange() {
    const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
    if (!indices.length) return null;
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = 0;
    indices.forEach(index => {
      const note = this.notes[index];
      if (!note) return;
      const start = Math.max(0, Number(note.startTime) || 0);
      const duration = Math.max(0.03, Number(note.duration) || 0.12);
      minStart = Math.min(minStart, start);
      maxEnd = Math.max(maxEnd, start + duration);
    });
    if (!Number.isFinite(minStart) || maxEnd <= minStart) return null;
    return { start: minStart, end: maxEnd };
  }

  _noteColor(midi) {
    const t = (midi - MIDI_LO) / (MIDI_HI - MIDI_LO);
    const lerp = (a, b, v) => a + (b - a) * v;
    const blend = (a, b, v) => [Math.round(lerp(a[0], b[0], v)), Math.round(lerp(a[1], b[1], v)), Math.round(lerp(a[2], b[2], v))];
    const low = [59, 130, 246];
    const mid = [139, 92, 246];
    const hi = [236, 72, 153];
    const rgb = t < 0.5 ? blend(low, mid, t * 2) : blend(mid, hi, (t - 0.5) * 2);
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }

  _getTotalDuration() {
    const notesEnd = this.notes.length
      ? Math.max(...this.notes.map(note => (Number(note.startTime) || 0) + Math.max(0.03, Number(note.duration) || 0.12)))
      : 0;
    return Math.max(4, notesEnd + 0.5);
  }

  _getClosestNoteSeparationSec() {
    if (!Array.isArray(this.notes) || this.notes.length < 2) return 0.12;

    const starts = this.notes
      .map(note => Math.max(0, Number(note.startTime) || 0))
      .sort((a, b) => a - b);

    let minDelta = Number.POSITIVE_INFINITY;
    for (let i = 1; i < starts.length; i += 1) {
      const delta = starts[i] - starts[i - 1];
      if (delta > 0.0005 && delta < minDelta) minDelta = delta;
    }

    if (!Number.isFinite(minDelta)) {
      let shortestDuration = Number.POSITIVE_INFINITY;
      for (const note of this.notes) {
        const duration = Math.max(0.03, Number(note.duration) || 0.12);
        if (duration < shortestDuration) shortestDuration = duration;
      }
      minDelta = Number.isFinite(shortestDuration) ? (shortestDuration * 0.5) : 0.12;
    }

    return Math.min(1.2, Math.max(0.08, minDelta));
  }

  _buildLayout(W, H) {
    const viewportW = Math.max(240, this.viewportW || W);
    const left = 94;
    const right = 22;
    const usableW = Math.max(120, viewportW - left - right);
    const totalDuration = this._getTotalDuration();
    const targetVisibleSeconds = 18;
    const visibleDuration = Math.min(totalDuration, targetVisibleSeconds);
    const viewportPxPerSec = usableW / Math.max(0.5, visibleDuration);
    const closestSeparationSec = this._getClosestNoteSeparationSec();
    const targetGapPx = Math.max(12, Math.min(20, viewportW * 0.018));
    const adaptivePxPerSec = targetGapPx / closestSeparationSec;
    const baseSpacingPxPerSec = Math.min(viewportPxPerSec * 2.2, Math.max(viewportPxPerSec, adaptivePxPerSec));
    const maxContentW = Math.max(viewportW, Math.min(16000, viewportW * 28));
    const maxPxPerSec = Math.max(usableW / totalDuration, (maxContentW - left - right) / totalDuration);
    const pxPerSec = Math.min(baseSpacingPxPerSec * this.zoomX, maxPxPerSec);
    const scoreEndX = left + (totalDuration * pxPerSec);
    const contentW = Math.max(viewportW, Math.ceil(scoreEndX + right));

    const baseLineGap = Math.max(10, Math.min(16, Math.round((H - 70) / 12)));
    const lineGap = Math.max(8, Math.min(24, baseLineGap * this.zoomY));
    const staffSpan = lineGap * 10;
    const staffTop = Math.max(16, (H - staffSpan) / 2);
    const yE4 = staffTop + lineGap * 4;
    const stepPx = lineGap * 0.5;

    return {
      left,
      right,
      usableW,
      totalDuration,
      closestSeparationSec,
      pxPerSec,
      scoreEndX,
      contentW,
      lineGap,
      staffTop,
      yE4,
      stepPx,
      noteHeadW: Math.max(10, lineGap * 0.95),
      noteHeadH: Math.max(7, lineGap * 0.62),
      pitchStepPx: Math.max(3, lineGap * 0.36),
      topY: staffTop - lineGap * 1.5,
      bottomY: staffTop + lineGap * 11.5,
    };
  }

  _stepToY(step, layout) {
    return layout.yE4 - (step - STEP_E4) * layout.stepPx;
  }

  _timeToX(time, layout) {
    const resolvedTime = Math.max(0, Number(time) || 0);
    return layout.left + (resolvedTime * layout.pxPerSec);
  }

  _timeAtX(x, layout) {
    const maxX = Math.max(layout.left, Math.min(this.W - layout.right, layout.scoreEndX));
    const clamped = Math.max(layout.left, Math.min(maxX, x));
    const resolvedTime = Math.max(0, (clamped - layout.left) / layout.pxPerSec);
    return Math.min(layout.totalDuration, resolvedTime);
  }

  _midiAtY(y, layout) {
    let bestMidi = 60;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let midi = MIDI_LO; midi <= MIDI_HI; midi += 1) {
      const step = midiToDiatonicStep(midi);
      const ny = this._stepToY(step, layout);
      const bias = BLACK_S.has(midi % 12) ? 0.24 : 0;
      const dist = Math.abs(ny - y) + bias;
      if (dist < bestDist) {
        bestDist = dist;
        bestMidi = midi;
      }
    }
    return bestMidi;
  }

  _emitNotesChange() {
    this._markFingerSuggestionDirty();
    if (this.onNotesChange) this.onNotesChange(this.notes);
  }

  _emitNotesCommit(action = 'Edit notes') {
    if (this.onEditCommit) this.onEditCommit(this.notes, { action });
  }

  _markFingerSuggestionDirty() {
    this.fingerSuggestionDirty = true;
    this.nextFingerSuggestionScanAt = 0;
  }

  _buildFingerSuggestionSignature() {
    const notes = Array.isArray(this.notes) ? this.notes : [];
    if (!notes.length) return `0|${this.fingerSuggestionLevel}|${this.fingerSuggestionAlgorithm}`;
    let checksum = 0;
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      const midi = clampMidi(note.note);
      const startBucket = Math.round((Number(note.startTime) || 0) * 100);
      const durationBucket = Math.round((Number(note.duration) || 0.12) * 100);
      const fingerOverride = normalizeFingerOverride(note.fingerOverride);
      checksum = (checksum + ((midi * 31) + (startBucket * 17) + (durationBucket * 13) + (fingerOverride * 19) + (i * 7))) >>> 0;
    }
    return `${notes.length}|${this.fingerSuggestionLevel}|${this.fingerSuggestionAlgorithm}|${checksum.toString(16)}`;
  }

  _refreshFingerSuggestionCache(force = false) {
    if (!this.fingerSuggestionMode) {
      this.fingerSuggestionMap.clear();
      this.fingerSuggestionDiagnostics = null;
      if (this.onFingerSuggestionUpdate) {
        this.onFingerSuggestionUpdate(null);
      }
      this.fingerSuggestionSignature = '';
      this.fingerSuggestionDirty = false;
      return;
    }
    if (!force && !this.fingerSuggestionDirty) return;
    const suggestion = computeFingerSuggestions(this.notes, this.fingerSuggestionLevel, this.fingerSuggestionAlgorithm);
    this.fingerSuggestionMap = suggestion.map;
    this.fingerSuggestionDiagnostics = suggestion.diagnostics || null;
    if (this.onFingerSuggestionUpdate) {
      this.onFingerSuggestionUpdate(this.fingerSuggestionDiagnostics);
    }
    this.fingerSuggestionSignature = '';
    this.fingerSuggestionDirty = false;
  }

  _getActiveNoteIndex() {
    if (this.hoverNoteIndex >= 0) return this.hoverNoteIndex;
    if (this.selectedNoteIndex >= 0 && this.selectedNoteIndex < this.notes.length) return this.selectedNoteIndex;
    const selected = this._getSelectedIndicesOrdered();
    if (selected.length) return selected[selected.length - 1];
    return -1;
  }

  _duplicateSelectedNote() {
    const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
    if (!indices.length) return false;

    const notesToCopy = indices.map(index => ({ index, note: this.notes[index] })).filter(item => item.note);
    if (!notesToCopy.length) return false;

    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = 0;
    notesToCopy.forEach(item => {
      const noteStart = Math.max(0, Number(item.note.startTime) || 0);
      const duration = Math.max(0.03, Number(item.note.duration) || 0.12);
      minStart = Math.min(minStart, noteStart);
      maxEnd = Math.max(maxEnd, noteStart + duration);
    });
    const shiftSec = Math.max(0.05, maxEnd - minStart);

    const newIndices = [];
    notesToCopy.forEach(item => {
      const source = item.note;
      const duplicate = {
        note: clampMidi(source.note),
        startTime: Math.max(0, (Number(source.startTime) || 0) + shiftSec),
        duration: Math.max(0.03, Number(source.duration) || 0.12),
        velocity: Math.max(1, Math.min(127, Math.round(Number(source.velocity) || 96))),
      };
      this.notes.push(duplicate);
      newIndices.push(this.notes.length - 1);
    });

    this.selectedNoteIndices.clear();
    newIndices.forEach(index => this.selectedNoteIndices.add(index));
    this.selectedNoteIndex = newIndices.length ? newIndices[newIndices.length - 1] : -1;
    this.hoverNoteIndex = this.selectedNoteIndex;
    this._emitNotesChange();
    this._emitNotesCommit('Duplicate notes');
    return true;
  }

  _deleteNoteAtIndex(index) {
    return this._deleteNotesByIndices([index]);
  }

  _deleteHoveredOrSelectedNote() {
    const idx = this._getActiveNoteIndex();
    const indices = this._getEditableIndicesForOperations(idx);
    return this._deleteNotesByIndices(indices);
  }

  _addNoteAt(x, y) {
    if (!this.layout) return false;
    const note = {
      note: this._midiAtY(y, this.layout),
      startTime: this._timeAtX(x, this.layout),
      duration: 0.35,
      velocity: 96,
    };

    this.notes.push(note);
    this._setSingleSelection(this.notes.length - 1);
    this.hoverNoteIndex = this.selectedNoteIndex;
    this._emitNotesChange();
    this._emitNotesCommit('Add note');
    playPreviewNote(note.note, 0.5, 0.82).catch(error => console.error('Score preview note error:', error));
    return true;
  }

  _hitNote(x, y) {
    for (let i = this.noteHitboxes.length - 1; i >= 0; i -= 1) {
      const box = this.noteHitboxes[i];
      const inHandle = x >= box.handleX && x <= box.handleX + box.handleW && y >= box.handleY && y <= box.handleY + box.handleH;
      if (inHandle) return { ...box, mode: 'duration' };
      const inBody = x >= box.noteX && x <= box.noteX + box.noteW && y >= box.noteY && y <= box.noteY + box.noteH;
      if (inBody) return { ...box, mode: 'note' };
    }
    return null;
  }

  _hitFingerBadge(x, y) {
    if (!this.fingerSuggestionMode) return null;
    for (let i = this.noteHitboxes.length - 1; i >= 0; i -= 1) {
      const box = this.noteHitboxes[i];
      if (!box || !box.fingerBadge) continue;
      const dx = x - box.fingerBadge.x;
      const dy = y - box.fingerBadge.y;
      if ((dx * dx) + (dy * dy) <= (box.fingerBadge.r * box.fingerBadge.r)) return box;
    }
    return null;
  }

  _setFingerOverrideForIndices(indices, nextFinger, action = 'Set manual fingering') {
    if (!Array.isArray(indices) || !indices.length) return false;
    const normalized = normalizeFingerOverride(nextFinger);
    let changed = false;
    indices.forEach(index => {
      const note = this.notes[index];
      if (!note) return;
      const prev = normalizeFingerOverride(note.fingerOverride);
      if (prev === normalized) return;
      if (normalized === 0) delete note.fingerOverride;
      else note.fingerOverride = normalized;
      changed = true;
    });
    if (!changed) return false;
    this._emitNotesChange();
    this._emitNotesCommit(action);
    return true;
  }

  _setCursor(hit = null) {
    if (this.draggingNote) {
      this.canvas.style.cursor = this.draggingNote.mode === 'duration' ? 'ew-resize' : 'move';
      return;
    }
    if (!hit) {
      this.canvas.style.cursor = this.editMode ? 'crosshair' : 'default';
      return;
    }
    this.canvas.style.cursor = hit.mode === 'duration' ? 'ew-resize' : 'move';
  }

  _startDrag(hit, localX, localY) {
    if (!hit || !hit.noteRef) return false;
    const targetIndices = this._isSelected(hit.index)
      ? this._getEditableIndicesForOperations(hit.index)
      : [hit.index];
    if (!this._isSelected(hit.index)) this._setSingleSelection(hit.index);
    const snapshots = targetIndices.map(index => {
      const note = this.notes[index];
      return {
        index,
        noteRef: note,
        startStartTime: Math.max(0, Number(note?.startTime) || 0),
        startDuration: Math.max(0.03, Number(note?.duration) || 0.12),
        startMidi: clampMidi(note?.note),
      };
    });
    this.draggingNote = {
      index: hit.index,
      noteRef: hit.noteRef,
      mode: hit.mode || 'note',
      startClientX: localX,
      startClientY: localY,
      startStartTime: Math.max(0, Number(hit.noteRef.startTime) || 0),
      startDuration: Math.max(0.03, Number(hit.noteRef.duration) || 0.12),
      startMidi: clampMidi(hit.noteRef.note),
      targets: snapshots,
      changed: false,
    };
    this.hoverNoteIndex = hit.index;
    this._setCursor(this.draggingNote);
    return true;
  }

  _updateDrag(localX, localY) {
    if (!this.draggingNote || !this.draggingNote.noteRef || !this.layout) return;
    const targets = Array.isArray(this.draggingNote.targets) && this.draggingNote.targets.length
      ? this.draggingNote.targets
      : [{
        index: this.draggingNote.index,
        noteRef: this.draggingNote.noteRef,
        startStartTime: this.draggingNote.startStartTime,
        startDuration: this.draggingNote.startDuration,
        startMidi: this.draggingNote.startMidi,
      }];

    if (this.draggingNote.mode === 'duration') {
      const deltaSec = (localX - this.draggingNote.startClientX) / this.layout.pxPerSec;
      let changed = false;
      targets.forEach(target => {
        if (!target.noteRef) return;
        const nextDuration = Math.max(0.03, target.startDuration + deltaSec);
        if (Math.abs(nextDuration - (Number(target.noteRef.duration) || 0)) > 0.0001) {
          target.noteRef.duration = nextDuration;
          changed = true;
        }
      });
      if (changed) {
        this.draggingNote.changed = true;
        this._emitNotesChange();
      }
      return;
    }

    const deltaSec = (localX - this.draggingNote.startClientX) / this.layout.pxPerSec;
    const pitchDelta = Math.round((this.draggingNote.startClientY - localY) / this.layout.pitchStepPx);
    let changed = false;

    targets.forEach(target => {
      if (!target.noteRef) return;
      const targetStart = Math.max(0, target.startStartTime + deltaSec);
      const targetMidi = clampMidi(target.startMidi + pitchDelta);
      if (Math.abs(targetStart - (Number(target.noteRef.startTime) || 0)) > 0.0001) {
        target.noteRef.startTime = targetStart;
        changed = true;
      }
      if (targetMidi !== target.noteRef.note) {
        target.noteRef.note = targetMidi;
        changed = true;
      }
    });

    if (changed) {
      this.draggingNote.changed = true;
      this._emitNotesChange();
    }
  }

  _finishDrag(commit = true) {
    if (!this.draggingNote) return;
    const dragMode = this.draggingNote.mode;
    const changed = Boolean(this.draggingNote.changed);
    if (!this._isSelected(this.draggingNote.index)) {
      this._setSingleSelection(this.draggingNote.index);
    } else {
      this.selectedNoteIndex = this.draggingNote.index;
    }
    this.draggingNote = null;
    this._setCursor(null);
    if (commit && changed) {
      const action = dragMode === 'duration'
        ? 'Change note duration'
        : 'Move note pitch and timing';
      this._emitNotesCommit(action);
    }
  }

  _drawLedgerLines(ctx, x, step, layout) {
    const half = Math.max(10, layout.noteHeadW * 1.1);
    ctx.strokeStyle = 'rgba(209,213,219,0.55)';
    ctx.lineWidth = 1.2;

    if (step > STAFF_TOP_STEP) {
      for (let s = STAFF_TOP_STEP + 2; s <= step; s += 2) {
        const y = this._stepToY(s, layout);
        ctx.beginPath();
        ctx.moveTo(x - half, y);
        ctx.lineTo(x + half, y);
        ctx.stroke();
      }
    } else if (step < STAFF_BOTTOM_STEP) {
      for (let s = STAFF_BOTTOM_STEP - 2; s >= step; s -= 2) {
        const y = this._stepToY(s, layout);
        ctx.beginPath();
        ctx.moveTo(x - half, y);
        ctx.lineTo(x + half, y);
        ctx.stroke();
      }
    } else if (step === STAFF_MIDDLE_C_STEP) {
      const y = this._stepToY(step, layout);
      ctx.beginPath();
      ctx.moveTo(x - half, y);
      ctx.lineTo(x + half, y);
      ctx.stroke();
    }
  }

  _draw(ctx, W, H) {
    const layout = this._buildLayout(W, H);
    const readable = this.readableMode;
    this.layout = layout;
    this.noteHitboxes = [];
    this._refreshFingerSuggestionCache();

    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    if (readable) {
      bg.addColorStop(0, '#070a12');
      bg.addColorStop(1, '#0a0f18');
    } else {
      bg.addColorStop(0, '#070914');
      bg.addColorStop(1, '#090b18');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (!readable) {
      const staffGlow = ctx.createLinearGradient(0, layout.topY, 0, layout.bottomY);
      staffGlow.addColorStop(0, 'rgba(59,130,246,0.05)');
      staffGlow.addColorStop(0.5, 'rgba(139,92,246,0.08)');
      staffGlow.addColorStop(1, 'rgba(59,130,246,0.05)');
      ctx.fillStyle = staffGlow;
      ctx.fillRect(layout.left - 8, layout.topY, (W - layout.right) - layout.left + 16, layout.bottomY - layout.topY);
    }

    const totalSec = layout.totalDuration;
    const scrollLeft = this.scrollHost ? this.scrollHost.scrollLeft : 0;
    const viewportW = Math.max(240, this.viewportW || W);
    const visibleStartSec = Math.max(0, ((scrollLeft - layout.left) / layout.pxPerSec) - 1);
    const visibleEndSec = Math.min(totalSec, (((scrollLeft + viewportW) - layout.left) / layout.pxPerSec) + 1);
    const firstSec = Math.floor(visibleStartSec);
    const lastSec = Math.ceil(visibleEndSec);
    for (let sec = firstSec; sec <= lastSec; sec += 1) {
      const x = this._timeToX(sec, layout);
      const isBar = sec % 4 === 0;
      ctx.strokeStyle = readable
        ? (isBar ? 'rgba(148,163,184,0.28)' : 'rgba(148,163,184,0.12)')
        : (isBar ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)');
      ctx.lineWidth = readable ? (isBar ? 1.1 : 0.7) : (isBar ? 1.2 : 0.8);
      ctx.beginPath();
      ctx.moveTo(x, layout.topY);
      ctx.lineTo(x, layout.bottomY);
      ctx.stroke();
      if (isBar) {
        ctx.fillStyle = readable ? 'rgba(148,163,184,0.6)' : 'rgba(156,163,175,0.45)';
        ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(`${sec}s`, x + 2, layout.topY - 6);
      }
    }

    const staffSteps = [...TREBLE_LINE_STEPS, ...BASS_LINE_STEPS];
    ctx.strokeStyle = readable ? 'rgba(226,232,240,0.72)' : 'rgba(229,231,235,0.62)';
    ctx.lineWidth = readable ? 1.05 : 1;
    staffSteps.forEach(step => {
      const y = this._stepToY(step, layout);
      ctx.beginPath();
      ctx.moveTo(layout.left, y);
      ctx.lineTo(W - layout.right, y);
      ctx.stroke();
    });

    const bracketTop = this._stepToY(TREBLE_LINE_STEPS[0], layout);
    const bracketBottom = this._stepToY(BASS_LINE_STEPS[BASS_LINE_STEPS.length - 1], layout);
    const fixedAnchorX = layout.left + scrollLeft;
    ctx.strokeStyle = readable ? 'rgba(226,232,240,0.62)' : 'rgba(229,231,235,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fixedAnchorX - 12, bracketTop);
    ctx.lineTo(fixedAnchorX - 12, bracketBottom);
    ctx.stroke();

    const trebleY = this._stepToY(34, layout);
    const bassY = this._stepToY(22, layout);
    ctx.fillStyle = readable ? 'rgba(203,213,225,0.9)' : 'rgba(221,214,254,0.82)';
    ctx.font = `${Math.max(34, Math.round(layout.lineGap * 3.8))}px "Noto Music", "Bravura", "Segoe UI Symbol", "Apple Symbols", serif`;
    ctx.fillText('𝄞', fixedAnchorX - 54, trebleY + (layout.lineGap * 1.6));
    ctx.font = `${Math.max(28, Math.round(layout.lineGap * 3.0))}px "Noto Music", "Bravura", "Segoe UI Symbol", "Apple Symbols", serif`;
    ctx.fillText('𝄢', fixedAnchorX - 52, bassY + (layout.lineGap * 1.25));
    if (!readable) {
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(_uiText('Treble Clef'), scrollLeft + 10, trebleY - (layout.lineGap * 1.8));
      ctx.fillText(_uiText('Bass Clef'), scrollLeft + 10, bassY - (layout.lineGap * 1.35));
    }

    const playheadX = this._timeToX(this.currentTime, layout);
    ctx.strokeStyle = this.isPlaying
      ? (readable ? 'rgba(45,212,191,0.92)' : 'rgba(110,231,183,0.85)')
      : (readable ? 'rgba(148,163,184,0.58)' : 'rgba(167,139,250,0.5)');
    ctx.lineWidth = this.isPlaying ? 1.8 : (readable ? 1.05 : 1.2);
    ctx.beginPath();
    ctx.moveTo(playheadX, layout.topY - 8);
    ctx.lineTo(playheadX, layout.bottomY + 8);
    ctx.stroke();

    this.notes.forEach((note, index) => {
      const midi = clampMidi(note.note);
      const step = midiToDiatonicStep(midi);
      const y = this._stepToY(step, layout);
      const x = this._timeToX(note.startTime, layout);
      const duration = Math.max(0.03, Number(note.duration) || 0.12);
      const tailX = x + Math.max(layout.noteHeadW * 1.15, duration * layout.pxPerSec);
      const visibleMinX = scrollLeft - 40;
      const visibleMaxX = scrollLeft + viewportW + 40;

      if (x > visibleMaxX || tailX < visibleMinX || y < layout.topY - 26 || y > layout.bottomY + 26) return;

      const selectedByDrag = this.draggingNote && this.draggingNote.index === index;
      const selected = selectedByDrag || this._isSelected(index);
      const hovered = !selectedByDrag && this.hoverNoteIndex === index;
      const isLive = this.isPlaying && this.currentTime >= (Number(note.startTime) || 0) && this.currentTime < ((Number(note.startTime) || 0) + duration);
      const fingerData = this.fingerSuggestionMode ? this.fingerSuggestionMap.get(index) : null;

      const color = readable ? 'rgb(186,230,253)' : this._noteColor(midi);
      const accent = readable
        ? (selected ? 'rgba(125,211,252,0.96)' : (hovered ? 'rgba(125,211,252,0.75)' : 'rgba(226,232,240,0.2)'))
        : (selected ? 'rgba(196,181,253,1)' : (hovered ? 'rgba(196,181,253,0.72)' : 'rgba(255,255,255,0.22)'));
      const durStroke = isLive
        ? (readable ? 'rgba(45,212,191,0.92)' : 'rgba(110,231,183,0.82)')
        : (selected || hovered
          ? (readable ? 'rgba(125,211,252,0.9)' : 'rgba(196,181,253,0.78)')
          : (readable ? 'rgba(203,213,225,0.46)' : 'rgba(255,255,255,0.34)'));

      this._drawLedgerLines(ctx, x, step, layout);

      ctx.strokeStyle = durStroke;
      ctx.lineWidth = selected ? 2.4 : 1.7;
      ctx.beginPath();
      ctx.moveTo(x + layout.noteHeadW * 0.5, y);
      ctx.lineTo(tailX, y);
      ctx.stroke();

      ctx.fillStyle = durStroke;
      ctx.beginPath();
      ctx.arc(tailX, y, selected ? 4.2 : 3.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.38);
      ctx.shadowColor = color;
      ctx.shadowBlur = readable ? (selected || isLive ? 4 : 1) : (selected || isLive ? 12 : 5);
      ctx.fillStyle = isLive ? (readable ? '#5eead4' : '#a7f3d0') : color;
      ctx.beginPath();
      ctx.ellipse(0, 0, layout.noteHeadW * 0.58, layout.noteHeadH * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = accent;
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.stroke();
      ctx.restore();

      if (BLACK_S.has(midi % 12)) {
        ctx.fillStyle = readable ? 'rgba(226,232,240,0.9)' : 'rgba(229,231,235,0.82)';
        ctx.font = `bold ${Math.max(10, Math.round(layout.lineGap * 0.7))}px "Times New Roman", Georgia, serif`;
        ctx.fillText('#', x - layout.noteHeadW - 9, y + 4);
      }

      if (selected || hovered) {
        ctx.strokeStyle = selected ? 'rgba(196,181,253,0.95)' : 'rgba(196,181,253,0.65)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - layout.noteHeadW, y - layout.noteHeadH - 3, layout.noteHeadW * 2.25, layout.noteHeadH * 2.25);
      }

      const fingerBadge = fingerData
        ? {
          x: x + (layout.noteHeadW * 1.15),
          y: y - (layout.noteHeadH * 1.45),
          r: selected || hovered || isLive ? 9.2 : 8.4,
        }
        : null;
      if (fingerBadge) {
        _drawFingerBadge(
          ctx,
          fingerBadge.x,
          fingerBadge.y,
          fingerData.finger,
          fingerData.hand,
          selected || hovered || isLive,
          fingerData.confidence
        );
      }

      this.noteHitboxes.push({
        index,
        noteRef: note,
        noteX: x - layout.noteHeadW * 0.95,
        noteY: y - layout.noteHeadH - 4,
        noteW: layout.noteHeadW * 2.2,
        noteH: layout.noteHeadH * 2.3 + 6,
        handleX: tailX - 7,
        handleY: y - 7,
        handleW: 14,
        handleH: 14,
        fingerBadge,
      });
    });

    if (this.isLassoSelecting && this.lasso) {
      const rect = this._normalizedRect(this.lasso.startX, this.lasso.startY, this.lasso.endX, this.lasso.endY);
      ctx.fillStyle = 'rgba(59,130,246,0.12)';
      ctx.strokeStyle = 'rgba(147,197,253,0.9)';
      ctx.lineWidth = 1;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, Math.max(0, rect.w - 1), Math.max(0, rect.h - 1));
    }

  }

  _bindEvents() {
    const c = this.canvas;
    const xy = e => this._localPointFromEvent(e);

    this._h = {
      md: e => {
        if (!this.editMode) return;
        const { x, y } = xy(e);
        if (this.fingerSuggestionMode && e.button === 0) {
          const fingerHit = this._hitFingerBadge(x, y);
          if (fingerHit) {
            if (!this._isSelected(fingerHit.index)) this._setSingleSelection(fingerHit.index);
            const current = normalizeFingerOverride(fingerHit.noteRef?.fingerOverride) || 0;
            const next = e.shiftKey
              ? (current <= 1 ? 5 : current - 1)
              : (current >= 5 ? 1 : current + 1);
            this._setFingerOverrideForIndices([fingerHit.index], next, 'Set manual fingering');
            this.hoverNoteIndex = fingerHit.index;
            this._setCursor({ mode: 'note' });
            return;
          }
        }
        const hit = this._hitNote(x, y);
        if (hit) {
          if (e.metaKey || e.ctrlKey) {
            this._toggleSelection(hit.index);
            this.hoverNoteIndex = hit.index;
            this._setCursor(hit);
            return;
          }
          if (!this._isSelected(hit.index)) this._setSingleSelection(hit.index);
          this._startDrag(hit, x, y);
          return;
        }
        if (e.button === 0) {
          this._startLasso(x, y, e.metaKey || e.ctrlKey);
          return;
        }
        if (!(e.metaKey || e.ctrlKey)) this._clearSelection();
      },
      mm: e => {
        const { x, y } = xy(e);
        if (this.draggingNote) {
          this._updateDrag(x, y);
          this._setCursor(this.draggingNote);
          return;
        }
        if (this.isLassoSelecting) {
          this._updateLasso(x, y);
          this.canvas.style.cursor = 'crosshair';
          return;
        }
        const hit = this.editMode ? this._hitNote(x, y) : null;
        this.hoverNoteIndex = hit ? hit.index : -1;
        this._setCursor(hit);
      },
      mu: () => {
        this._finishDrag(true);
        this._finishLasso();
      },
      ml: () => {
        if (this.draggingNote || this.isLassoSelecting) return;
        this.hoverNoteIndex = -1;
        this._setCursor(null);
      },
      wm: e => {
        if (this.isLassoSelecting) {
          const { x, y } = xy(e);
          this._updateLasso(x, y);
          return;
        }
        if (!this.draggingNote) return;
        const { x, y } = xy(e);
        this._updateDrag(x, y);
      },
      wu: () => {
        this._finishDrag(true);
        this._finishLasso();
      },
      wb: () => {
        this._finishDrag(false);
        this._finishLasso();
        this._setCursor(null);
      },
      db: e => {
        if (!this.editMode) return;
        const { x, y } = xy(e);
        if (this._hitNote(x, y)) return;
        e.preventDefault();
        this._addNoteAt(x, y);
      },
      cm: e => {
        if (!this.editMode) return;
        const { x, y } = xy(e);
        if (this.fingerSuggestionMode) {
          const fingerHit = this._hitFingerBadge(x, y);
          if (fingerHit) {
            e.preventDefault();
            if (!this._isSelected(fingerHit.index)) this._setSingleSelection(fingerHit.index);
            this._setFingerOverrideForIndices([fingerHit.index], 0, 'Clear manual fingering');
            return;
          }
        }
        const hit = this._hitNote(x, y);
        if (!hit) return;
        e.preventDefault();
        if (!this._isSelected(hit.index)) this._setSingleSelection(hit.index);
        this._deleteHoveredOrSelectedNote();
      },
      wk: e => {
        if (!this.editMode) return;
        const active = document.activeElement;
        if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;

        if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
          if (e.shiftKey) {
            if (this.onRedoRequest) this.onRedoRequest();
          } else if (this.onUndoRequest) {
            this.onUndoRequest();
          }
          e.preventDefault();
          return;
        }
        if ((e.ctrlKey && (e.key === 'y' || e.key === 'Y')) || ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
          if (this.onRedoRequest) this.onRedoRequest();
          e.preventDefault();
          return;
        }

        if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
          this.selectedNoteIndices.clear();
          for (let i = 0; i < this.notes.length; i += 1) this.selectedNoteIndices.add(i);
          this.selectedNoteIndex = this.notes.length ? this.notes.length - 1 : -1;
          this.hoverNoteIndex = this.selectedNoteIndex;
          e.preventDefault();
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (this._deleteHoveredOrSelectedNote()) e.preventDefault();
          return;
        }

        if (e.key === 'Escape') {
          this._clearSelection();
          this.hoverNoteIndex = -1;
          this._setCursor(null);
          e.preventDefault();
          return;
        }

        if ((e.metaKey || e.ctrlKey) && (e.key === 'd' || e.key === 'D')) {
          if (this._duplicateSelectedNote()) e.preventDefault();
          return;
        }

        const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
        if (!indices.length) return;
        let changed = false;

        if (this.fingerSuggestionMode && /^[0-5]$/.test(e.key)) {
          const finger = e.key === '0' ? 0 : Number(e.key);
          if (this._setFingerOverrideForIndices(
            indices,
            finger,
            finger === 0 ? 'Clear manual fingering' : 'Set manual fingering'
          )) {
            e.preventDefault();
          }
          return;
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const step = e.shiftKey ? 12 : 1;
          const delta = e.key === 'ArrowUp' ? step : -step;
          indices.forEach(index => {
            const note = this.notes[index];
            if (!note) return;
            const next = clampMidi((Number(note.note) || MIDI_LO) + delta);
            if (next !== note.note) {
              note.note = next;
              changed = true;
            }
          });
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const step = e.shiftKey ? 0.25 : 0.1;
          const delta = e.key === 'ArrowRight' ? step : -step;
          indices.forEach(index => {
            const note = this.notes[index];
            if (!note) return;
            const next = Math.max(0, (Number(note.startTime) || 0) + delta);
            if (Math.abs(next - (Number(note.startTime) || 0)) > 0.0001) {
              note.startTime = next;
              changed = true;
            }
          });
        } else if (e.key === ']' || e.key === '[') {
          const step = e.shiftKey ? 0.25 : 0.1;
          const delta = e.key === ']' ? step : -step;
          indices.forEach(index => {
            const note = this.notes[index];
            if (!note) return;
            const next = Math.max(0.03, (Number(note.duration) || 0.12) + delta);
            if (Math.abs(next - (Number(note.duration) || 0)) > 0.0001) {
              note.duration = next;
              changed = true;
            }
          });
        }

        if (changed) {
          this.selectedNoteIndex = indices[indices.length - 1];
          this.hoverNoteIndex = this.selectedNoteIndex;
          this._emitNotesChange();
          const action = e.key === 'ArrowUp' || e.key === 'ArrowDown'
            ? 'Change note pitch'
            : e.key === 'ArrowRight' || e.key === 'ArrowLeft'
              ? 'Move note timing'
              : 'Change note duration';
          this._emitNotesCommit(action);
          e.preventDefault();
        }
      },
      hs: () => {
        if (!this.scrollHost) return;
        const maxScroll = Math.max(0, this.scrollHost.scrollWidth - this.scrollHost.clientWidth);
        this.scrollRatio = maxScroll > 0 ? (this.scrollHost.scrollLeft / maxScroll) : 0;
      },
    };

    c.addEventListener('mousedown', this._h.md);
    c.addEventListener('mousemove', this._h.mm);
    c.addEventListener('mouseup', this._h.mu);
    c.addEventListener('mouseleave', this._h.ml);
    c.addEventListener('dblclick', this._h.db);
    c.addEventListener('contextmenu', this._h.cm);
    this.scrollHost.addEventListener('scroll', this._h.hs, { passive: true });
    window.addEventListener('mousemove', this._h.wm);
    window.addEventListener('mouseup', this._h.wu);
    window.addEventListener('blur', this._h.wb);
    window.addEventListener('keydown', this._h.wk);
  }

  _scrollTimeIntoView(force = false) {
    if (!this.scrollHost || !this.layout) return;
    const viewportW = this.scrollHost.clientWidth || this.viewportW || this.W || 0;
    const maxScroll = Math.max(0, this.scrollHost.scrollWidth - viewportW);
    if (maxScroll <= 0 || viewportW <= 0) return;

    const playheadX = this._timeToX(this.currentTime, this.layout);
    const scrollLeft = this.scrollHost.scrollLeft;
    const leadingMargin = Math.max(100, Math.min(260, viewportW * 0.34));
    const trailingMargin = Math.max(90, Math.min(230, viewportW * 0.28));
    let nextScrollLeft = scrollLeft;

    if (force) {
      nextScrollLeft = playheadX - (viewportW * 0.32);
    } else if (playheadX > scrollLeft + viewportW - trailingMargin) {
      nextScrollLeft = playheadX - viewportW + trailingMargin;
    } else if (playheadX < scrollLeft + leadingMargin) {
      nextScrollLeft = playheadX - leadingMargin;
    }

    nextScrollLeft = Math.max(0, Math.min(maxScroll, Math.round(nextScrollLeft)));
    if (Math.abs(nextScrollLeft - scrollLeft) > 1) {
      this.scrollHost.scrollLeft = nextScrollLeft;
      this.scrollRatio = maxScroll > 0 ? (nextScrollLeft / maxScroll) : 0;
    }
  }

  _setup() {
    cancelAnimationFrame(this.animId);
    const dpr = window.devicePixelRatio || 1;
    const viewportW = this.container.clientWidth || 800;
    const H = this.container.clientHeight || 330;
    this.viewportW = viewportW;
    this.H = H;
    const widthLayout = this._buildLayout(viewportW, H);
    const W = Math.max(viewportW, Math.ceil(widthLayout.contentW || viewportW));
    this.W = W;

    this.scrollHost.classList.toggle('scroll-x', W > viewportW + 2);
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width = `${W}px`;
    this.canvas.style.height = `${H}px`;

    const nextMaxScroll = Math.max(0, W - viewportW);
    if (nextMaxScroll > 0) {
      this.scrollHost.scrollLeft = Math.round(nextMaxScroll * this.scrollRatio);
    } else {
      this.scrollHost.scrollLeft = 0;
      this.scrollRatio = 0;
    }

    this.layout = this._buildLayout(W, H);
    if (this.isPlaying) this._scrollTimeIntoView(true);

    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const loop = () => {
      this._draw(ctx, W, H);
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  setTime(t) {
    const next = Math.max(0, Number(t) || 0);
    if (Math.abs(next - this.currentTime) < 0.0001) return;
    this.currentTime = next;
    if (this.isPlaying) this._scrollTimeIntoView(false);
  }

  setPlaying(playing) {
    const next = Boolean(playing);
    if (next === this.isPlaying) return;
    this.isPlaying = next;
    if (this.isPlaying) this._scrollTimeIntoView(true);
  }

  setZoom(x, y) {
    const nextX = Math.max(0.6, Math.min(2.4, Number(x) || 1));
    const nextY = Math.max(0.6, Math.min(2.4, Number(y) || 1));
    const changed = Math.abs(nextX - this.zoomX) > 0.0001 || Math.abs(nextY - this.zoomY) > 0.0001;
    if (!changed) return;

    if (this.scrollHost) {
      const oldMaxScroll = Math.max(0, this.scrollHost.scrollWidth - this.scrollHost.clientWidth);
      this.scrollRatio = oldMaxScroll > 0 ? (this.scrollHost.scrollLeft / oldMaxScroll) : 0;
    }

    this.zoomX = nextX;
    this.zoomY = nextY;
    if (this.container && this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      this._setup();
    }
  }

  setReadableMode(enabled) {
    this.readableMode = Boolean(enabled);
  }

  setFingerSuggestions(enabled, level = this.fingerSuggestionLevel, algorithm = this.fingerSuggestionAlgorithm) {
    const nextMode = Boolean(enabled);
    const nextLevel = normalizeFingerSuggestionLevel(level);
    const nextAlgorithm = normalizeFingerSuggestionAlgorithm(algorithm);
    const changed = nextMode !== this.fingerSuggestionMode || nextLevel !== this.fingerSuggestionLevel || nextAlgorithm !== this.fingerSuggestionAlgorithm;
    if (!changed) return;
    this.fingerSuggestionMode = nextMode;
    this.fingerSuggestionLevel = nextLevel;
    this.fingerSuggestionAlgorithm = nextAlgorithm;
    this._markFingerSuggestionDirty();
    if (!this.fingerSuggestionMode) {
      this.fingerSuggestionMap.clear();
      this.fingerSuggestionDiagnostics = null;
      if (this.onFingerSuggestionUpdate) this.onFingerSuggestionUpdate(null);
      this.fingerSuggestionSignature = '';
      this.fingerSuggestionDirty = false;
    }
  }

  applyFingerOverrideToSelection(finger) {
    const indices = this._getEditableIndicesForOperations(this._getActiveNoteIndex());
    if (!indices.length) return false;
    return this._setFingerOverrideForIndices(
      indices,
      finger,
      finger === 0 ? 'Clear manual fingering' : 'Set manual fingering'
    );
  }

  setEditMode(enabled) {
    const next = Boolean(enabled);
    if (next === this.editMode) return;
    this.editMode = next;
    this.hoverNoteIndex = -1;
    if (!this.editMode) this._finishDrag(false);
    this._finishLasso();
    this._clearSelection();
    this._setCursor(null);
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    this._ro.disconnect();
    this._finishDrag(false);
    this._finishLasso();
    const c = this.canvas;
    c.removeEventListener('mousedown', this._h.md);
    c.removeEventListener('mousemove', this._h.mm);
    c.removeEventListener('mouseup', this._h.mu);
    c.removeEventListener('mouseleave', this._h.ml);
    c.removeEventListener('dblclick', this._h.db);
    c.removeEventListener('contextmenu', this._h.cm);
    this.scrollHost.removeEventListener('scroll', this._h.hs);
    window.removeEventListener('mousemove', this._h.wm);
    window.removeEventListener('mouseup', this._h.wu);
    window.removeEventListener('blur', this._h.wb);
    window.removeEventListener('keydown', this._h.wk);
    this.scrollHost.remove();
  }
}

// ═══════════════════════════════════════════════════════════════════
// WAVEFORM CLASS
// ═══════════════════════════════════════════════════════════════════

class Waveform {
  constructor(container) {
    this.container = container;
    this.data = []; this.currentTime = 0; this.duration = 48; this.isRecording = false;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.appendChild(this.canvas);
    this._ro = new ResizeObserver(() => this._draw());
    this._ro.observe(container);
    this._draw();
  }

  update(data, currentTime, duration, isRecording) {
    this.data = data; this.currentTime = currentTime; this.duration = duration; this.isRecording = isRecording;
    this._draw();
  }

  _draw() {
    const dpr = window.devicePixelRatio || 1, W = this.container.clientWidth || 300, H = this.container.clientHeight || 72;
    this.canvas.width = W * dpr; this.canvas.height = H * dpr;
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    const ctx = this.canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    if (!this.data.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(this.isRecording ? 'Recording...' : 'No audio loaded', W / 2, H / 2 + 4);
      return;
    }
    const bw = W / this.data.length, px = this.duration > 0 ? (this.currentTime / this.duration) * W : 0;
    this.data.forEach((v, i) => {
      const x = i * bw, h = v * (H * 0.8), y = (H - h) / 2;
      ctx.fillStyle = x < px ? '#8b5cf6' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 0.5, y, Math.max(1, bw - 1), h);
    });
  }

  destroy() { this._ro.disconnect(); this.canvas.remove(); }
}

// ═══════════════════════════════════════════════════════════════════
// AUDIO PLAYER CLASS
// ═══════════════════════════════════════════════════════════════════

class AudioPlayerWidget {
  constructor(container, url, fileName) {
    this.container = container;
    this.fileName = fileName;
    this.isPlaying = false; this.duration = 0; this.currentTime = 0; this.loaded = false;
    this.audio = new Audio(url);
    this.audio.addEventListener('loadedmetadata', () => { this.duration = this.audio.duration; this.loaded = true; this._update(); });
    this.audio.addEventListener('timeupdate', () => { this.currentTime = this.audio.currentTime; this._update(); });
    this.audio.addEventListener('ended', () => { this.isPlaying = false; this.currentTime = 0; this.audio.currentTime = 0; this._update(); });
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="w-audio-player w-fade-in">
        <p class="w-audio-filename">🎵 ${this.fileName}</p>
        <div class="w-audio-track">
          <div class="w-audio-track-bg"></div>
          <div class="w-audio-track-fill" id="ap-fill" style="width:0%"></div>
          <input type="range" min="0" max="1" step="0.001" value="0" id="ap-range">
        </div>
        <div class="w-audio-times"><span id="ap-cur">0:00</span><span id="ap-dur">0:00</span></div>
        <div class="w-audio-controls">
          <div class="w-audio-btns">
            <button class="w-ap-play" id="ap-play" disabled>${ICON.play(14, 'white')}</button>
            <button class="w-ap-stop" id="ap-stop">${ICON.stop(11, '#9ca3af')}</button>
            <div id="ap-vis" style="display:flex;align-items:center;gap:2px;opacity:0;">
              <div class="w-vis-bar"></div><div class="w-vis-bar"></div><div class="w-vis-bar"></div>
            </div>
          </div>
          <button class="w-ap-dl" id="ap-dl">${ICON.download(11, '#93c5fd')} <span>Download</span></button>
        </div>
      </div>`;
    this.container.querySelector('#ap-play').addEventListener('click', () => this._togglePlay());
    this.container.querySelector('#ap-stop').addEventListener('click', () => this._stop());
    this.container.querySelector('#ap-dl').addEventListener('click', () => { const a = document.createElement('a'); a.href = this.audio.src; a.download = this.fileName; a.click(); });
    this.container.querySelector('#ap-range').addEventListener('input', e => {
      const t = parseFloat(e.target.value) * this.duration;
      this.audio.currentTime = t; this.currentTime = t; this._update();
    });
  }

  async _togglePlay() {
    if (!this.loaded) return;

    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this._update();
      return;
    }

    try {
      const playPromise = this.audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        await playPromise;
      }
      this.isPlaying = true;
    } catch (error) {
      this.isPlaying = false;
      console.error('Audio playback error:', error);
    }

    this._update();
  }

  _stop() { this.audio.pause(); this.audio.currentTime = 0; this.isPlaying = false; this.currentTime = 0; this._update(); }

  _update() {
    const pct = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    const fill = this.container.querySelector('#ap-fill'); if (fill) fill.style.width = pct + '%';
    const range = this.container.querySelector('#ap-range'); if (range) range.value = this.duration > 0 ? this.currentTime / this.duration : 0;
    const cur = this.container.querySelector('#ap-cur'); if (cur) cur.textContent = fmtTime(this.currentTime);
    const dur = this.container.querySelector('#ap-dur'); if (dur) dur.textContent = fmtTime(this.duration);
    const play = this.container.querySelector('#ap-play');
    if (play) { play.innerHTML = this.isPlaying ? ICON.pause(14, 'white') : ICON.play(14, 'white'); play.className = 'w-ap-play' + (this.isPlaying ? ' active' : ''); play.disabled = !this.loaded; }
    const vis = this.container.querySelector('#ap-vis'); if (vis) vis.style.opacity = this.isPlaying ? '1' : '0';
  }

  destroy() { this.audio.pause(); this.audio.src = ''; }
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════

function destroyInstances() {
  if (_pianoRoll) { _pianoRoll.destroy(); _pianoRoll = null; }
  if (_scoreEditor) { _scoreEditor.destroy(); _scoreEditor = null; }
  if (_audioPlayer) { _audioPlayer.destroy(); _audioPlayer = null; }
  if (_waveform) { _waveform.destroy(); _waveform = null; }
  _stopRecordingWaveform();
  stopNativePlayback();
  cancelAnimationFrame(_midiRaf);
  state.midiPlaying = false;
}

function _renderEditGuideOverlay(isScoreView) {
  const tx = (text) => _uiText(text);
  const commonTopics = [
    {
      title: 'Playback Controls',
      details: [
        '<strong>Space:</strong> toggles play/pause from the current cursor time (it does not reset).',
        '<strong>Arrow Left/Right:</strong> seek the transport by 0.5 seconds.',
        '<strong>Shift + Arrow Left/Right:</strong> seek by 2 seconds for faster navigation.',
        '<strong>Edit mode rule:</strong> if notes are selected, arrows edit notes; clear selection to seek transport.',
      ],
    },
    {
      title: 'Undo / Redo',
      details: [
        '<strong>Cmd/Ctrl + Z:</strong> undo the most recent committed note edit.',
        '<strong>Shift + Cmd/Ctrl + Z:</strong> redo the latest undone edit.',
        '<strong>Ctrl + Y:</strong> alternative redo shortcut.',
        '<strong>History scope:</strong> add, delete, drag, duplicate and keyboard note moves/resizes.',
      ],
    },
    {
      title: 'Multi-select',
      details: [
        '<strong>Cmd/Ctrl + Click:</strong> add or remove notes from selection.',
        '<strong>Drag on empty editor space:</strong> lasso/box select multiple notes at once.',
        '<strong>Cmd/Ctrl + A:</strong> select all editable notes in the current view.',
        '<strong>Delete / Backspace:</strong> remove every selected note at once.',
        '<strong>Cmd/Ctrl + D and arrows:</strong> duplicate or move the full selection together.',
      ],
    },
    {
      title: 'Zoom',
      details: [
        '<strong>X controls:</strong> horizontal zoom out / reset / in.',
        '<strong>Y controls:</strong> vertical zoom out / reset / in.',
        '<strong>Saved per view:</strong> roll uses rollZoomX/rollZoomY and score uses scoreZoomX/scoreZoomY.',
      ],
    },
    {
      title: 'Finger Labels',
      details: [
        '<strong>Finger Labels button:</strong> toggles finger suggestions on editable notes.',
        '<strong>Smart Auto mode:</strong> assigns automatic finger suggestions per hand.',
        '<strong>Manual mode:</strong> fingers appear only when you assign them.',
        '<strong>Click a finger badge:</strong> cycle manual finger override (1 → 5).',
        '<strong>Shift + Click badge:</strong> cycle backward (5 → 1).',
        '<strong>Right click badge:</strong> clear manual override on that note.',
        '<strong>Keys 1..5:</strong> assign that finger to selected note(s), <strong>0:</strong> clear override.',
      ],
    },
  ];

  const modeTopics = isScoreView
    ? [
      {
        title: 'Pitch',
        details: [
          '<strong>Drag note up/down:</strong> moves pitch by staff position.',
          '<strong>Arrow Up/Down:</strong> move selected notes by semitone.',
          '<strong>Shift + Arrow Up/Down:</strong> move by octave.',
        ],
      },
      {
        title: 'Time',
        details: [
          '<strong>Drag note left/right:</strong> moves start time without changing duration.',
          '<strong>Arrow Left/Right:</strong> nudge selected notes in time.',
          '<strong>Shift + Arrow Left/Right:</strong> larger time step.',
        ],
      },
      {
        title: 'Duration',
        details: [
          '<strong>Drag right tail:</strong> change note length.',
          '<strong>[ / ]:</strong> shorten or lengthen selected notes.',
          '<strong>Shift + [ / ]:</strong> larger duration step.',
        ],
      },
      {
        title: 'Add',
        details: [
          '<strong>Double click empty staff space:</strong> creates a note at that pitch and time.',
        ],
      },
      {
        title: 'Delete',
        details: [
          '<strong>Delete / Backspace:</strong> remove selected note(s).',
          '<strong>Right click:</strong> remove hovered note quickly.',
        ],
      },
      {
        title: 'Duplicate',
        details: [
          '<strong>Cmd/Ctrl + D:</strong> copy selected note(s) to the next rhythmic slot.',
        ],
      },
    ]
    : [
      {
        title: 'Pitch',
        details: [
          '<strong>Drag left/right:</strong> changes pitch lane in the roll.',
          '<strong>Arrow Left/Right:</strong> move selected note pitch by semitone.',
          '<strong>Shift + Arrow Left/Right:</strong> move by octave.',
        ],
      },
      {
        title: 'Time',
        details: [
          '<strong>Shift + Drag:</strong> move note in time while keeping pitch fixed.',
          '<strong>Arrow Up/Down:</strong> nudge selected notes in time.',
          '<strong>Shift + Arrow Up/Down:</strong> larger time step.',
        ],
      },
      {
        title: 'Duration',
        details: [
          '<strong>Drag top edge up/down:</strong> resize note duration.',
        ],
      },
      {
        title: 'Add',
        details: [
          '<strong>Double click empty roll space:</strong> create a new note.',
        ],
      },
      {
        title: 'Delete',
        details: [
          '<strong>Delete / Backspace:</strong> remove selected note(s).',
          '<strong>Right click:</strong> remove hovered note quickly.',
        ],
      },
      {
        title: 'Duplicate',
        details: [
          '<strong>Cmd/Ctrl + D:</strong> duplicate selected note(s) forward in time.',
        ],
      },
    ];

  const topics = [...commonTopics, ...modeTopics];
  const viewLabel = isScoreView ? 'Score Editing Guide' : 'Roll Editing Guide';

  return `
    <div class="w-edit-help-overlay">
      <div class="w-edit-help-overlay-head">
        <span class="w-edit-help-overlay-title">${tx(viewLabel)}</span>
        <span class="w-edit-help-overlay-hint">${tx('Hover a title to see full controls')}</span>
      </div>
      <div class="w-edit-help-topics">
        ${topics.map(topic => `
          <div class="w-guide-topic" tabindex="0">
            <span class="w-guide-topic-title">${tx(topic.title)}</span>
            <div class="w-guide-tooltip">
              <p class="w-guide-tooltip-title">${tx(topic.title)}</p>
              ${topic.details.map(detail => `<p>${tx(detail)}</p>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _syncGuideOverlay(content) {
  if (!content) return;
  const wrap = content.querySelector('.w-piano-wrap');
  const body = content.querySelector('#piano-body');
  if (!wrap || !body) return;

  const shouldShow = state.noteEditMode && state.stage === 'ready' && state.noteGuideOpen;
  const existing = wrap.querySelector('.w-edit-help-overlay');

  if (!shouldShow) {
    if (existing) existing.remove();
    return;
  }

  const isScoreView = state.noteEditorView === 'score';
  const overlayHtml = _renderEditGuideOverlay(isScoreView);
  if (existing) {
    existing.outerHTML = overlayHtml;
  } else {
    body.insertAdjacentHTML('beforebegin', overlayHtml);
  }
  applyUiLanguage();
}

function _renderEditHistoryPanel() {
  const items = _editHistoryEntries.slice(0, 24);
  return `
    <div class="w-edit-history-panel">
      <div class="w-edit-history-head">
        <p>${_uiText('Edit History')}</p>
        <span class="w-edit-history-meta">${_uiFormat('Undo {undo} · Redo {redo} · Click to restore', { undo: _notesUndoStack.length, redo: _notesRedoStack.length })}</span>
      </div>
      <div class="w-edit-history-list">
        ${items.length ? items.map(item => `
          <button class="w-edit-history-item" type="button" data-history-restore="${item.id}">
            <div class="w-edit-history-item-head">
              <span class="w-edit-history-type">${_uiText(item.type)}</span>
              <span>${item.stamp}</span>
            </div>
            <p>${_uiText(item.action)}</p>
            <span class="w-edit-history-item-sub">${Array.isArray(item.notes) ? item.notes.length : 0} ${_uiText('notes')}</span>
          </button>
        `).join('') : `<div class="w-edit-history-empty">${_uiText('No edit actions yet.')}</div>`}
      </div>
    </div>
  `;
}

function _syncHistoryOverlay(content) {
  if (!content) return;
  const wrap = content.querySelector('.w-piano-wrap');
  const body = content.querySelector('#piano-body');
  if (!wrap || !body) return;

  const shouldShow = state.noteEditMode && state.stage === 'ready' && state.noteHistoryOpen;
  const existing = wrap.querySelector('.w-edit-history-panel');
  if (!shouldShow) {
    if (existing) existing.remove();
    return;
  }

  const panelHtml = _renderEditHistoryPanel();
  if (existing) {
    existing.outerHTML = panelHtml;
  } else {
    body.insertAdjacentHTML('beforebegin', panelHtml);
  }
  _bindHistoryOverlayActions(content);
  applyUiLanguage();
}

function _renderKeyboardNoteHintsPanel() {
  const noteHints = [];
  COMPUTER_PIANO_KEYS_BY_MIDI.forEach((labels, midi) => {
    noteHints.push({
      midi: Number(midi),
      note: midiToNoteName(midi),
      keys: labels.join(' / '),
    });
  });
  noteHints.sort((a, b) => a.midi - b.midi);

  return `
    <div class="w-keyboard-hints-panel">
      <div class="w-keyboard-hints-head">
        <span class="w-keyboard-hints-title">${_uiText('Computer Keyboard Mapping')}</span>
      </div>
      <div class="w-keyboard-hints-grid">
        ${noteHints.map(item => `
          <div class="w-keyboard-hint-chip">
            <span class="w-keyboard-hint-note">${item.note}</span>
            <span class="w-keyboard-hint-keys">${item.keys}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function _syncKeyboardNoteHintsPanel(content) {
  if (!content) return;
  const wrap = content.querySelector('.w-piano-wrap');
  const body = content.querySelector('#piano-body');
  if (!wrap || !body) return;

  const shouldShow = state.stage === 'ready' && state.keyboardNoteHintsOpen;
  const existing = wrap.querySelector('.w-keyboard-hints-panel');
  if (!shouldShow) {
    if (existing) existing.remove();
    return;
  }

  const panelHtml = _renderKeyboardNoteHintsPanel();
  if (existing) {
    existing.outerHTML = panelHtml;
  } else {
    body.insertAdjacentHTML('beforebegin', panelHtml);
  }
  applyUiLanguage();
}

function renderDashboard(content) {
  destroyInstances();
  _dashboardUiCache = null;
  const aM = state.selectedModel;
  const playbackDuration = getMidiDuration();
  const rollNotes = getNotesForRoll();
  const safeProgress = playbackDuration > 0 ? (state.midiTime / playbackDuration) * 100 : 0;
  const recordingInputMode = normalizeRecordingInputMode(state.recordingInput);
  const canLoadMidiNow = state.stage !== 'processing' && !state.isRecording;
  const sf2Preset = getSf2InstrumentPreset(state.sf2Instrument);
  const sf2OptionsHtml = SF2_INSTRUMENT_IDS.map(id => {
    const preset = getSf2InstrumentPreset(id);
    return `<option value="${preset.id}" ${preset.id === sf2Preset.id ? 'selected' : ''}>${preset.label}</option>`;
  }).join('');
  const hasAudioForTranscription = Boolean(state.audioFile || state.audioEntryId);
  const canConvertNow = hasAudioForTranscription && state.stage !== 'processing' && !state.isRecording;
  const convertLabel = state.stage === 'ready' ? 'Re-convert to MIDI' : 'Convert to MIDI';
  const canEditNotes = state.noteEditMode && state.stage === 'ready';
  const activeEditorView = canEditNotes ? state.noteEditorView : 'roll';
  const isScoreView = activeEditorView === 'score';
  const activeZoomX = isScoreView ? state.scoreZoomX : state.rollZoomX;
  const activeZoomY = isScoreView ? state.scoreZoomY : state.rollZoomY;
  const canUndo = _notesUndoStack.length > 0;
  const canRedo = _notesRedoStack.length > 0;
  const fingerReport = state.fingerSuggestionReport && typeof state.fingerSuggestionReport === 'object'
    ? state.fingerSuggestionReport
    : null;
  const fingerConfidencePct = fingerReport ? Math.round(_clamp01(fingerReport.avgConfidence, 0) * 100) : 0;

  content.innerHTML = `
    <div class="w-dashboard${canEditNotes ? ' editing-focus' : ''}">
      <div class="w-top-grid">

        <!-- Audio Input -->
        <div class="w-panel" id="audio-input-panel">
          <div class="w-panel-header">${ICON.mic(13,'#6b7280')} AUDIO INPUT</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button class="w-rec-btn${state.isRecording?' recording':''}" id="rec-btn" style="position:relative;">
              <span id="rec-icon">${state.isRecording ? ICON.micOff(22,'white') : (recordingInputMode === 'internal' ? ICON.music2(22,'#60a5fa') : ICON.mic(22,'#ef4444'))}</span>
              ${state.isRecording ? '<div class="w-rec-pulse"></div>' : ''}
            </button>
            <div style="flex:1;min-width:0;">
              <p id="rec-label" style="font-size:11px;color:${state.isRecording?'#ef4444':'#6b7280'};margin-bottom:${state.isRecording ? '4px' : '0'};">${state.isRecording ? _uiText('● Recording...') : ''}</p>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span style="font-size:10px;color:#6b7280;">${_uiText('Record Source')}:</span>
                <button class="w-quality-tab ${recordingInputMode === 'mic' ? 'active' : ''}" data-record-source="mic">${_uiText('Ambient Mic')}</button>
                <button class="w-quality-tab ${recordingInputMode === 'internal' ? 'active' : ''}" data-record-source="internal">${_uiText('Internal Piano')}</button>
              </div>
              <button class="w-upload-btn" id="upload-btn">${ICON.upload(12,'#93c5fd')} <span>Upload audio file</span></button>
              <input type="file" id="file-input" accept=".wav,.mp3,.flac,.ogg,.m4a,.webm" style="display:none;">
              <p style="font-size:10px;color:#4b5563;margin-top:6px;">${_uiText('Drag and drop audio here (.wav, .mp3, .flac, .ogg, .m4a, .webm)')}</p>
            </div>
          </div>
          ${state.fileName ? `
            <div class="w-file-badge w-fade-in" style="margin-bottom:12px;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                ${ICON.checkCircle(11,'#10b981')}
                <span style="font-size:11px;color:#6ee7b7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${state.fileName}</span>
              </div>
              <button id="clear-audio-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;border-radius:8px;padding:5px 9px;border:1px solid rgba(239,68,68,0.35);background:rgba(239,68,68,0.14);color:#fecaca;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
                ${ICON.trash(10,'#fecaca')}
                Clear
              </button>
            </div>
          ` : ''}
          ${state.isRecording ? '<div class="w-waveform" id="wf-wrap"></div>' : ''}
          <div id="ap-wrap"></div>
        </div>

        <!-- AI Model -->
        <div class="w-panel">
          <div class="w-panel-header">${ICON.cpu(13,'#6b7280')} AI MODEL</div>
          <div style="position:relative;margin-bottom:12px;">
            <button class="w-model-btn" id="model-btn">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#8b5cf6);">${aM==='transkun'?ICON.cpu(14,'white'):ICON.activity(14,'white')}</div>
                <div style="text-align:left;">
                  <p style="font-size:13px;color:#e5e7eb;font-weight:600;">${aM==='transkun'?'TransKun':'Onsets & Frames'}</p>
                  <p style="font-size:10px;color:#6b7280;">${aM==='transkun'?'Transformer-based model':'Google Magenta model'}</p>
                </div>
              </div>
              <span id="m-chev" style="transition:transform 0.2s;${state.modelDropdownOpen?'transform:rotate(180deg);':''}">${ICON.chevronDown(15,'#6b7280')}</span>
            </button>
            <div id="model-dd" style="display:${state.modelDropdownOpen?'block':'none'};" class="w-model-dropdown">
              ${['transkun','onsets_and_frames'].map(m=>`
                <button class="w-model-opt${state.selectedModel===m?' active':''}" data-model="${m}">
                  <div style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${state.selectedModel===m?'linear-gradient(135deg,#3b82f6,#8b5cf6)':'rgba(255,255,255,0.06)'};">
                    ${m==='transkun'?ICON.cpu(14,'white'):ICON.activity(14,'#9ca3af')}
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:12px;color:#e5e7eb;font-weight:600;">${m==='transkun'?'TransKun':'Onsets & Frames'}</span>
                      ${m==='transkun'?'<span style="font-size:9px;color:#10b981;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);border-radius:4px;padding:1px 6px;font-weight:600;">Recommended</span>':''}
                    </div>
                    <p style="font-size:10px;color:#6b7280;">${m==='transkun'?'Transformer-based model. Balanced performance':'Google Magenta model. Optimal for clean recordings'}</p>
                  </div>
                </button>
              `).join('<div style="height:1px;background:rgba(255,255,255,0.05);"></div>')}
            </div>
          </div>
          <button id="convert-btn" class="w-convert-btn" ${canConvertNow?'':'disabled'} style="background:${canConvertNow?'linear-gradient(135deg,#3b82f6,#8b5cf6)':'rgba(255,255,255,0.04)'};border:${canConvertNow?'none':'1px solid rgba(255,255,255,0.08)'};color:${canConvertNow?'white':'#4b5563'};cursor:${canConvertNow?'pointer':'not-allowed'};opacity:${canConvertNow?1:0.45};box-shadow:${canConvertNow?'0 0 25px rgba(139,92,246,0.45)':'none'};">
            ${ICON.zap(14,canConvertNow?'white':'#4b5563')} ${convertLabel}
          </button>
          <button id="compare-models-btn" ${canConvertNow && !state.compareRunning ? '' : 'disabled'} style="width:100%;border-radius:12px;padding:10px;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;background:${canConvertNow && !state.compareRunning?'rgba(59,130,246,0.14)':'rgba(255,255,255,0.03)'};border:${canConvertNow && !state.compareRunning?'1px solid rgba(59,130,246,0.35)':'1px solid rgba(255,255,255,0.06)'};cursor:${canConvertNow && !state.compareRunning?'pointer':'not-allowed'};opacity:${canConvertNow && !state.compareRunning?1:0.45};">
            ${ICON.activity(13, canConvertNow && !state.compareRunning ? '#93c5fd' : '#4b5563')}
            <span style="font-size:12px;color:${canConvertNow && !state.compareRunning ? '#93c5fd' : '#4b5563'};font-weight:600;">
              ${state.compareRunning ? _uiText('Comparing models…') : _uiText('Compare Both Models')}
            </span>
          </button>
          ${state.compareRunning ? `
            <div id="compare-proc-wrap" style="display:block;margin-top:10px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:11px;color:#93c5fd;" id="compare-proc-lbl">${_uiText('Comparing models…')}</span>
                <span style="font-size:11px;color:#6b7280;" id="compare-proc-pct">${Math.round(Math.max(0, Math.min(100, Number(state.compareProgress) || 0)))}%</span>
              </div>
              <div class="w-progress-bar"><div class="w-progress-fill" id="compare-proc-bar" style="width:${Math.max(0, Math.min(100, Number(state.compareProgress) || 0))}%"></div></div>
            </div>
          ` : ''}
          ${_renderModelComparePanel()}
          ${state.statusMessage ? `
            <div class="w-file-badge w-fade-in" style="margin-top:12px;background:${state.statusType==='error'?'linear-gradient(135deg,rgba(239,68,68,0.14),rgba(239,68,68,0.08))':'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.06))'};border:1px solid ${state.statusType==='error'?'rgba(239,68,68,0.35)':'rgba(16,185,129,0.25)'};">
              ${state.statusType==='error' ? ICON.xCircle(13,'#f87171') : ICON.checkCircle(13,'#10b981')}
              <span style="font-size:11px;color:${state.statusType==='error'?'#fecaca':'#6ee7b7'};">${state.statusMessage}</span>
            </div>` : ''}
          <div id="proc-wrap" style="display:${state.stage==='processing'?'block':'none'};margin-top:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:11px;color:#a78bfa;" id="proc-lbl">${_getProcessingLabel(state.progress)}</span>
              <span style="font-size:11px;color:#6b7280;" id="proc-pct">${Math.round(state.progress)}%</span>
            </div>
            <div class="w-progress-bar"><div class="w-progress-fill" id="proc-bar" style="width:${state.progress}%"></div></div>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px;width:100%;">
              ${['Upload','Transcribe','Build MIDI'].map((s,i)=>`<div class="w-step" style="width:100%;justify-content:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);" data-step="${i}"><div style="width:5px;height:5px;border-radius:50%;background:#374151;"></div><span style="font-size:9px;color:#4b5563;">${s}</span></div>`).join('')}
            </div>
          </div>
          ${state.stage==='ready'?`<div class="w-file-badge w-fade-in" style="margin-top:12px;">${ICON.checkCircle(13,'#10b981')} <span style="font-size:11px;color:#6ee7b7;">MIDI ready.</span></div>`:''}
        </div>

        <!-- MIDI Player -->
        <div class="w-panel" id="midi-player-panel">
          <div class="w-panel-header">${ICON.music2(13,'#6b7280')} MIDI PLAYER</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px;">
            <button class="w-ctrl-btn" id="midi-stop" ${state.stage!=='ready'?'disabled':''}>${ICON.stop(14,'#9ca3af')}</button>
            <button class="w-midi-play" id="midi-play" ${state.stage!=='ready'?'disabled':''} style="background:${state.stage==='ready'?'linear-gradient(135deg,#3b82f6,#8b5cf6)':'rgba(255,255,255,0.05)'};box-shadow:${state.stage==='ready'?`0 0 ${state.midiPlaying?30:15}px rgba(139,92,246,${state.midiPlaying?0.7:0.4})`:'none'};">
              ${state.midiPlaying?ICON.pause(20,'white'):ICON.play(20,'white')}
            </button>
            <button class="w-ctrl-btn" id="demo-midi-btn" title="Load demo MIDI" style="width:auto;padding:0 10px;border-radius:12px;display:flex;gap:6px;">
              ${ICON.music2(14,'#9ca3af')}
              <span style="font-size:11px;color:#9ca3af;">Demo</span>
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <button
                id="upload-midi-btn"
                ${canLoadMidiNow ? '' : 'disabled'}
                style="display:inline-flex;align-items:center;gap:6px;border-radius:10px;padding:7px 10px;border:1px solid rgba(59,130,246,0.35);background:${canLoadMidiNow ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)'};color:${canLoadMidiNow ? '#93c5fd' : '#4b5563'};font-size:11px;font-weight:600;cursor:${canLoadMidiNow ? 'pointer' : 'not-allowed'};opacity:${canLoadMidiNow ? 1 : 0.55};"
              >
                ${ICON.upload(11, canLoadMidiNow ? '#93c5fd' : '#4b5563')}
                <span>Upload MIDI file</span>
              </button>
              <input type="file" id="midi-file-input" accept=".mid,.midi,audio/midi,audio/x-midi,application/x-midi" style="display:none;">
            </div>
            <div style="display:flex;align-items:center;gap:8px;min-width:min(220px,100%);justify-content:flex-end;">
              <span style="font-size:10px;color:#6b7280;">Instrument</span>
              <select id="sf2-instrument-select" class="w-select" style="min-width:190px;max-width:220px;" ${state.preferSf2Playback ? '' : 'disabled'}>
                ${sf2OptionsHtml}
              </select>
            </div>
          </div>
          <p style="font-size:10px;color:#4b5563;margin:-4px 0 10px;">${_uiText('Drag and drop a MIDI file here (.mid, .midi)')}</p>
          ${state.midiSourceName ? `
            <p style="font-size:10px;color:#6b7280;margin:0 0 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              MIDI Source: ${state.midiSourceName}
            </p>
          ` : ''}
          <div style="margin-bottom:12px;">
            <input type="range" class="w-seek" id="midi-seek" min="0" max="${playbackDuration}" step="0.05" value="${state.midiTime}" ${state.stage!=='ready'?'disabled':''} style="background:linear-gradient(to right,#8b5cf6 ${safeProgress}%,rgba(255,255,255,0.1) ${safeProgress}%);">
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
              <span style="font-size:10px;color:#6b7280;" id="midi-cur">${fmtTime(state.midiTime)}</span>
              <span style="font-size:10px;color:#6b7280;">${fmtTime(playbackDuration)}</span>
            </div>
          </div>
          ${state.stage === 'ready' ? `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
              <div class="w-stat-box"><div style="color:#6b7280;margin-bottom:2px;">${ICON.music2(11,'#6b7280')}</div><p style="font-size:12px;color:#e5e7eb;font-weight:600;">${rollNotes.length}</p><p style="font-size:9px;color:#4b5563;">Notes</p></div>
              <div class="w-stat-box"><div style="color:#6b7280;margin-bottom:2px;">${ICON.clock(11,'#6b7280')}</div><p style="font-size:12px;color:#e5e7eb;font-weight:600;">${fmtTime(playbackDuration)}</p><p style="font-size:9px;color:#4b5563;">Duration</p></div>
              <div class="w-stat-box"><div style="color:#6b7280;margin-bottom:2px;">${ICON.activity(11,'#6b7280')}</div><p style="font-size:12px;color:#e5e7eb;font-weight:600;">${state.midiTempo ? `${Math.round(state.midiTempo)} BPM` : '—'}</p><p style="font-size:9px;color:#4b5563;">Tempo</p></div>
            </div>
          ` : `
            <div class="w-stat-box" style="margin-bottom:12px;">
              <p style="font-size:12px;color:#9ca3af;font-weight:600;">No MIDI yet</p>
              <p style="font-size:10px;color:#4b5563;margin-top:3px;">Upload or record audio, then convert.</p>
            </div>
          `}
          <button id="export-btn" ${state.stage!=='ready'?'disabled':''} style="width:100%;border-radius:12px;padding:10px;display:flex;align-items:center;justify-content:center;gap:8px;background:${state.stage==='ready'?'rgba(59,130,246,0.12)':'rgba(255,255,255,0.03)'};border:${state.stage==='ready'?'1px solid rgba(59,130,246,0.35)':'1px solid rgba(255,255,255,0.06)'};cursor:${state.stage==='ready'?'pointer':'not-allowed'};opacity:${state.stage==='ready'?1:0.35};transition:all 0.3s;">
            ${ICON.download(13,state.stage==='ready'?'#93c5fd':'#4b5563')} <span style="font-size:12px;color:${state.stage==='ready'?'#93c5fd':'#4b5563'};font-weight:500;">Export .mid file</span>
          </button>
        </div>
      </div>

      <!-- Note Editor -->
      <div class="w-piano-wrap${state.noteEditMode ? ' edit-mode' : ''}">
        <div class="w-piano-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:3px;height:14px;border-radius:2px;background:linear-gradient(180deg,#3b82f6,#8b5cf6);"></div>
            <span style="font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;">${isScoreView ? _uiText('MUSIC SCORE') : _uiText('PIANO ROLL')}</span>
            <span style="font-size:9px;color:#6b7280;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:2px 6px;">${isScoreView ? _uiText('GRAND STAFF · EDITABLE') : _uiText('88 KEYS · SYNTHESIA VIEW')}</span>
          </div>
          <div class="w-piano-meta">
            ${canEditNotes ? `
              <div class="w-note-view-switch">
                <button class="w-note-view-btn ${!isScoreView ? 'active' : ''}" data-note-view="roll">${_uiText('Roll')}</button>
                <button class="w-note-view-btn ${isScoreView ? 'active' : ''}" data-note-view="score">${_uiText('Score')}</button>
              </div>
            ` : ''}
            <button
              id="note-edit-toggle"
              class="w-note-edit-btn ${state.noteEditMode ? 'active' : ''}"
              ${state.stage!=='ready' ? 'disabled' : ''}
            >
              ${state.noteEditMode ? _uiText('Editing On') : _uiText('Edit Notes')}
            </button>
            <button
              id="keyboard-note-hints-toggle"
              class="w-note-guide-btn ${state.keyboardNoteHintsOpen ? 'active' : ''}"
              ${state.stage!=='ready' ? 'disabled' : ''}
            >
              ${state.keyboardNoteHintsOpen ? _uiText('Hide Keyboard Notes') : _uiText('Keyboard Notes')}
            </button>
            <button
              id="finger-suggest-toggle"
              class="w-finger-suggest-btn ${state.fingerSuggestionMode ? 'active' : ''}"
              ${state.stage!=='ready' ? 'disabled' : ''}
            >
              ${state.fingerSuggestionMode ? _uiText('Finger Labels On') : _uiText('Finger Labels')}
            </button>
            ${canEditNotes && isScoreView ? `
              <button class="w-score-readable-btn ${state.scoreReadableMode ? 'active' : ''}" id="score-readable-toggle">
                ${_uiText('Readable Score')}
              </button>
            ` : ''}
            ${canEditNotes ? `
              <button class="w-note-guide-btn ${state.noteGuideOpen ? 'active' : ''}" id="guide-toggle">
                ${state.noteGuideOpen ? _uiText('Hide Guide') : _uiText('Show Guide')}
              </button>
            ` : ''}
            <div id="piano-status">
              ${state.midiPlaying
                ? `<div class="w-live-badge"><div class="w-live-dot"></div><span style="font-size:10px;color:#6ee7b7;">LIVE</span></div>`
                : `${state.noteEditMode && state.stage==='ready'
                  ? `<div class="w-edit-pill"><div class="w-edit-pill-dot"></div><span style="font-size:10px;color:#ddd6fe;font-weight:600;">${_uiText('Edit Mode Active')}</span></div>`
                  : `<span style="font-size:10px;color:#4b5563;">${state.stage==='ready' ? _uiText('Ready · Press play') : _uiText('Waiting for MIDI')}</span>`}`}
            </div>
          </div>
        </div>
        ${state.noteEditMode && state.stage === 'ready' ? `
          <div class="w-edit-tools">
            <button class="w-edit-tool-btn" id="edit-undo" ${canUndo ? '' : 'disabled'}>${_uiText('Undo')}</button>
            <button class="w-edit-tool-btn" id="edit-redo" ${canRedo ? '' : 'disabled'}>${_uiText('Redo')}</button>
            <button class="w-edit-tool-btn ${state.noteHistoryOpen ? 'active' : ''}" id="history-toggle">${state.noteHistoryOpen ? _uiText('Hide History') : _uiText('History')}</button>
            ${state.fingerSuggestionMode ? `
              <div class="w-finger-level-switch">
                <button class="w-finger-level-btn ${state.fingerSuggestionAlgorithm === 'legacy' ? 'active' : ''}" data-finger-algo="legacy">${_uiText('Smart Auto')}</button>
                <button class="w-finger-level-btn ${state.fingerSuggestionAlgorithm === 'manual' ? 'active' : ''}" data-finger-algo="manual">${_uiText('Manual Only')}</button>
              </div>
              <div class="w-finger-quick">
                <span class="w-edit-zoom-label">${_uiText('Finger')}</span>
                <button class="w-edit-tool-btn" data-finger-set="1">1</button>
                <button class="w-edit-tool-btn" data-finger-set="2">2</button>
                <button class="w-edit-tool-btn" data-finger-set="3">3</button>
                <button class="w-edit-tool-btn" data-finger-set="4">4</button>
                <button class="w-edit-tool-btn" data-finger-set="5">5</button>
                <button class="w-edit-tool-btn" data-finger-set="0">${_uiText('Clear')}</button>
              </div>
            ` : ''}
            <div class="w-edit-zoom">
              <span class="w-edit-zoom-label">X</span>
              <button class="w-edit-tool-btn" id="zoom-x-out">-</button>
              <button class="w-edit-tool-btn" id="zoom-x-reset">${activeZoomX.toFixed(2)}x</button>
              <button class="w-edit-tool-btn" id="zoom-x-in">+</button>
            </div>
            <div class="w-edit-zoom">
              <span class="w-edit-zoom-label">Y</span>
              <button class="w-edit-tool-btn" id="zoom-y-out">-</button>
              <button class="w-edit-tool-btn" id="zoom-y-reset">${activeZoomY.toFixed(2)}x</button>
              <button class="w-edit-tool-btn" id="zoom-y-in">+</button>
            </div>
          </div>
        ` : ''}
        ${state.noteEditMode && state.stage === 'ready' && state.noteGuideOpen ? _renderEditGuideOverlay(isScoreView) : ''}
        ${state.noteEditMode && state.stage === 'ready' && state.noteHistoryOpen ? _renderEditHistoryPanel() : ''}
        <div class="w-piano-body" id="piano-body"></div>
        ${isScoreView ? `
          <div class="w-score-disclaimer">
            <strong>${_uiText('Score disclaimer:')}</strong> ${_uiText('this is not a professional engraving score. It is designed only for interactive note editing.')}
          </div>
        ` : ''}
      </div>
    </div>`;

  // Init canvas instances
  const wfWrap = content.querySelector('#wf-wrap');
  if (wfWrap) _waveform = new Waveform(wfWrap);

  const pianoBody = content.querySelector('#piano-body');
  if (pianoBody) {
    const editorOptions = {
      editMode: state.noteEditMode && state.stage === 'ready',
      zoomX: isScoreView ? state.scoreZoomX : state.rollZoomX,
      zoomY: isScoreView ? state.scoreZoomY : state.rollZoomY,
      onUndoRequest: () => _undoNoteEdit(content),
      onRedoRequest: () => _redoNoteEdit(content),
      onNotesChange: notes => {
        if (state.stage === 'ready') state.midiNotes = notes;
      },
      onEditCommit: (notes, meta = null) => {
        const action = meta && typeof meta.action === 'string' ? meta.action : 'Edit notes';
        _applyEditorNotesCommit(content, notes, action);
      },
      onFingerSuggestionUpdate: (report) => {
        state.fingerSuggestionReport = report && typeof report === 'object' ? report : null;
        _syncFingerConfidencePill(content, state.fingerSuggestionReport);
      },
      readableMode: state.scoreReadableMode,
      fingerSuggestionMode: state.fingerSuggestionMode && state.stage === 'ready',
      fingerSuggestionLevel: state.fingerSuggestionLevel,
      fingerSuggestionAlgorithm: state.fingerSuggestionAlgorithm,
      showComputerKeyHints: state.keyboardNoteHintsOpen && state.stage === 'ready',
    };

    if (isScoreView) {
      _scoreEditor = new ScoreEditor(pianoBody, rollNotes, editorOptions);
      _scoreEditor.setTime(state.midiTime);
      _scoreEditor.setPlaying(state.midiPlaying);
      _scoreEditor.setZoom(state.scoreZoomX, state.scoreZoomY);
      _scoreEditor.setReadableMode(state.scoreReadableMode);
      _scoreEditor.setFingerSuggestions(
        state.fingerSuggestionMode && state.stage === 'ready',
        state.fingerSuggestionLevel,
        state.fingerSuggestionAlgorithm
      );
      _scoreEditor.setEditMode(state.noteEditMode && state.stage === 'ready');
    } else {
      _pianoRoll = new PianoRoll(pianoBody, rollNotes, editorOptions);
      _pianoRoll.setTime(state.midiTime);
      _pianoRoll.setPlaying(state.midiPlaying);
      _pianoRoll.setZoom(state.rollZoomX, state.rollZoomY);
      _pianoRoll.setFingerSuggestions(
        state.fingerSuggestionMode && state.stage === 'ready',
        state.fingerSuggestionLevel,
        state.fingerSuggestionAlgorithm
      );
      _pianoRoll.setEditMode(state.noteEditMode && state.stage === 'ready');
    }
  }

  _syncFingerConfidencePill(content, state.fingerSuggestionReport);

  if (state.audioUrl && state.fileName) {
    const apWrap = content.querySelector('#ap-wrap');
    if (apWrap) _audioPlayer = new AudioPlayerWidget(apWrap, state.audioUrl, state.fileName);
  }

  // Bind events
  content.querySelector('#rec-btn').addEventListener('click', _handleRecord);
  content.querySelectorAll('[data-record-source]').forEach(button => {
    button.addEventListener('click', () => {
      if (state.isRecording) return;
      const nextMode = normalizeRecordingInputMode(button.dataset.recordSource);
      if (nextMode === state.recordingInput) return;
      state.recordingInput = nextMode;
      persistAppSettings();
      setStatusMessage(
        nextMode === 'internal'
          ? _uiText('Recording source switched to Internal Piano.')
          : _uiText('Recording source switched to Ambient Mic.'),
        'success'
      );
      renderDashboard(content);
    });
  });
  content.querySelector('#upload-btn').addEventListener('click', () => content.querySelector('#file-input').click());
  content.querySelector('#file-input').addEventListener('change', _handleUpload);
  content.querySelector('#clear-audio-btn')?.addEventListener('click', () => _clearLoadedAudio(content));
  const audioDropPanel = content.querySelector('#audio-input-panel');
  if (audioDropPanel) {
    let dragDepth = 0;
    const enter = e => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth += 1;
      audioDropPanel.classList.add('drag-active');
    };
    const over = e => {
      e.preventDefault();
      e.stopPropagation();
      if (!audioDropPanel.classList.contains('drag-active')) {
        audioDropPanel.classList.add('drag-active');
      }
    };
    const leave = e => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        audioDropPanel.classList.remove('drag-active');
      }
    };
    const drop = async e => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth = 0;
      audioDropPanel.classList.remove('drag-active');
      const droppedFile = e.dataTransfer?.files?.[0];
      if (!droppedFile) return;
      const isMidiDrop = /\.midi?$/i.test(droppedFile.name || '') || /midi/i.test(droppedFile.type || '');
      if (isMidiDrop) {
        setStatusMessage(_uiText('Use the MIDI Player upload button for .mid/.midi files.'), 'error');
        renderDashboard(content);
        return;
      }
      await _loadAudioFileFromUserInput(droppedFile, content);
    };
    audioDropPanel.addEventListener('dragenter', enter);
    audioDropPanel.addEventListener('dragover', over);
    audioDropPanel.addEventListener('dragleave', leave);
    audioDropPanel.addEventListener('drop', drop);
  }

  const modelBtn = content.querySelector('#model-btn');
  modelBtn.addEventListener('click', () => {
    state.modelDropdownOpen = !state.modelDropdownOpen;
    const dd = content.querySelector('#model-dd'), chev = content.querySelector('#m-chev');
    if (dd) dd.style.display = state.modelDropdownOpen ? 'block' : 'none';
    if (chev) chev.style.transform = state.modelDropdownOpen ? 'rotate(180deg)' : '';
  });
  content.querySelectorAll('.w-model-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextModel = btn.dataset.model;
      state.selectedModel = nextModel;
      persistAppSettings();
      state.modelDropdownOpen = false;
      if (state.stage === 'ready' && (state.audioFile || state.audioEntryId)) {
        const modelLabel = nextModel === 'onsets_and_frames' ? 'Onsets & Frames' : 'TransKun';
        setStatusMessage(
          _tk('status.model_switched', { model: modelLabel }, `Model switched to ${modelLabel}. Press Convert to re-transcribe the same audio.`),
          'success'
        );
      }
      renderDashboard(content);
    });
  });

  content.querySelector('#convert-btn').addEventListener('click', _handleConvert.bind(null, content));
  content.querySelector('#compare-models-btn')?.addEventListener('click', () => _handleCompareModels(content));
  content.querySelector('#midi-play').addEventListener('click', () => _midiPlayPause(content));
  content.querySelector('#midi-stop').addEventListener('click', () => _midiStop(content));
  content.querySelector('#demo-midi-btn').addEventListener('click', () => _loadDemoMidi(content));
  content.querySelector('#upload-midi-btn')?.addEventListener('click', () => {
    if (!canLoadMidiNow) return;
    content.querySelector('#midi-file-input')?.click();
  });
  content.querySelector('#midi-file-input')?.addEventListener('change', _handleMidiUpload);
  const midiDropPanel = content.querySelector('#midi-player-panel');
  if (midiDropPanel) {
    let midiDragDepth = 0;
    const enter = e => {
      e.preventDefault();
      e.stopPropagation();
      if (!canLoadMidiNow) return;
      midiDragDepth += 1;
      midiDropPanel.classList.add('drag-active');
    };
    const over = e => {
      e.preventDefault();
      e.stopPropagation();
      if (!canLoadMidiNow) return;
      if (!midiDropPanel.classList.contains('drag-active')) {
        midiDropPanel.classList.add('drag-active');
      }
    };
    const leave = e => {
      e.preventDefault();
      e.stopPropagation();
      midiDragDepth = Math.max(0, midiDragDepth - 1);
      if (midiDragDepth === 0) {
        midiDropPanel.classList.remove('drag-active');
      }
    };
    const drop = async e => {
      e.preventDefault();
      e.stopPropagation();
      midiDragDepth = 0;
      midiDropPanel.classList.remove('drag-active');
      const droppedFile = e.dataTransfer?.files?.[0];
      if (!droppedFile) return;
      if (!canLoadMidiNow) {
        setStatusMessage(_uiText('Stop recording or wait for processing before loading a MIDI file.'), 'error');
        renderDashboard(content);
        return;
      }
      await _loadMidiFileFromUserInput(droppedFile, content);
    };
    midiDropPanel.addEventListener('dragenter', enter);
    midiDropPanel.addEventListener('dragover', over);
    midiDropPanel.addEventListener('dragleave', leave);
    midiDropPanel.addEventListener('drop', drop);
  }
  content.querySelector('#sf2-instrument-select')?.addEventListener('change', async e => {
    const nextInstrument = normalizeSf2Instrument(e.target?.value);
    if (nextInstrument === state.sf2Instrument) return;
    state.sf2Instrument = nextInstrument;
    persistAppSettings();
    stopNativePlayback();
    disposeSf2Synth();
    _sf2UnavailableReason = '';
    if (state.preferSf2Playback) {
      try { await ensureSf2SynthReady(); } catch (_) {}
    }
    setStatusMessage(
      _uiFormat('Playback instrument set to {instrument}.', { instrument: getSf2InstrumentPreset(nextInstrument).label }),
      'success'
    );
    renderDashboard(content);
  });
  content.querySelector('#export-btn').addEventListener('click', _downloadMidi);
  content.querySelectorAll('[data-note-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!canEditNotes) return;
      const next = btn.dataset.noteView;
      if (next !== 'roll' && next !== 'score') return;
      if (state.noteEditorView === next) return;
      state.noteEditorView = next;
      setStatusMessage(
        next === 'score'
          ? _tk('status.score_view_enabled', {}, 'Score view enabled. You can edit notes directly on the staff.')
          : _tk('status.roll_view_enabled', {}, 'Piano roll view enabled.'),
        'success'
      );
      renderDashboard(content);
    });
  });
  content.querySelector('#note-edit-toggle')?.addEventListener('click', () => {
    if (state.stage !== 'ready') return;
    state.noteEditMode = !state.noteEditMode;
    setStatusMessage(
      state.noteEditMode
        ? _tk('status.edit_mode_enabled', {}, 'Edit mode enabled. Use the visual guide for roll and score shortcuts.')
        : _tk('status.edit_mode_disabled', {}, 'Edit mode disabled.'),
      'success'
    );
    renderDashboard(content);
  });
  content.querySelector('#keyboard-note-hints-toggle')?.addEventListener('click', () => {
    if (state.stage !== 'ready') return;
    state.keyboardNoteHintsOpen = !state.keyboardNoteHintsOpen;
    if (_pianoRoll && typeof _pianoRoll.setComputerKeyHintsVisibility === 'function') {
      _pianoRoll.setComputerKeyHintsVisibility(state.keyboardNoteHintsOpen);
    }
    _syncEditToolbar(content);
  });
  content.querySelector('#finger-suggest-toggle')?.addEventListener('click', () => {
    if (state.stage !== 'ready') return;
    state.fingerSuggestionMode = !state.fingerSuggestionMode;
    if (!state.fingerSuggestionMode) state.fingerSuggestionReport = null;
    setStatusMessage(
      state.fingerSuggestionMode
        ? (state.fingerSuggestionAlgorithm === 'legacy'
          ? _tk('status.finger_suggestions_enabled_smart', {}, 'Finger suggestions enabled (smart auto algorithm).')
          : _tk('status.finger_labels_enabled_manual', {}, 'Finger labels enabled in manual mode.'))
        : _tk('status.finger_labels_disabled', {}, 'Finger labels disabled.'),
      'success'
    );
    renderDashboard(content);
  });
  content.querySelectorAll('[data-finger-set]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.noteEditMode || !state.fingerSuggestionMode || state.midiPlaying) return;
      const finger = normalizeFingerOverride(btn.dataset.fingerSet);
      const editor = state.noteEditorView === 'score' ? _scoreEditor : _pianoRoll;
      if (!editor || typeof editor.applyFingerOverrideToSelection !== 'function') return;
      editor.applyFingerOverrideToSelection(finger);
    });
  });
  content.querySelectorAll('[data-finger-algo]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.stage !== 'ready') return;
      const nextAlgorithm = normalizeFingerSuggestionAlgorithm(btn.dataset.fingerAlgo);
      if (nextAlgorithm === state.fingerSuggestionAlgorithm) return;
      state.fingerSuggestionAlgorithm = nextAlgorithm;
      persistAppSettings();
      setStatusMessage(
        nextAlgorithm === 'legacy'
          ? _tk('status.smart_finger_enabled', {}, 'Smart finger suggestion enabled.')
          : _tk('status.manual_fingering_enabled', {}, 'Manual fingering mode enabled.'),
        'success'
      );
      renderDashboard(content);
    });
  });
  content.querySelectorAll('[data-compare-use]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await _useCompareResult(content, btn.dataset.compareUse);
    });
  });
  content.querySelectorAll('[data-compare-download]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ok = _downloadCompareResult(btn.dataset.compareDownload);
      if (!ok) renderDashboard(content);
    });
  });
  content.querySelectorAll('[data-compare-retry]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const audioFile = await resolveAudioForTranscription();
      const modelId = normalizeModelId(btn.dataset.compareRetry);
      if (!audioFile || !modelId) return;
      state.compareRunning = true;
      state.compareProgress = 3;
      renderDashboard(content);
      _setCompareProgress(content, 8, _tk('status.comparing_model', { model: _getModelDisplayName(modelId) }, `Comparing: ${_getModelDisplayName(modelId)}…`));
      let compareTimer = null;
      const startedAt = Date.now();
      const estimatedMs = _estimateCompareMs(audioFile, modelId);
      compareTimer = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const target = easingProgress(elapsed, estimatedMs, 8, 92);
        _setCompareProgress(content, target, _tk('status.comparing_model', { model: _getModelDisplayName(modelId) }, `Comparing: ${_getModelDisplayName(modelId)}…`));
      }, 320);
      const result = await _runSingleModelForCompare(audioFile, modelId);
      if (compareTimer) clearInterval(compareTimer);
      if (!state.compareResults) {
        state.compareResults = { createdAt: new Date().toISOString(), fileName: audioFile.name || 'input.wav', results: {} };
      }
      state.compareResults.results[modelId] = result;
      state.compareProgress = 100;
      state.compareRunning = false;
      setStatusMessage(
        result.status === 'completed'
          ? _tk('status.compare_model_completed', { model: _getModelDisplayName(modelId) }, `${_getModelDisplayName(modelId)} comparison completed.`)
          : _tk('status.compare_model_failed', { model: _getModelDisplayName(modelId) }, `${_getModelDisplayName(modelId)} comparison failed.`),
        result.status === 'completed' ? 'success' : 'error'
      );
      renderDashboard(content);
    });
  });

  const updateEditorZoom = (axis, action) => {
    if (state.midiPlaying) return;
    const key = isScoreView
      ? (axis === 'x' ? 'scoreZoomX' : 'scoreZoomY')
      : (axis === 'x' ? 'rollZoomX' : 'rollZoomY');
    const step = axis === 'x' ? 0.14 : 0.12;
    let next = Number(state[key]) || 1;
    if (action === 'in') next += step;
    else if (action === 'out') next -= step;
    else next = 1;
    next = Math.max(0.6, Math.min(2.4, Math.round(next * 100) / 100));
    state[key] = next;
    if (isScoreView && _scoreEditor) _scoreEditor.setZoom(state.scoreZoomX, state.scoreZoomY);
    if (!isScoreView && _pianoRoll) _pianoRoll.setZoom(state.rollZoomX, state.rollZoomY);
    _syncEditToolbar(content);
  };

  content.querySelector('#edit-undo')?.addEventListener('click', () => {
    if (state.midiPlaying) return;
    _undoNoteEdit(content);
    _syncEditToolbar(content);
  });
  content.querySelector('#edit-redo')?.addEventListener('click', () => {
    if (state.midiPlaying) return;
    _redoNoteEdit(content);
    _syncEditToolbar(content);
  });
  content.querySelector('#guide-toggle')?.addEventListener('click', () => {
    state.noteGuideOpen = !state.noteGuideOpen;
    persistGuideOpen(state.noteGuideOpen);
    _syncEditToolbar(content);
    _syncGuideOverlay(content);
  });
  content.querySelector('#history-toggle')?.addEventListener('click', () => {
    state.noteHistoryOpen = !state.noteHistoryOpen;
    _syncEditToolbar(content);
    _syncHistoryOverlay(content);
  });
  content.querySelector('#score-readable-toggle')?.addEventListener('click', () => {
    state.scoreReadableMode = !state.scoreReadableMode;
    if (_scoreEditor) _scoreEditor.setReadableMode(state.scoreReadableMode);
    _syncEditToolbar(content);
  });
  content.querySelector('#zoom-x-in')?.addEventListener('click', () => updateEditorZoom('x', 'in'));
  content.querySelector('#zoom-x-out')?.addEventListener('click', () => updateEditorZoom('x', 'out'));
  content.querySelector('#zoom-x-reset')?.addEventListener('click', () => updateEditorZoom('x', 'reset'));
  content.querySelector('#zoom-y-in')?.addEventListener('click', () => updateEditorZoom('y', 'in'));
  content.querySelector('#zoom-y-out')?.addEventListener('click', () => updateEditorZoom('y', 'out'));
  content.querySelector('#zoom-y-reset')?.addEventListener('click', () => updateEditorZoom('y', 'reset'));

  content.querySelector('#midi-seek').addEventListener('input', e => {
    state.midiTime = parseFloat(e.target.value);
    if (_pianoRoll) _pianoRoll.setTime(state.midiTime);
    if (_scoreEditor) _scoreEditor.setTime(state.midiTime);
    if (state.midiPlaying) {
      scheduleNativePlayback(state.midiTime);
    }
    _updateSeek(content);
  });
  _syncEditToolbar(content);
  applyUiLanguage();
}

function _updateSeek(content) {
  if (
    !_dashboardUiCache ||
    _dashboardUiCache.content !== content ||
    !_dashboardUiCache.seek?.isConnected ||
    !_dashboardUiCache.cur?.isConnected ||
    !_dashboardUiCache.ps?.isConnected
  ) {
    _dashboardUiCache = {
      content,
      seek: content.querySelector('#midi-seek'),
      cur: content.querySelector('#midi-cur'),
      ps: content.querySelector('#piano-status'),
      statusKey: '',
    };
  }

  const { seek, cur, ps } = _dashboardUiCache;
  const duration = getMidiDuration();
  if (seek) {
    if (Math.abs((Number(seek.max) || 0) - duration) > 0.0001) seek.max = duration;
    seek.value = state.midiTime;
    const p = duration > 0 ? (state.midiTime / duration) * 100 : 0;
    const prevP = Number(seek.dataset.pct || '-1');
    if (!Number.isFinite(prevP) || Math.abs(prevP - p) >= 0.3 || !state.midiPlaying) {
      seek.style.background = `linear-gradient(to right,#8b5cf6 ${p}%,rgba(255,255,255,0.1) ${p}%)`;
      seek.dataset.pct = p.toFixed(2);
    }
  }
  if (cur) {
    const nextTimeText = fmtTime(state.midiTime);
    if (cur.textContent !== nextTimeText) cur.textContent = nextTimeText;
  }
  if (ps) {
    let statusKey = 'idle';
    if (state.midiPlaying) statusKey = 'live';
    else if (state.noteEditMode && state.stage === 'ready') statusKey = 'edit';
    else if (state.stage !== 'ready') statusKey = 'waiting';

    if (_dashboardUiCache.statusKey !== statusKey) {
      _dashboardUiCache.statusKey = statusKey;
      if (statusKey === 'live') {
        ps.innerHTML = `<div class="w-live-badge"><div class="w-live-dot"></div><span style="font-size:10px;color:#6ee7b7;">LIVE</span></div>`;
      } else if (statusKey === 'edit') {
        ps.innerHTML = `<div class="w-edit-pill"><div class="w-edit-pill-dot"></div><span style="font-size:10px;color:#ddd6fe;font-weight:600;">${_uiText('Edit Mode Active')}</span></div>`;
      } else {
        ps.innerHTML = `<span style="font-size:10px;color:#4b5563;">${state.stage==='ready' ? _uiText('Ready · Press play') : _uiText('Waiting for MIDI')}</span>`;
      }
    }
  }
  if (_pianoRoll) {
    _pianoRoll.setTime(state.midiTime);
    _pianoRoll.setPlaying(state.midiPlaying);
    _pianoRoll.setEditMode(state.noteEditMode && state.stage === 'ready');
  }
  if (_scoreEditor) {
    _scoreEditor.setTime(state.midiTime);
    _scoreEditor.setPlaying(state.midiPlaying);
    _scoreEditor.setEditMode(state.noteEditMode && state.stage === 'ready');
  }
}

function _nudgeTransport(content, deltaSec) {
  if (!content || state.stage !== 'ready') return;
  const duration = getMidiDuration();
  const next = Math.max(0, Math.min(duration, (Number(state.midiTime) || 0) + deltaSec));
  if (Math.abs(next - (Number(state.midiTime) || 0)) <= 0.0001) return;
  state.midiTime = next;
  if (state.midiPlaying) {
    scheduleNativePlayback(state.midiTime);
  }
  _updateSeek(content);
}

function _isTextEditingElement(element) {
  if (!element) return false;
  if (element.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}

function _syncKeyboardPianoVisuals() {
  if (!_pianoRoll || !_pianoRoll.pressedKeys || typeof _pianoRoll.pressedKeys.clear !== 'function') return;
  _pianoRoll.pressedKeys.clear();
  _keyboardPianoPressedKeys.forEach(key => {
    const midi = COMPUTER_PIANO_KEY_MAP[key];
    if (Number.isFinite(midi)) _pianoRoll.pressedKeys.add(midi);
  });
}

function _releaseComputerKeyboardPiano() {
  _keyboardPianoPressedKeys.clear();
  _syncKeyboardPianoVisuals();
}

function _handleComputerKeyboardPianoKeyDown(e) {
  if (state.page !== 'dashboard') return false;
  if (state.noteEditMode || state.midiPlaying || state.stage === 'processing') return false;
  if (e.metaKey || e.ctrlKey || e.altKey) return false;

  const key = String(e.key || '').toLowerCase();
  const midi = COMPUTER_PIANO_KEY_MAP[key];
  if (!Number.isFinite(midi)) return false;

  e.preventDefault();
  if (e.repeat || _keyboardPianoPressedKeys.has(key)) return true;
  _keyboardPianoPressedKeys.add(key);
  _syncKeyboardPianoVisuals();
  playPreviewNote(midi, 0.65, 0.92).catch(error => {
    console.error('Computer keyboard preview error:', error);
  });
  return true;
}

function _handleComputerKeyboardPianoKeyUp(e) {
  if (state.page !== 'dashboard') return false;
  const key = String(e.key || '').toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(COMPUTER_PIANO_KEY_MAP, key)) return false;
  if (_keyboardPianoPressedKeys.delete(key)) {
    _syncKeyboardPianoVisuals();
  }
  return true;
}

function _handleTransportShortcuts(e) {
  if (state.page !== 'dashboard') return;
  const active = document.activeElement;
  if (_isTextEditingElement(active)) return;

  if (_handleComputerKeyboardPianoKeyDown(e)) return;

  const content = document.getElementById('w-content');
  if (!content) return;

  if (e.code === 'Space') {
    if (state.stage !== 'ready') return;
    e.preventDefault();
    _midiPlayPause(content);
    return;
  }

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    if (state.stage !== 'ready') return;
    if (state.noteEditMode) {
      const activeEditor = state.noteEditorView === 'score' ? _scoreEditor : _pianoRoll;
      const hasSelection = activeEditor && typeof activeEditor.getSelectionTimeRange === 'function'
        ? Boolean(activeEditor.getSelectionTimeRange())
        : false;
      if (hasSelection) return;
    }
    e.preventDefault();
    const baseStep = e.shiftKey ? 2 : 0.5;
    _nudgeTransport(content, e.key === 'ArrowRight' ? baseStep : -baseStep);
  }
}

function _handleTransportShortcutsKeyUp(e) {
  _handleComputerKeyboardPianoKeyUp(e);
}

function bindTransportShortcuts() {
  if (_transportKeysBound) return;
  _transportKeysBound = true;
  window.addEventListener('keydown', _handleTransportShortcuts);
  window.addEventListener('keyup', _handleTransportShortcutsKeyUp);
  window.addEventListener('blur', _releaseComputerKeyboardPiano);
}

function unbindTransportShortcuts() {
  if (!_transportKeysBound) return;
  _transportKeysBound = false;
  window.removeEventListener('keydown', _handleTransportShortcuts);
  window.removeEventListener('keyup', _handleTransportShortcutsKeyUp);
  window.removeEventListener('blur', _releaseComputerKeyboardPiano);
  _releaseComputerKeyboardPiano();
}

function _midiTick(content) {
  if (!state.midiPlaying) return;
  const t = _nativeStartOffset + ((performance.now() - _nativeStartPerf) / 1000);
  const duration = getMidiDuration();
  if (t >= duration) {
    _midiStop(content);
    return;
  }
  state.midiTime = t;
  _updateSeek(content);
  _midiRaf = requestAnimationFrame(() => _midiTick(content));
}

async function _midiPlayPause(content) {
  if (state.stage !== 'ready') return;
  if (!state.midiNotes.length) {
    setStatusMessage('The loaded MIDI contains no note events to play.', 'error');
    renderDashboard(content);
    return;
  }

  if (state.midiPlaying) {
    state.midiPlaying = false;
    stopNativePlayback();
    cancelAnimationFrame(_midiRaf);
    const btn = content.querySelector('#midi-play');
    if (btn) {
      btn.innerHTML = ICON.play(20, 'white');
      btn.style.boxShadow = `0 0 15px rgba(139,92,246,0.4)`;
    }
    // Keep editors in sync right after pause so notes are editable without nudging time.
    _updateSeek(content);
    _syncEditToolbar(content);
    return;
  }

  let ctx;
  try {
    ctx = await ensureNativeAudioReady();
  } catch (error) {
    setStatusMessage(`Audio error: ${error.message}`, 'error');
    renderDashboard(content);
    return;
  }

  if (state.preferSf2Playback && !_sf2Synth && !_sf2UnavailableReason) {
    try {
      await ensureSf2SynthReady();
      setStatusMessage(
        _uiFormat('Playback using {instrument}.', { instrument: getSf2InstrumentPreset(state.sf2Instrument).label }),
        'success'
      );
    } catch (error) {
      setStatusMessage(`${error.message} Using built-in synth instead.`, 'error');
    }
  }

  const startPlayback = () => {
    scheduleNativePlayback(state.midiTime);
    state.midiPlaying = true;
    _midiRaf = requestAnimationFrame(() => _midiTick(content));
    const btn = content.querySelector('#midi-play');
    if (btn) {
      btn.innerHTML = ICON.pause(20, 'white');
      btn.style.boxShadow = `0 0 30px rgba(139,92,246,0.7)`;
    }
    _updateSeek(content);
    _syncEditToolbar(content);
  };

  // If already running start immediately, otherwise resume then start
  if (ctx.state === 'running') {
    startPlayback();
  } else {
    try {
      await ctx.resume();
      startPlayback();
    } catch (error) {
      setStatusMessage(`Playback error: ${error.message}`, 'error');
      renderDashboard(content);
    }
  }
}

function _midiStop(content) {
  state.midiPlaying = false;
  state.midiTime = 0;
  cancelAnimationFrame(_midiRaf);
  stopNativePlayback();

  _updateSeek(content);
  const btn = content.querySelector('#midi-play');
  if (btn) btn.innerHTML = ICON.play(20,'white');
  _syncEditToolbar(content);
}

function _downloadMidi() {
  if (state.stage !== 'ready') return;
  if (!state.midiBlob) return;
  const url = URL.createObjectURL(state.midiBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = normalizeMidiFileName(state.midiSourceName || getMidiSourceNameFallback());
  a.click();
  URL.revokeObjectURL(url);
}

async function _extractMidiData(midiBlob) {
  if (!window.Midi) {
    throw new Error('MIDI parser is not available.');
  }

  const arrayBuffer = await midiBlob.arrayBuffer();
  const parsed = new window.Midi(arrayBuffer);
  const notes = [];

  parsed.tracks.forEach(track => {
    track.notes.forEach(note => {
      notes.push({
        note: note.midi,
        startTime: note.time,
        duration: note.duration,
        velocity: Math.round((note.velocity ?? 0.8) * 127),
      });
    });
  });

  notes.sort((a, b) => a.startTime - b.startTime);

  const tempo = parsed.header && Array.isArray(parsed.header.tempos) && parsed.header.tempos.length
    ? parsed.header.tempos[0].bpm
    : null;

  const notesDuration = notes.length
    ? Math.max(...notes.map(note => note.startTime + note.duration))
    : 0;
  const resolvedDuration = Math.max(Number(parsed.duration) || 0, notesDuration);

  return {
    parsed,
    notes,
    duration: resolvedDuration,
    tempo,
  };
}

async function _applyMidiBlob(midiBlob, successMessage, options = {}) {
  const sourceName = normalizeMidiFileName(options.sourceName || state.midiSourceName || getMidiSourceNameFallback());
  const midiData = await _extractMidiData(midiBlob);
  const effectiveNotes = _applyPlaybackPerformanceStyle(midiData.notes);
  const effectiveDuration = effectiveNotes.length
    ? Math.max(...effectiveNotes.map(note => (Number(note.startTime) || 0) + Math.max(0.03, Number(note.duration) || 0)))
    : 0;

  resetMidiData();
  state.midiBlob = midiBlob;
  state.midiUrl = URL.createObjectURL(midiBlob);
  state.midiSourceName = sourceName;
  state.rawMidiNotes = _cloneNotes(midiData.notes);
  state.rawMidiDuration = midiData.duration;
  state.midiNotes = _cloneNotes(effectiveNotes);
  state.midiDuration = Math.max(midiData.duration, effectiveDuration);
  state.midiTempo = midiData.tempo;

  state.stage = 'ready';
  state.progress = 0;
  state.midiTime = 0;
  if (state.pedalAssist && state.midiNotes.length) {
    _rebuildMidiBlobFromEditedNotes(false);
  }
  _resetEditHistory();
  setStatusMessage(successMessage, 'success');
}

function _reprocessCurrentMidiForPlaybackStyle(content) {
  if (state.stage !== 'ready') return;
  const source = state.rawMidiNotes.length ? state.rawMidiNotes : state.midiNotes;
  const effectiveNotes = _applyPlaybackPerformanceStyle(source);
  state.midiNotes = _cloneNotes(effectiveNotes);
  state.midiDuration = state.midiNotes.length
    ? Math.max(...state.midiNotes.map(note => (Number(note.startTime) || 0) + Math.max(0.03, Number(note.duration) || 0)))
    : 0;
  const rebuilt = _rebuildMidiBlobFromEditedNotes(false);
  if (!rebuilt) return;
  state.midiTime = Math.min(state.midiTime, getMidiDuration());
  if (content) _updateSeek(content);
}

function _rebuildMidiBlobFromEditedNotes(syncRaw = true) {
  if (!window.Midi) return false;

  try {
    const midi = new window.Midi();
    if (state.midiTempo && midi.header && typeof midi.header.setTempo === 'function') {
      midi.header.setTempo(Math.max(30, Math.min(300, Number(state.midiTempo) || 120)));
    }

    const track = midi.addTrack();
    const orderedNotes = [...state.midiNotes].sort((a, b) => a.startTime - b.startTime);
    orderedNotes.forEach(note => {
      const midiNote = Math.round(Number(note.note));
      const startTime = Math.max(0, Number(note.startTime) || 0);
      const duration = Math.max(0.03, Number(note.duration) || 0.12);
      const velocity = Math.min(1, Math.max(0.05, (Number(note.velocity) || 96) / 127));

      if (!Number.isFinite(midiNote) || midiNote < MIDI_LO || midiNote > MIDI_HI) return;
      track.addNote({
        midi: midiNote,
        time: startTime,
        duration,
        velocity,
      });
    });

    const blob = new Blob([midi.toArray()], { type: 'audio/midi' });
    if (state.midiUrl) URL.revokeObjectURL(state.midiUrl);
    state.midiBlob = blob;
    state.midiUrl = URL.createObjectURL(blob);
    state.midiDuration = state.midiNotes.length
      ? Math.max(...state.midiNotes.map(note => (Number(note.startTime) || 0) + Math.max(0.03, Number(note.duration) || 0)))
      : 0;
    if (syncRaw) {
      state.rawMidiNotes = _cloneNotes(state.midiNotes);
      state.rawMidiDuration = state.midiDuration;
    }
    return true;
  } catch (error) {
    console.error('MIDI rebuild error:', error);
    return false;
  }
}

function _buildDemoMidiBlob() {
  if (!window.Midi) {
    throw new Error('MIDI library is not available.');
  }

  const midi = new window.Midi();
  if (midi.header && typeof midi.header.setTempo === 'function') {
    midi.header.setTempo(112);
  }

  const rightHand = midi.addTrack();
  const leftHand = midi.addTrack();

  const progression = [
    { bass: 48, chord: [60, 64, 67], melody: [72, 74, 76, 79] }, // C
    { bass: 45, chord: [57, 60, 64], melody: [71, 72, 74, 76] }, // Am
    { bass: 41, chord: [53, 57, 60], melody: [69, 71, 72, 74] }, // F
    { bass: 43, chord: [55, 59, 62], melody: [67, 69, 71, 72] }, // G
  ];

  const beat = 0.48;
  let phraseStart = 0;

  for (let repeat = 0; repeat < 2; repeat += 1) {
    progression.forEach(block => {
      leftHand.addNote({
        midi: block.bass,
        time: phraseStart,
        duration: beat * 3.8,
        velocity: 0.75,
      });

      block.chord.forEach((note, index) => {
        rightHand.addNote({
          midi: note,
          time: phraseStart + index * 0.06,
          duration: beat * 1.7,
          velocity: 0.7,
        });
      });

      block.melody.forEach((note, index) => {
        rightHand.addNote({
          midi: note,
          time: phraseStart + index * beat,
          duration: beat * 0.82,
          velocity: 0.88,
        });
      });

      phraseStart += beat * 4;
    });
  }

  return new Blob([midi.toArray()], { type: 'audio/midi' });
}

async function _loadDemoMidi(content) {
  // Unlock audio context synchronously on this click
  try { getNativeAudioContext(); } catch (_) {}

  try {
    const demoBlob = _buildDemoMidiBlob();
    await _applyMidiBlob(
      demoBlob,
      'Demo MIDI loaded. Press Play to preview the piano.',
      { sourceName: 'demo.mid' }
    );
  } catch (error) {
    setStatusMessage(`Demo MIDI error: ${error.message}`, 'error');
  }

  renderDashboard(content);
}

function _updateProcessingUI(content) {
  const bar = content.querySelector('#proc-bar');
  const pct = content.querySelector('#proc-pct');
  const label = content.querySelector('#proc-lbl');
  const progress = Math.max(0, Math.min(99, state.progress));
  if (bar) bar.style.width = progress + '%';
  if (pct) pct.textContent = Math.round(progress) + '%';
  if (label) label.textContent = _getProcessingLabel(progress);

  content.querySelectorAll('[data-step]').forEach((el, i) => {
    const start = i === 0 ? 0 : PROCESS_STEP_BOUNDS[i - 1];
    const end = PROCESS_STEP_BOUNDS[i];
    const done = progress >= end;
    const active = !done && progress >= start;
    el.style.background = done
      ? 'rgba(16,185,129,0.12)'
      : active
        ? 'rgba(139,92,246,0.16)'
        : 'rgba(255,255,255,0.04)';
    el.style.border = `1px solid ${done
      ? 'rgba(16,185,129,0.25)'
      : active
        ? 'rgba(139,92,246,0.35)'
        : 'rgba(255,255,255,0.06)'}`;
    const dot = el.querySelector('div');
    const sp = el.querySelector('span');
    if (dot) dot.style.background = done ? '#10b981' : active ? '#8b5cf6' : '#374151';
    if (sp) sp.style.color = done ? '#6ee7b7' : active ? '#ddd6fe' : '#4b5563';
  });
}

function _getProcessingLabel(progress) {
  const modelName = state.selectedModel === 'onsets_and_frames' ? 'Onsets & Frames' : 'TransKun';
  if (progress < PROCESS_STEP_BOUNDS[0]) return 'Uploading and validating audio';
  if (progress < PROCESS_STEP_BOUNDS[1]) return `${modelName}: transcribing notes and timing`;
  if (progress < 98) return 'Building MIDI events';
  return 'Finalizing export';
}

function _getEstimatedProcessingMs(audioFile) {
  const sizeMb = audioFile?.size ? audioFile.size / (1024 * 1024) : 2;
  const modelMultiplier = state.selectedModel === 'onsets_and_frames' ? 1.45 : 1;
  const estimated = 9000 + (sizeMb * 4200 * modelMultiplier);
  return Math.max(14000, Math.min(90000, estimated));
}

function _clearLoadedAudio(content) {
  if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
    try { _mediaRecorder.stop(); } catch (_) {}
  }
  _stopRecordingWaveform();
  state.isRecording = false;
  if (_recTimer) clearTimeout(_recTimer);

  if (_audioUrlRef) {
    URL.revokeObjectURL(_audioUrlRef);
    _audioUrlRef = null;
  }

  resetMidiData();
  state.audioUrl = null;
  state.audioFile = null;
  state.fileName = null;
  state.audioEntryId = null;
  state.stage = 'idle';
  state.modelDropdownOpen = false;
  state.compareResults = null;
  state.compareRunning = false;
  state.compareProgress = 0;
  clearStatusMessage();

  try {
    localStorage.removeItem(STORAGE_KEYS.lastAudioId);
  } catch (_) {}

  setStatusMessage('Audio removed. Upload or record a new file.', 'success');
  renderDashboard(content);
}

async function _handleRecord() {
  const content = document.getElementById('w-content');
  if (state.isRecording) {
    if (_mediaRecorder && _mediaRecorder.state !== 'inactive') _mediaRecorder.stop();
    _stopRecordingWaveform();
    state.isRecording = false;
    if (_recTimer) clearTimeout(_recTimer);
  } else {
    try {
      const recordingInputMode = normalizeRecordingInputMode(state.recordingInput);
      let stream = null;
      if (recordingInputMode === 'internal') {
        await ensureNativeAudioReady();
        stream = getInternalRecordingStream();
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (!stream) {
        throw new Error('Could not start recording stream.');
      }

      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
      const mimeType = mimeCandidates.find(type => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || '';
      _mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      _audioChunks = [];
      _activeRecordingStream = stream;
      _activeRecordingInputMode = recordingInputMode;

      _recordingStartedAt = Date.now();
      if (_recTimer) clearTimeout(_recTimer);
      _recTimer = setTimeout(() => {
        if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
          _mediaRecorder.stop();
        }
      }, MAX_RECORDING_MS);

      _mediaRecorder.ondataavailable = e => { if (e.data.size > 0) _audioChunks.push(e.data); };
      _mediaRecorder.onstop = async () => {
        _stopRecordingWaveform();
        const activeStream = _activeRecordingStream;
        const activeInputMode = _activeRecordingInputMode;
        if (activeStream && activeInputMode !== 'internal') {
          activeStream.getTracks().forEach(t => t.stop());
        }
        _activeRecordingStream = null;
        _activeRecordingInputMode = DEFAULT_SETTINGS.recordingInput;
        state.isRecording = false;
        if (_recTimer) clearTimeout(_recTimer);
        const blobType = _mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(_audioChunks, { type: blobType });
        const extension = inferRecordingFileExtension(blobType);
        const recordPrefix = activeInputMode === 'internal' ? 'internal_recording' : 'recording';
        const recordedFile = new File([blob], `${recordPrefix}.${extension}`, { type: blobType });

        if (blob.size > MAX_AUDIO_BYTES) {
          state.isRecording = false;
          setStatusMessage('Recording too large. Please record a shorter clip.', 'error');
          renderDashboard(content);
          return;
        }

        const durationMs = Math.max(0, Date.now() - _recordingStartedAt);
        let loadMessage = `Saved locally: ${recordedFile.name}`;
        let loadType = 'success';
        try {
          const entry = await saveAudioEntry({
            blob,
            name: recordedFile.name,
            source: activeInputMode === 'internal' ? 'internal_recording' : 'recording',
            durationMs,
          });
          localStorage.setItem(STORAGE_KEYS.lastAudioId, entry.id);
          resetMidiData();
          state.compareResults = null;
          state.compareRunning = false;
          state.compareProgress = 0;
          applyAudioEntryToState(entry);
        } catch (error) {
          if (_audioUrlRef) URL.revokeObjectURL(_audioUrlRef);
          _audioUrlRef = URL.createObjectURL(blob);
          resetMidiData();
          state.compareResults = null;
          state.compareRunning = false;
          state.compareProgress = 0;
          state.audioUrl = _audioUrlRef;
          state.audioFile = recordedFile;
          state.fileName = recordedFile.name;
          state.audioEntryId = null;
          state.stage = 'loaded';
          loadMessage = 'Recording stored in memory only (browser storage failed).';
          loadType = 'error';
        }

        if (state.autoConvert) {
          setStatusMessage(`${loadMessage} Auto-convert started.`, loadType);
          renderDashboard(content);
          await _handleConvert(content);
        } else {
          setStatusMessage(loadMessage, loadType);
          renderDashboard(content);
        }
      };
      _mediaRecorder.start();
      state.isRecording = true;
      state.stage = 'idle';
      clearStatusMessage();
      renderDashboard(content);
      _startRecordingWaveform(stream);
      return;
    } catch (error) {
      state.isRecording = false;
      const mode = normalizeRecordingInputMode(state.recordingInput);
      const base = mode === 'internal' ? _uiText('Internal recording error') : _uiText('Microphone error');
      setStatusMessage(`${base}: ${error.message}`, 'error');
    }
  }
  renderDashboard(content);
}

async function _loadAudioFileFromUserInput(file, content) {
  if (!file) return;
  if (_mediaRecorder && _mediaRecorder.state !== 'inactive') _mediaRecorder.stop();
  _stopRecordingWaveform();
  state.isRecording = false;
  if (_recTimer) clearTimeout(_recTimer);
  if (_audioUrlRef) URL.revokeObjectURL(_audioUrlRef);

  if (file.size > MAX_AUDIO_BYTES) {
    setStatusMessage('Upload too large. Please choose a smaller file.', 'error');
    renderDashboard(content || document.getElementById('w-content'));
    return;
  }

  resetMidiData();
  state.compareResults = null;
  state.compareRunning = false;
  state.compareProgress = 0;
  let loadMessage = `Saved locally: ${file.name}`;
  let loadType = 'success';
  try {
    const entry = await saveAudioEntry({
      blob: file,
      name: file.name,
      source: 'upload',
      durationMs: null,
    });
    localStorage.setItem(STORAGE_KEYS.lastAudioId, entry.id);
    applyAudioEntryToState(entry);
  } catch (error) {
    if (_audioUrlRef) URL.revokeObjectURL(_audioUrlRef);
    _audioUrlRef = URL.createObjectURL(file);
    state.audioUrl = _audioUrlRef;
    state.audioFile = file;
    state.fileName = file.name;
    state.audioEntryId = null;
    state.stage = 'loaded';
    loadMessage = 'Saved in memory only (browser storage failed).';
    loadType = 'error';
  }
  const targetContent = content || document.getElementById('w-content');
  if (state.autoConvert) {
    setStatusMessage(`${loadMessage} Auto-convert started.`, loadType);
    renderDashboard(targetContent);
    await _handleConvert(targetContent);
  } else {
    setStatusMessage(loadMessage, loadType);
    renderDashboard(targetContent);
  }
}

async function _loadMidiFileFromUserInput(file, content) {
  if (!file) return;
  const targetContent = content || document.getElementById('w-content');
  if (state.stage === 'processing') {
    setStatusMessage(_uiText('Wait for the current conversion to finish before loading a MIDI file.'), 'error');
    renderDashboard(targetContent);
    return;
  }
  if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
    try { _mediaRecorder.stop(); } catch (_) {}
  }
  _stopRecordingWaveform();
  state.isRecording = false;
  if (_recTimer) clearTimeout(_recTimer);

  if (file.size > MAX_MIDI_BYTES) {
    setStatusMessage(_uiText('MIDI file is too large. Please choose a smaller .mid/.midi file.'), 'error');
    renderDashboard(targetContent);
    return;
  }

  const hasMidiExt = /\.midi?$/i.test(file.name || '');
  const hasMidiType = /midi/i.test(file.type || '');
  if (!hasMidiExt && !hasMidiType) {
    setStatusMessage(_uiText('Invalid file type. Please upload a .mid or .midi file.'), 'error');
    renderDashboard(targetContent);
    return;
  }

  state.compareRunning = false;
  state.compareProgress = 0;
  state.compareResults = null;
  clearStatusMessage();

  try {
    await _applyMidiBlob(
      file,
      _uiFormat('MIDI loaded: {name}. You can edit notes and export it again.', { name: file.name }),
      { sourceName: file.name || 'uploaded.mid' }
    );
  } catch (error) {
    setStatusMessage(`${_uiText('MIDI load error:')} ${error.message}`, 'error');
  }

  renderDashboard(targetContent);
}

async function _handleUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const content = document.getElementById('w-content');
  await _loadAudioFileFromUserInput(file, content);
  e.target.value = '';
}

async function _handleMidiUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const content = document.getElementById('w-content');
  await _loadMidiFileFromUserInput(file, content);
  e.target.value = '';
}

function _getModelDisplayName(modelId) {
  return normalizeModelId(modelId) === 'onsets_and_frames' ? 'Onsets & Frames' : 'TransKun';
}

async function _requestTranscriptionFromApi(audioFile, modelId) {
  const model = normalizeModelId(modelId) || 'transkun';
  const formData = new FormData();
  formData.append('audio', audioFile, audioFile.name || 'input.wav');
  formData.append('model', model);
  const startedAt = performance.now();
  const response = await fetch(`${state.apiUrl}/transcribe`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    let errorMessage = 'Transcription failed.';
    try {
      const data = await response.json();
      errorMessage = data.detail || data.message || errorMessage;
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }
  const midiBlob = await response.blob();
  const elapsedMs = Math.round(performance.now() - startedAt);
  return { midiBlob, elapsedMs };
}

function _formatCompareElapsed(ms) {
  return formatCompareElapsed(ms);
}

function _setCompareProgress(content, progress, label = _uiText('Comparing models…')) {
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
  state.compareProgress = clamped;
  if (!content) return;
  const wrap = content.querySelector('#compare-proc-wrap');
  const bar = content.querySelector('#compare-proc-bar');
  const pct = content.querySelector('#compare-proc-pct');
  const lbl = content.querySelector('#compare-proc-lbl');
  if (!wrap) return;
  wrap.style.display = 'block';
  if (bar) bar.style.width = `${clamped}%`;
  if (pct) pct.textContent = `${Math.round(clamped)}%`;
  if (lbl) lbl.textContent = label;
}

function _estimateCompareMs(audioFile, modelId) {
  return estimateCompareDurationMs(audioFile, modelId);
}

function _renderModelComparePanel() {
  const compare = state.compareResults;
  if (!compare || !compare.results) return '';
  const models = ['transkun', 'onsets_and_frames'];
  const cards = models.map(modelId => {
    const result = compare.results[modelId];
    if (!result) {
      return `
        <div class="w-stat-box" style="padding:10px;border:1px solid rgba(255,255,255,0.08);text-align:left;">
          <p style="font-size:12px;color:#d1d5db;font-weight:600;">${_getModelDisplayName(modelId)}</p>
          <p style="font-size:10px;color:#6b7280;margin-top:6px;">${_uiText('No result yet')}</p>
        </div>`;
    }
    if (result.status !== 'completed') {
      return `
        <div class="w-stat-box" style="padding:10px;border:1px solid rgba(239,68,68,0.25);text-align:left;">
          <p style="font-size:12px;color:#fecaca;font-weight:600;">${_getModelDisplayName(modelId)}</p>
          <p style="font-size:10px;color:#fca5a5;margin-top:6px;">${result.errorMessage || _uiText('Conversion failed')}</p>
          <p style="font-size:10px;color:#6b7280;margin-top:6px;">${_uiText('Time:')} ${_formatCompareElapsed(result.elapsedMs)}</p>
          <button class="w-edit-tool-btn" data-compare-retry="${modelId}" style="margin-top:8px;">${_uiText('Retry')} ${_getModelDisplayName(modelId)}</button>
        </div>`;
    }
    return `
      <div class="w-stat-box" style="padding:10px;border:1px solid rgba(59,130,246,0.22);text-align:left;">
        <p style="font-size:12px;color:#d1d5db;font-weight:600;">${_getModelDisplayName(modelId)}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
          <span style="font-size:10px;color:#9ca3af;">${_uiText('Notes:')} ${Number(result.notes || 0).toLocaleString()}</span>
          <span style="font-size:10px;color:#9ca3af;">${_uiText('Dur:')} ${fmtTime(Number(result.durationSec) || 0)}</span>
          <span style="font-size:10px;color:#9ca3af;">${_uiText('Tempo:')} ${result.tempo ? `${Math.round(result.tempo)} BPM` : '—'}</span>
        </div>
        <p style="font-size:10px;color:#6b7280;margin-top:6px;">${_uiText('Time:')} ${_formatCompareElapsed(result.elapsedMs)} · ${_uiText('MIDI:')} ${formatBytes(result.midiSizeBytes)}</p>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="w-edit-tool-btn" data-compare-use="${modelId}">Use Result</button>
          <button class="w-edit-tool-btn" data-compare-download="${modelId}">Download</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="w-stat-box" style="margin-top:10px;padding:10px;border:1px solid rgba(255,255,255,0.08);text-align:left;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
        <p style="font-size:11px;color:#c4b5fd;font-weight:700;letter-spacing:0.06em;">${_uiText('MODEL COMPARE')}</p>
        <span style="font-size:10px;color:#6b7280;">${compare.fileName || _uiText('audio file')}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">
        ${cards}
      </div>
    </div>
  `;
}

async function _runSingleModelForCompare(audioFile, modelId) {
  try {
    const { midiBlob, elapsedMs } = await _requestTranscriptionFromApi(audioFile, modelId);
    const parsed = await _extractMidiData(midiBlob);
    const notes = Array.isArray(parsed.notes) ? parsed.notes.length : 0;
    const durationSec = Number(parsed.duration) || 0;
    const tempo = Number(parsed.tempo) || null;
    const payload = {
      modelId,
      status: 'completed',
      elapsedMs,
      notes,
      durationSec,
      tempo,
      midiBlob,
      midiSizeBytes: midiBlob.size || 0,
      errorMessage: '',
    };
    await recordConversionHistory({
      fileName: audioFile.name || 'input.wav',
      modelId,
      status: 'completed',
      notes,
      durationSec,
      audioSizeBytes: audioFile.size || 0,
      midiSizeBytes: midiBlob.size || 0,
      audioEntryId: state.audioEntryId || null,
      midiBlob,
      errorMessage: '',
    });
    return payload;
  } catch (error) {
    const payload = {
      modelId,
      status: 'failed',
      elapsedMs: 0,
      notes: 0,
      durationSec: 0,
      tempo: null,
      midiBlob: null,
      midiSizeBytes: 0,
      errorMessage: String(error?.message || 'Unknown conversion error'),
    };
    await recordConversionHistory({
      fileName: audioFile.name || 'input.wav',
      modelId,
      status: 'failed',
      notes: 0,
      durationSec: null,
      audioSizeBytes: audioFile.size || 0,
      midiSizeBytes: 0,
      audioEntryId: state.audioEntryId || null,
      midiBlob: null,
      errorMessage: payload.errorMessage,
    });
    return payload;
  }
}

function _downloadCompareResult(modelId) {
  const record = state.compareResults?.results?.[normalizeModelId(modelId) || ''];
  if (!record || record.status !== 'completed' || !(record.midiBlob instanceof Blob)) {
    setStatusMessage('No completed compare result available to download.', 'error');
    return false;
  }
  const fileBase = String(state.compareResults?.fileName || state.fileName || 'transcription').replace(/\.[^/.]+$/, '');
  const url = URL.createObjectURL(record.midiBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileBase}_${normalizeModelId(modelId)}.mid`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

async function _useCompareResult(content, modelId) {
  const normalizedModel = normalizeModelId(modelId);
  const record = state.compareResults?.results?.[normalizedModel || ''];
  if (!record || record.status !== 'completed' || !(record.midiBlob instanceof Blob)) {
    setStatusMessage('Selected compare result is not available.', 'error');
    renderDashboard(content);
    return false;
  }
  state.selectedModel = normalizedModel || state.selectedModel;
  persistAppSettings();
  await _applyMidiBlob(
    record.midiBlob,
    `${_getModelDisplayName(state.selectedModel)} result loaded from comparison.`,
    { sourceName: `comparison_${normalizeModelId(record.modelId) || 'model'}.mid` }
  );
  renderDashboard(content);
  return true;
}

async function _handleCompareModels(content) {
  if (state.compareRunning) return;
  const audioFile = await resolveAudioForTranscription();
  if (!audioFile) {
    setStatusMessage(_tk('status.select_audio_first', {}, 'Select or record an audio file first.'), 'error');
    renderDashboard(content);
    return;
  }
  state.compareRunning = true;
  state.compareProgress = 3;
  state.compareResults = {
    createdAt: new Date().toISOString(),
    fileName: audioFile.name || 'input.wav',
    results: {},
  };
  setStatusMessage(_tk('status.compare_running', {}, 'Running model comparison…'), 'success');
  renderDashboard(content);
  _setCompareProgress(content, 4, _tk('status.compare_running', {}, 'Running model comparison…'));

  const models = ['transkun', 'onsets_and_frames'];
  for (let i = 0; i < models.length; i += 1) {
    const modelId = models[i];
    const modelName = _getModelDisplayName(modelId);
    const startPct = i === 0 ? 8 : 55;
    const endPct = i === 0 ? 50 : 98;
    setStatusMessage(_tk('status.comparing_model', { model: _getModelDisplayName(modelId) }, `Comparing: ${_getModelDisplayName(modelId)}…`), 'success');
    _setCompareProgress(content, startPct, _tk('status.comparing_model', { model: modelName }, `Comparing: ${modelName}…`));
    const startedAt = Date.now();
    const estimatedMs = _estimateCompareMs(audioFile, modelId);
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const target = easingProgress(elapsed, estimatedMs, startPct, endPct);
      _setCompareProgress(content, target, _tk('status.comparing_model', { model: modelName }, `Comparing: ${modelName}…`));
    }, 320);
    const result = await _runSingleModelForCompare(audioFile, modelId);
    clearInterval(timer);
    state.compareResults.results[modelId] = result;
    _setCompareProgress(content, endPct, _tk('status.comparing_model', { model: modelName }, `Comparing: ${modelName}…`));
    renderDashboard(content);
  }

  state.compareRunning = false;
  state.compareProgress = 100;
  const completedCount = models.filter(modelId => state.compareResults?.results?.[modelId]?.status === 'completed').length;
  if (completedCount === 0) {
    setStatusMessage(_tk('status.compare_finished_errors', {}, 'Comparison finished with errors in both models.'), 'error');
  } else {
    setStatusMessage(_tk('status.compare_finished_partial', { count: completedCount }, `Comparison finished. ${completedCount}/2 model(s) produced MIDI.`), 'success');
  }
  renderDashboard(content);
}

async function _handleConvert(content) {
  if (state.stage === 'processing') return;
  const audioFile = await resolveAudioForTranscription();
  if (!audioFile) {
    setStatusMessage(_tk('status.select_audio_first', {}, 'Select or record an audio file first.'), 'error');
    renderDashboard(content);
    return;
  }

  state.stage = 'processing';
  state.progress = 3;
  clearStatusMessage();
  renderDashboard(content);

  if (_progressTimer) {
    clearInterval(_progressTimer);
    _progressTimer = null;
  }

  const startedAt = Date.now();
  const estimatedMs = _getEstimatedProcessingMs(audioFile);
  _progressTimer = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const eased = 1 - Math.exp(-elapsed / estimatedMs);
    const target = Math.min(98, 4 + eased * 94);
    state.progress = Math.max(state.progress, target);
    _updateProcessingUI(content);
  }, 350);

  try {
    const { midiBlob } = await _requestTranscriptionFromApi(audioFile, getBackendModel());

    state.progress = Math.max(state.progress, 99);
    _updateProcessingUI(content);

    if (_progressTimer) {
      clearInterval(_progressTimer);
      _progressTimer = null;
    }

    const sourceBase = String(audioFile.name || 'transcription').replace(/\.[^/.]+$/, '') || 'transcription';
    const modelSuffix = normalizeModelId(getBackendModel()) || 'transkun';
    await _applyMidiBlob(
      midiBlob,
      'MIDI conversion complete.',
      { sourceName: `${sourceBase}_${modelSuffix}.mid` }
    );
    await recordConversionHistory({
      fileName: audioFile.name || 'input.wav',
      modelId: getBackendModel(),
      status: 'completed',
      notes: Array.isArray(state.midiNotes) ? state.midiNotes.length : 0,
      durationSec: Number.isFinite(state.midiDuration) ? state.midiDuration : null,
      audioSizeBytes: audioFile.size || 0,
      midiSizeBytes: midiBlob.size || 0,
      audioEntryId: state.audioEntryId || null,
      midiBlob,
      errorMessage: '',
    });
    notifyConversionEvent('WidiAI conversion complete', `${audioFile.name || 'Audio file'} was converted to MIDI.`);
    renderDashboard(content);
  } catch (error) {
    try {
      await recordConversionHistory({
        fileName: audioFile.name || state.fileName || 'input.wav',
        modelId: getBackendModel(),
        status: 'failed',
        notes: 0,
        durationSec: null,
        audioSizeBytes: audioFile?.size || 0,
        midiSizeBytes: 0,
        audioEntryId: state.audioEntryId || null,
        midiBlob: null,
        errorMessage: String(error?.message || 'Unknown conversion error'),
      });
    } catch (_) {}
    state.stage = 'loaded';
    state.progress = 0;
    setStatusMessage(`Conversion error: ${error.message}`, 'error');
    notifyConversionEvent('WidiAI conversion failed', String(error.message || 'Unknown conversion error.'));
    renderDashboard(content);
  } finally {
    if (_progressTimer) {
      clearInterval(_progressTimer);
      _progressTimer = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════

function historyModelShort(modelId) {
  return normalizeModelId(modelId) === 'onsets_and_frames' ? 'O&F' : 'TransKun';
}

function historyTimestamp(createdAt) {
  const ts = Date.parse(String(createdAt || ''));
  return Number.isNaN(ts) ? 0 : ts;
}

function formatHistoryDate(createdAt) {
  const ts = historyTimestamp(createdAt);
  if (!ts) return '—';
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let amount = value;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }
  const digits = amount >= 100 || unitIndex === 0 ? 0 : amount >= 10 ? 1 : 2;
  return `${amount.toFixed(digits)} ${units[unitIndex]}`;
}

function _upsertHistoryEntryInState(entry) {
  const normalized = normalizeHistoryEntry(entry);
  const idx = state.historyEntries.findIndex(item => item.id === normalized.id);
  if (idx >= 0) {
    state.historyEntries[idx] = normalized;
  } else {
    state.historyEntries.unshift(normalized);
  }
  state.historyEntries.sort((a, b) => historyTimestamp(b.createdAt) - historyTimestamp(a.createdAt));
  return normalized;
}

async function hydrateHistoryEntries(content) {
  try {
    const rows = await listHistoryEntriesFromDb();
    state.historyEntries = rows;
    if (state.page === 'history' && content) {
      renderHistory(content);
    }
  } catch (error) {
    console.warn('Failed to load conversion history:', error);
  }
}

async function recordConversionHistory(entry) {
  const normalized = normalizeHistoryEntry({
    ...entry,
    id: entry?.id || makeEntityId('hist'),
    createdAt: entry?.createdAt || new Date().toISOString(),
  });
  _upsertHistoryEntryInState(normalized);
  try {
    await saveHistoryEntryToDb(normalized);
  } catch (error) {
    console.warn('Failed to persist conversion history entry:', error);
  }
  return normalized;
}

async function getHistoryEntry(historyId) {
  if (!historyId) return null;
  const local = state.historyEntries.find(entry => entry.id === historyId);
  if (local && (local.midiBlob instanceof Blob || (local.status === 'failed' && local.audioEntryId))) {
    return local;
  }
  try {
    const fromDb = await loadHistoryEntryFromDb(historyId);
    if (!fromDb) return local || null;
    _upsertHistoryEntryInState(fromDb);
    return fromDb;
  } catch (error) {
    console.warn('Failed to load history entry:', error);
    return local || null;
  }
}

async function deleteHistoryEntry(historyId) {
  if (!historyId) return;
  state.historyEntries = state.historyEntries.filter(entry => entry.id !== historyId);
  try {
    await deleteHistoryEntryFromDb(historyId);
  } catch (error) {
    console.warn('Failed to delete history entry:', error);
  }
}

async function downloadHistoryMidi(historyId) {
  const entry = await getHistoryEntry(historyId);
  if (!entry || entry.status !== 'completed') {
    setStatusMessage('Only completed conversions can be downloaded.', 'error');
    return false;
  }
  if (!(entry.midiBlob instanceof Blob)) {
    setStatusMessage('MIDI file is not available for this history item.', 'error');
    return false;
  }

  const baseName = String(entry.fileName || 'transcription').replace(/\.[^/.]+$/, '');
  const modelId = normalizeModelId(entry.modelId) || 'transkun';
  const url = URL.createObjectURL(entry.midiBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_${modelId}.mid`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

async function retryHistoryConversion(historyId) {
  const entry = await getHistoryEntry(historyId);
  if (!entry) {
    setStatusMessage('History item not found.', 'error');
    return false;
  }

  const audioEntryId = entry.audioEntryId ? String(entry.audioEntryId) : '';
  if (!audioEntryId) {
    setStatusMessage('Retry unavailable: original audio is not stored in browser history.', 'error');
    return false;
  }

  let audioEntry = null;
  try {
    audioEntry = await loadAudioEntry(audioEntryId);
  } catch (error) {
    setStatusMessage(`Retry unavailable: ${error.message}`, 'error');
    return false;
  }
  if (!audioEntry || !audioEntry.blob) {
    setStatusMessage('Retry unavailable: original audio was not found in browser storage.', 'error');
    return false;
  }

  resetMidiData();
  applyAudioEntryToState(audioEntry);
  try {
    localStorage.setItem(STORAGE_KEYS.lastAudioId, audioEntry.id);
  } catch (_) {}

  const modelId = normalizeModelId(entry.modelId);
  if (modelId && modelId !== state.selectedModel) {
    state.selectedModel = modelId;
    persistAppSettings();
  }

  if (typeof _navigateToPage === 'function') {
    _navigateToPage('dashboard');
  }
  const content = document.getElementById('w-content');
  if (!content) return false;
  renderDashboard(content);
  await _handleConvert(content);
  return true;
}

function renderHistory(content) {
  destroyInstances();
  const s = state;
  const allRows = Array.isArray(s.historyEntries) ? s.historyEntries.slice() : [];
  const rows = filterAndSortHistoryEntries(allRows, s, normalizeModelId);
  const summary = summarizeHistory(allRows);
  const total = summary.total;
  const successful = summary.successful;
  const totalNotes = summary.totalNotes;
  const avgDurationSec = summary.avgDurationSec;

  const statsHtml = [
    { label: 'Total Conversions', value: total.toLocaleString(), color: '#8b5cf6', icon: ICON.music2(16, '#8b5cf6') },
    { label: 'Successful', value: successful.toLocaleString(), color: '#10b981', icon: ICON.checkCircle(16, '#10b981') },
    { label: 'Total Notes', value: totalNotes.toLocaleString(), color: '#3b82f6', icon: ICON.activity(16, '#3b82f6') },
    { label: 'Avg Duration', value: avgDurationSec > 0 ? fmtTime(avgDurationSec) : '—', color: '#f59e0b', icon: ICON.clock(16, '#f59e0b') },
  ].map(c => `<div class="w-stat-card"><div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:${c.color}18;border:1px solid ${c.color}33;flex-shrink:0;">${c.icon}</div><div><p style="font-size:20px;font-weight:700;color:#f0f0f8;line-height:1;">${c.value}</p><p style="font-size:11px;color:#6b7280;margin-top:2px;">${c.label}</p></div></div>`).join('');

  const sfb = v => v === s.histStatus ? 'active-p' : '';
  const mfb = v => v === s.histModel ? 'active-b' : '';

  const rowsHtml = rows.length === 0 ? `<div class="w-empty"><div style="width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);margin-bottom:12px;">${ICON.fileAudio(24,'#374151')}</div><p style="font-size:14px;color:#6b7280;">No conversions found</p><p style="font-size:12px;color:#374151;margin-top:4px;">Try adjusting your filters</p></div>`
    : rows.map(e => `
    <div class="w-table-row">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;padding-right:16px;">
        <div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${e.status==='completed'?'rgba(139,92,246,0.12)':'rgba(239,68,68,0.1)'};border:1px solid ${e.status==='completed'?'rgba(139,92,246,0.2)':'rgba(239,68,68,0.2)'};">${ICON.fileAudio(13,e.status==='completed'?'#a78bfa':'#f87171')}</div>
        <span style="font-size:12px;color:#d1d5db;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${e.fileName}">${e.fileName}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">${ICON.calendar(11,'#4b5563')}<span style="font-size:11px;color:#6b7280;">${formatHistoryDate(e.createdAt)}</span></div>
      <div style="display:flex;align-items:center;gap:6px;">${normalizeModelId(e.modelId)==='transkun'?ICON.cpu(11,'#818cf8'):ICON.activity(11,'#60a5fa')}<span style="font-size:11px;color:${normalizeModelId(e.modelId)==='transkun'?'#818cf8':'#60a5fa'};">${historyModelShort(e.modelId)}</span></div>
      <div style="display:flex;align-items:center;gap:6px;">${ICON.clock(11,'#4b5563')}<span style="font-size:11px;color:#9ca3af;">${Number.isFinite(Number(e.durationSec)) && Number(e.durationSec) >= 0 ? fmtTime(Number(e.durationSec)) : '—'}</span></div>
      <div style="display:flex;align-items:center;gap:6px;">${ICON.music2(11,'#4b5563')}<span style="font-size:11px;color:${e.notes>0?'#9ca3af':'#4b5563'};">${e.notes>0?e.notes.toLocaleString():'—'}</span></div>
      <span style="font-size:11px;color:#6b7280;">${formatBytes(e.audioSizeBytes)}</span>
      <div class="w-row-actions">
        <div class="w-status-pill ${e.status==='completed'?'w-status-ok':'w-status-fail'}">${e.status==='completed'?ICON.checkCircle(9,'#10b981'):ICON.xCircle(9,'#ef4444')}<span>${e.status}</span></div>
        ${e.status==='completed'?`<button class="w-icon-btn w-icon-btn-dl" data-history-download="${e.id}" title="Download">${ICON.download(12,'#60a5fa')}</button>`:''}
        <button class="w-icon-btn w-icon-btn-retry" data-history-retry="${e.id}" title="Retry">${ICON.refresh(12,'#fbbf24')}</button>
        <button class="w-icon-btn w-icon-btn-del" data-history-delete="${e.id}" title="Delete">${ICON.trash(12,'#f87171')}</button>
      </div>
    </div>`).join('');

  content.innerHTML = `
    <div class="w-history">
      <div class="w-stats-grid">${statsHtml}</div>
      <div class="w-toolbar">
        <div class="w-search">${ICON.search(13,'#6b7280')}<input id="h-search" placeholder="Search files..." value="${s.histSearch}"></div>
        <div class="w-filter-group">
          ${['all','completed','failed'].map(v=>`<button class="w-filter-btn ${sfb(v)}" data-hs="${v}">${v==='all'?'All':v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join('')}
        </div>
        <div class="w-filter-group">
          ${[
            { value: 'all', label: 'All Models' },
            { value: 'transkun', label: 'TransKun' },
            { value: 'onsets_and_frames', label: 'Onsets & Frames' },
          ].map(v=>`<button class="w-filter-btn ${mfb(v.value)}" data-hm="${v.value}">${v.label}</button>`).join('')}
        </div>
        <div class="w-sort-wrap">
          <button class="w-sort-btn" id="sort-btn">${ICON.filter(12,'#6b7280')} Sort: ${s.histSort.charAt(0).toUpperCase()+s.histSort.slice(1)} ${ICON.chevronDown(11,'#6b7280')}</button>
          <div id="sort-dd" style="display:none;" class="w-sort-dropdown">
            ${['date','notes','duration'].map(v=>`<button class="w-sort-opt${s.histSort===v?' active':''}" data-sort="${v}">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="w-table">
        <div class="w-table-head">${['File Name','Date','Model','Duration','Notes','Size',''].map(h=>`<span>${h.toUpperCase()}</span>`).join('')}</div>
        <div class="w-table-body">${rowsHtml}</div>
        <div class="w-table-foot">
          <span style="font-size:11px;color:#4b5563;">${rows.length} of ${total} entries</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="display:flex;align-items:center;gap:4px;"><div style="width:6px;height:6px;border-radius:50%;background:#10b981;"></div><span style="font-size:10px;color:#6b7280;">Completed</span></div>
            <span style="color:#374151;font-size:10px;">·</span>
            <div style="display:flex;align-items:center;gap:4px;"><div style="width:6px;height:6px;border-radius:50%;background:#ef4444;"></div><span style="font-size:10px;color:#6b7280;">Failed</span></div>
          </div>
        </div>
      </div>
    </div>`;

  content.querySelector('#h-search').addEventListener('input', e => { s.histSearch = e.target.value; renderHistory(content); });
  content.querySelectorAll('[data-hs]').forEach(b => b.addEventListener('click', () => { s.histStatus = b.dataset.hs; renderHistory(content); }));
  content.querySelectorAll('[data-hm]').forEach(b => b.addEventListener('click', () => { s.histModel = b.dataset.hm; renderHistory(content); }));
  content.querySelector('#sort-btn').addEventListener('click', e => { e.stopPropagation(); const dd = content.querySelector('#sort-dd'); if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none'; });
  content.querySelectorAll('[data-sort]').forEach(b => b.addEventListener('click', () => { s.histSort = b.dataset.sort; renderHistory(content); }));
  content.querySelectorAll('[data-history-delete]').forEach(button => button.addEventListener('click', async () => {
    await deleteHistoryEntry(button.dataset.historyDelete);
    renderHistory(content);
  }));
  content.querySelectorAll('[data-history-download]').forEach(button => button.addEventListener('click', async () => {
    const downloaded = await downloadHistoryMidi(button.dataset.historyDownload);
    if (!downloaded) renderHistory(content);
  }));
  content.querySelectorAll('[data-history-retry]').forEach(button => button.addEventListener('click', async () => {
    const started = await retryHistoryConversion(button.dataset.historyRetry);
    if (!started) renderHistory(content);
  }));
  applyUiLanguage();
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════

function renderSettings(content) {
  destroyInstances();
  const s = state;

  const tgl = (id, val) => `<button class="w-toggle" data-setting-toggle="${id}" style="background:${val ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.1)'};border:${val ? 'none' : '1px solid rgba(255,255,255,0.15)'};box-shadow:${val ? '0 0 10px rgba(139,92,246,0.4)' : 'none'};"><div class="w-toggle-thumb" style="left:${val ? '20px' : '2px'};"></div></button>`;
  const vp = ((s.velocitySensitivity) / 127) * 100;
  const pedalPct = Math.round(clampSettingNumber(s.pedalAssistAmount, 0, 1, DEFAULT_SETTINGS.pedalAssistAmount) * 100);
  const activeModelLabel = s.selectedModel === 'onsets_and_frames' ? 'Onsets & Frames' : 'TransKun';
  const recordingInputLabel = normalizeRecordingInputMode(s.recordingInput) === 'internal'
    ? _uiText('Internal Piano')
    : _uiText('Ambient Mic');
  const fingerAlgoLabel = s.fingerSuggestionAlgorithm === 'manual' ? 'Manual Only' : 'Smart Auto';
  const sf2Preset = getSf2InstrumentPreset(s.sf2Instrument);
  const sf2PresetLabel = sf2Preset.label;
  const sf2OptionsHtml = SF2_INSTRUMENT_IDS.map(id => {
    const preset = getSf2InstrumentPreset(id);
    return `<option value="${preset.id}" ${preset.id === sf2Preset.id ? 'selected' : ''}>${preset.label}</option>`;
  }).join('');
  const playbackProfileId = normalizePlaybackProfile(s.playbackProfile);
  const playbackProfileLabel = playbackProfileId === 'studio'
    ? _tk('settings.playback_profile.studio', {}, 'Studio')
    : playbackProfileId === 'dry'
      ? _tk('settings.playback_profile.dry', {}, 'Dry')
      : _tk('settings.playback_profile.natural', {}, 'Natural');
  const apiHint = `${normalizeApiUrl(s.apiUrl)}/transcribe`;

  content.innerHTML = `
    <div class="w-settings">
      <div class="w-settings-inner">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;">
          <div>
            <h1 style="font-size:20px;font-weight:700;color:#f0f0f8;line-height:1;">Settings</h1>
            <p style="font-size:12px;color:#6b7280;margin-top:4px;">Basic controls that are directly connected to conversion and playback.</p>
            <p style="font-size:11px;color:#4b5563;margin-top:4px;">Changes are saved automatically.</p>
          </div>
          <button id="settings-reset" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);cursor:pointer;font-size:12px;color:#9ca3af;">
            ${ICON.rotateCcw(13,'#9ca3af')} Reset Defaults
          </button>
        </div>

        <div class="w-section-card">
          <div class="w-section-title"><div class="w-section-icon">${ICON.cpu(15,'#a78bfa')}</div><span style="font-size:13px;color:#e5e7eb;font-weight:600;">Transcription</span></div>
          <div class="w-setting-row" style="align-items:flex-start;">
            <div style="min-width:0;">
              <p style="font-size:12px;color:#d1d5db;font-weight:500;">Backend API URL</p>
              <p style="font-size:11px;color:#4b5563;margin-top:2px;">Used for conversion requests.</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;min-width:min(420px,100%);">
              <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
                <input id="settings-api-url" type="text" value="${normalizeApiUrl(s.apiUrl)}" style="width:min(360px,55vw);padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.12);color:#d1d5db;font-size:12px;outline:none;">
                <button id="settings-api-save" style="padding:8px 12px;border-radius:10px;background:rgba(59,130,246,0.18);border:1px solid rgba(59,130,246,0.32);color:#93c5fd;font-size:11px;font-weight:600;cursor:pointer;">Save</button>
                <button id="settings-api-test" style="padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#d1d5db;font-size:11px;font-weight:600;cursor:pointer;">Test</button>
              </div>
              <p id="settings-api-status" style="font-size:11px;color:#4b5563;max-width:420px;text-align:right;">Current endpoint: ${apiHint}</p>
            </div>
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Default Model</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Active model for new conversions.</p></div>
            <div style="display:flex;gap:8px;">
              <button class="w-model-pill" data-setting-model="transkun" style="${s.selectedModel === 'transkun' ? 'background:rgba(139,92,246,0.18);border-color:rgba(139,92,246,0.4);color:#c4b5fd;' : ''}">${ICON.cpu(13, s.selectedModel === 'transkun' ? '#a78bfa' : '#6b7280')} TransKun ${s.selectedModel === 'transkun' ? ICON.checkCircle(11,'#a78bfa') : ''}</button>
              <button class="w-model-pill" data-setting-model="onsets_and_frames" style="${s.selectedModel === 'onsets_and_frames' ? 'background:rgba(59,130,246,0.18);border-color:rgba(59,130,246,0.35);color:#93c5fd;' : ''}">${ICON.activity(13, s.selectedModel === 'onsets_and_frames' ? '#60a5fa' : '#6b7280')} Onsets & Frames ${s.selectedModel === 'onsets_and_frames' ? ICON.checkCircle(11,'#60a5fa') : ''}</button>
            </div>
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row"><div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Auto-convert After Upload / Recording</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Starts conversion immediately when audio is loaded.</p></div>${tgl('autoConvert', s.autoConvert)}</div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">${_uiText('Record Source')}:</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Choose microphone or internal piano bus for recording.</p></div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="w-quality-tab ${normalizeRecordingInputMode(s.recordingInput) === 'mic' ? 'active' : ''}" data-setting-record-source="mic">Ambient Mic</button>
              <button class="w-quality-tab ${normalizeRecordingInputMode(s.recordingInput) === 'internal' ? 'active' : ''}" data-setting-record-source="internal">Internal Piano</button>
            </div>
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Finger Suggestion Algorithm</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Smart Auto uses a global dynamic-programming pass with playability constraints.</p></div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="w-quality-tab ${s.fingerSuggestionAlgorithm === 'legacy' ? 'active' : ''}" data-setting-finger-algo="legacy">Smart Auto</button>
              <button class="w-quality-tab ${s.fingerSuggestionAlgorithm === 'manual' ? 'active' : ''}" data-setting-finger-algo="manual">Manual Only</button>
            </div>
          </div>
        </div>

        <div class="w-section-card">
          <div class="w-section-title"><div class="w-section-icon">${ICON.music2(15,'#a78bfa')}</div><span style="font-size:13px;color:#e5e7eb;font-weight:600;">Playback</span></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">${_tk('settings.playback_profile', {}, 'Playback Profile')}</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">${_tk('settings.playback_profile.help', {}, 'Choose articulation feel for preview and MIDI playback.')}</p></div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
              <select id="settings-playback-profile" class="w-select" style="min-width:170px;">
                <option value="natural" ${playbackProfileId === 'natural' ? 'selected' : ''}>${_tk('settings.playback_profile.natural', {}, 'Natural')}</option>
                <option value="studio" ${playbackProfileId === 'studio' ? 'selected' : ''}>${_tk('settings.playback_profile.studio', {}, 'Studio')}</option>
                <option value="dry" ${playbackProfileId === 'dry' ? 'selected' : ''}>${_tk('settings.playback_profile.dry', {}, 'Dry')}</option>
              </select>
            </div>
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Use SF2 Soundfont Engine</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">When enabled, playback uses the selected SF2 soundfont when available.</p></div>
            ${tgl('preferSf2Playback', s.preferSf2Playback)}
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">SF2 Instrument</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Select the instrument used by the SF2 preview engine.</p></div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
              <select id="settings-sf2-instrument" class="w-select" style="min-width:230px;" ${s.preferSf2Playback ? '' : 'disabled'}>
                ${sf2OptionsHtml}
              </select>
            </div>
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Pedal Assist (anti-staccato)</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Extends note tails to preserve legato feel when the source is not staccato.</p></div>
            ${tgl('pedalAssist', s.pedalAssist)}
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Pedal Assist Amount</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Higher values keep notes sustained longer.</p></div>
            <div style="display:flex;align-items:center;gap:12px;">
              <input type="range" class="w-slider" id="settings-pedal-amount" min="0" max="100" step="1" value="${pedalPct}" style="background:linear-gradient(to right,#8b5cf6 ${pedalPct}%,rgba(255,255,255,0.1) ${pedalPct}%);">
              <span id="settings-pedal-disp" style="font-size:12px;color:#a78bfa;min-width:40px;text-align:right;">${pedalPct}%</span>
            </div>
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Playback Dynamics</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Scales note velocity for preview and MIDI playback.</p></div>
            <div style="display:flex;align-items:center;gap:12px;">
              <input type="range" class="w-slider" id="settings-velocity" min="0" max="127" step="1" value="${s.velocitySensitivity}" style="background:linear-gradient(to right,#8b5cf6 ${vp}%,rgba(255,255,255,0.1) ${vp}%);">
              <span id="settings-velocity-disp" style="font-size:12px;color:#a78bfa;min-width:40px;text-align:right;">${s.velocitySensitivity}</span>
            </div>
          </div>
        </div>

        <div class="w-section-card">
          <div class="w-section-title"><div class="w-section-icon">${ICON.sliders(15,'#a78bfa')}</div><span style="font-size:13px;color:#e5e7eb;font-weight:600;">Language</span></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Interface Language</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Choose English, Spanish, or Catalan.</p></div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
              <select id="settings-ui-language" class="w-select" style="min-width:180px;">
                <option value="en" ${s.uiLanguage === 'en' ? 'selected' : ''}>English</option>
                <option value="es" ${s.uiLanguage === 'es' ? 'selected' : ''}>Español</option>
                <option value="ca" ${s.uiLanguage === 'ca' ? 'selected' : ''}>Català</option>
              </select>
            </div>
          </div>
          <div class="w-divider"></div>
          <div class="w-setting-row">
            <div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Current Language Setup</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Mode: ${s.uiLanguage.toUpperCase()}</p></div>
          </div>
        </div>

        <div class="w-section-card">
          <div class="w-section-title"><div class="w-section-icon">${ICON.bell(15,'#a78bfa')}</div><span style="font-size:13px;color:#e5e7eb;font-weight:600;">Notifications</span></div>
          <div class="w-setting-row"><div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Browser Notifications</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Notify when conversion succeeds or fails.</p></div><div style="display:flex;align-items:center;gap:8px;">${ICON.bell(13, s.notificationsOn ? '#a78bfa' : '#4b5563')}${tgl('notificationsOn', s.notificationsOn)}</div></div>
          <div class="w-divider"></div>
          <div class="w-setting-row"><div><p style="font-size:12px;color:#d1d5db;font-weight:500;">Current Setup</p><p style="font-size:11px;color:#4b5563;margin-top:2px;">Model: ${activeModelLabel} · Auto-convert: ${s.autoConvert ? 'On' : 'Off'} · Record: ${recordingInputLabel} · Profile: ${playbackProfileLabel} · SF2: ${s.preferSf2Playback ? `On (${sf2PresetLabel})` : 'Off'} · Pedal: ${s.pedalAssist ? `${pedalPct}%` : 'Off'} · Finger Algo: ${fingerAlgoLabel}</p></div></div>
        </div>
      </div>
    </div>`;

  const apiInput = content.querySelector('#settings-api-url');
  const apiStatus = content.querySelector('#settings-api-status');

  const applyApiUrl = () => {
    s.apiUrl = normalizeApiUrl(apiInput.value);
    persistAppSettings();
    apiInput.value = s.apiUrl;
    if (apiStatus) apiStatus.textContent = `Current endpoint: ${s.apiUrl}/transcribe`;
  };

  content.querySelector('#settings-api-save')?.addEventListener('click', applyApiUrl);
  apiInput?.addEventListener('blur', applyApiUrl);
  apiInput?.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    applyApiUrl();
  });

  content.querySelector('#settings-api-test')?.addEventListener('click', async (e) => {
    applyApiUrl();
    const button = e.currentTarget;
    if (button) button.disabled = true;
    if (apiStatus) apiStatus.textContent = `Testing connection to ${s.apiUrl}...`;
    if (apiStatus) apiStatus.style.color = '#4b5563';
    try {
      const response = await fetch(`${s.apiUrl}/`, { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let payload = null;
      try {
        payload = await response.json();
      } catch (_) {
        payload = null;
      }
      if (!payload || payload.status !== 'ok') {
        throw new Error('Unexpected response from healthcheck.');
      }
      if (apiStatus) apiStatus.textContent = `Connection successful: ${s.apiUrl}`;
      if (apiStatus) apiStatus.style.color = '#6ee7b7';
    } catch (error) {
      if (apiStatus) apiStatus.textContent = `Connection failed: ${error.message}`;
      if (apiStatus) apiStatus.style.color = '#fca5a5';
    } finally {
      if (button) button.disabled = false;
    }
  });

  content.querySelectorAll('[data-setting-model]').forEach(btn => btn.addEventListener('click', () => {
    const nextModel = normalizeModelId(btn.dataset.settingModel);
    if (!nextModel || nextModel === s.selectedModel) return;
    s.selectedModel = nextModel;
    persistAppSettings();
    renderSettings(content);
  }));

  content.querySelectorAll('[data-setting-record-source]').forEach(button => button.addEventListener('click', () => {
    const nextSource = normalizeRecordingInputMode(button.dataset.settingRecordSource);
    if (nextSource === s.recordingInput) return;
    s.recordingInput = nextSource;
    persistAppSettings();
    renderSettings(content);
  }));

  content.querySelectorAll('[data-setting-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.settingToggle;
    if (!['autoConvert', 'notificationsOn', 'preferSf2Playback', 'pedalAssist'].includes(key)) return;
    s[key] = !s[key];
    if (key === 'preferSf2Playback' && !s.preferSf2Playback) {
      disposeSf2Synth();
      _sf2UnavailableReason = '';
    }
    if (key === 'preferSf2Playback' && s.preferSf2Playback) {
      _sf2UnavailableReason = '';
    }
    if (key === 'pedalAssist' && s.stage === 'ready') {
      _reprocessCurrentMidiForPlaybackStyle(document.getElementById('w-content'));
    }
    persistAppSettings();
    renderSettings(content);
  }));

  content.querySelectorAll('[data-setting-finger-algo]').forEach(button => button.addEventListener('click', () => {
    const next = normalizeFingerSuggestionAlgorithm(button.dataset.settingFingerAlgo);
    if (next === s.fingerSuggestionAlgorithm) return;
    s.fingerSuggestionAlgorithm = next;
    persistAppSettings();
    renderSettings(content);
  }));

  content.querySelector('#settings-velocity')?.addEventListener('input', e => {
    s.velocitySensitivity = Math.round(clampSettingNumber(e.target.value, 0, 127, DEFAULT_SETTINGS.velocitySensitivity));
    const disp = content.querySelector('#settings-velocity-disp');
    if (disp) disp.textContent = s.velocitySensitivity;
    const p = (s.velocitySensitivity / 127) * 100;
    e.target.style.background = `linear-gradient(to right,#8b5cf6 ${p}%,rgba(255,255,255,0.1) ${p}%)`;
  });

  content.querySelector('#settings-velocity')?.addEventListener('change', () => {
    persistAppSettings();
  });

  content.querySelector('#settings-pedal-amount')?.addEventListener('input', e => {
    const pct = clampSettingNumber(e.target.value, 0, 100, Math.round(DEFAULT_SETTINGS.pedalAssistAmount * 100));
    s.pedalAssistAmount = pct / 100;
    const disp = content.querySelector('#settings-pedal-disp');
    if (disp) disp.textContent = `${pct}%`;
    e.target.style.background = `linear-gradient(to right,#8b5cf6 ${pct}%,rgba(255,255,255,0.1) ${pct}%)`;
  });
  content.querySelector('#settings-pedal-amount')?.addEventListener('change', () => {
    if (s.stage === 'ready') _reprocessCurrentMidiForPlaybackStyle(document.getElementById('w-content'));
    persistAppSettings();
    renderSettings(content);
  });

  content.querySelector('#settings-playback-profile')?.addEventListener('change', e => {
    s.playbackProfile = normalizePlaybackProfile(e.target?.value);
    if (s.stage === 'ready') _reprocessCurrentMidiForPlaybackStyle(document.getElementById('w-content'));
    persistAppSettings();
    renderSettings(content);
  });

  content.querySelector('#settings-sf2-instrument')?.addEventListener('change', async e => {
    const nextInstrument = normalizeSf2Instrument(e.target?.value);
    if (nextInstrument === s.sf2Instrument) return;
    s.sf2Instrument = nextInstrument;
    persistAppSettings();
    stopNativePlayback();
    disposeSf2Synth();
    _sf2UnavailableReason = '';
    if (s.preferSf2Playback) {
      try { await ensureSf2SynthReady(); } catch (_) {}
    }
    renderSettings(content);
  });

  content.querySelector('#settings-ui-language')?.addEventListener('change', e => {
    s.uiLanguage = normalizeUiLanguage(e.target?.value);
    persistUiLanguageSettings();
    _renderHeader();
    renderSettings(content);
    applyUiLanguage();
  });

  content.querySelector('#settings-reset')?.addEventListener('click', () => {
    Object.assign(s, {
      apiUrl: normalizeApiUrl(PROD_API_URL),
      selectedModel: 'transkun',
      autoConvert: DEFAULT_SETTINGS.autoConvert,
      velocitySensitivity: DEFAULT_SETTINGS.velocitySensitivity,
      notificationsOn: DEFAULT_SETTINGS.notificationsOn,
      recordingInput: DEFAULT_SETTINGS.recordingInput,
      preferSf2Playback: DEFAULT_SETTINGS.preferSf2Playback,
      sf2Instrument: DEFAULT_SETTINGS.sf2Instrument,
      pedalAssist: DEFAULT_SETTINGS.pedalAssist,
      pedalAssistAmount: DEFAULT_SETTINGS.pedalAssistAmount,
      fingerSuggestionAlgorithm: DEFAULT_SETTINGS.fingerSuggestionAlgorithm,
      playbackProfile: DEFAULT_SETTINGS.playbackProfile,
      uiLanguage: 'en',
    });
    _sf2UnavailableReason = '';
    persistAppSettings();
    persistUiLanguageSettings();
    if (s.stage === 'ready') _reprocessCurrentMidiForPlaybackStyle(document.getElementById('w-content'));
    _renderHeader();
    renderSettings(content);
    applyUiLanguage();
  });
  applyUiLanguage();
}

function renderHome(content) {
  destroyInstances();
  content.innerHTML = `
    <section style="flex:1;min-height:calc(100vh - 84px);display:flex;align-items:center;justify-content:center;padding:36px 20px 56px;text-align:center;position:relative;z-index:1;">
      <div style="width:100%;max-width:960px;margin:0 auto;">
        <div style="display:inline-block;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.35);border-radius:24px;padding:8px 18px;margin-bottom:24px;">
          <span style="color:#c4b5fd;font-size:12px;font-weight:600;letter-spacing:0.08em;">AI-POWERED PIANO TRANSCRIPTION</span>
        </div>
        <h1 style="font-size:clamp(48px,8vw,96px);font-weight:700;color:#f0f0f8;margin-bottom:24px;line-height:1.04;letter-spacing:-0.03em;">
          Convert Piano Audio<br />
          <span style="background:linear-gradient(135deg,#60a5fa 0%,#c4b5fd 50%,#a78bfa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">to MIDI Instantly</span>
        </h1>
        <p style="font-size:clamp(16px,2.1vw,20px);color:#9ca3af;max-width:760px;margin:0 auto 42px;">
          Upload your piano recordings or record live. Our AI-powered transcription engine converts your performance into accurate MIDI files in seconds.
        </p>
        <div style="display:flex;justify-content:center;margin-bottom:20px;">
          <button type="button" data-home-launch style="padding:16px 44px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;border:none;font-weight:700;font-size:clamp(18px,2.1vw,24px);cursor:pointer;box-shadow:0 12px 30px rgba(139,92,246,0.45),0 2px 0 rgba(255,255,255,0.16) inset;">
            Launch WidiAI
          </button>
        </div>
        <p style="font-size:12px;color:#6b7280;">No registration required • Works locally • Browser-based workflow</p>
      </div>
    </section>`;

  const go = (page) => {
    if (typeof _navigateToPage === 'function') {
      _navigateToPage(page);
      return;
    }
    state.page = page;
    _syncNavButtons();
    renderPage(content);
  };

  content.querySelectorAll('[data-home-launch]').forEach(btn => {
    btn.addEventListener('click', () => go('dashboard'));
  });
}

const UI_STATIC_TRANSLATIONS = {
  es: {
    Dashboard: 'Panel',
    History: 'Historial',
    Settings: 'Ajustes',
    Home: 'Inicio',
    'AUDIO INPUT': 'ENTRADA DE AUDIO',
    'Record piano audio': 'Grabar audio de piano',
    '● Recording...': '● Grabando...',
    'Record Source': 'Fuente de grabación',
    'Ambient Mic': 'Micrófono ambiente',
    'Internal Piano': 'Piano interno',
    'Upload audio file': 'Subir archivo de audio',
    'Upload MIDI file': 'Subir archivo MIDI',
    'Drag and drop audio here (.wav, .mp3, .flac, .ogg, .m4a, .webm)': 'Arrastra y suelta audio aquí (.wav, .mp3, .flac, .ogg, .m4a, .webm)',
    'Drag and drop a MIDI file here (.mid, .midi)': 'Arrastra y suelta un archivo MIDI aquí (.mid, .midi)',
    'Drag and drop audio or MIDI here (.wav, .mp3, .flac, .ogg, .m4a, .webm, .mid, .midi)': 'Arrastra y suelta audio o MIDI aquí (.wav, .mp3, .flac, .ogg, .m4a, .webm, .mid, .midi)',
    Clear: 'Limpiar',
    'AI MODEL': 'MODELO IA',
    'Convert to MIDI': 'Convertir a MIDI',
    'Re-convert to MIDI': 'Volver a convertir a MIDI',
    'Compare Both Models': 'Comparar ambos modelos',
    'Transformer-based model': 'Modelo basado en Transformer',
    'Google Magenta model': 'Modelo Google Magenta',
    'Transformer-based model. Balanced performance': 'Modelo basado en Transformer. Rendimiento equilibrado',
    'Google Magenta model. Optimal for clean recordings': 'Modelo Google Magenta. Óptimo para grabaciones limpias',
    Recommended: 'Recomendado',
    'MIDI PLAYER': 'REPRODUCTOR MIDI',
    Demo: 'Demo',
    Upload: 'Subir',
    Transcribe: 'Transcribir',
    'Build MIDI': 'Construir MIDI',
    Notes: 'Notas',
    Duration: 'Duración',
    Tempo: 'Tempo',
    'No MIDI yet': 'Aún no hay MIDI',
    'Upload or record audio, then convert.': 'Sube o graba audio y luego convierte.',
    'Export .mid file': 'Exportar archivo .mid',
    Instrument: 'Instrumento',
    'Virtual Keyboard: A W S E D F T G Y H U J · K O L P ; \' · Z X C V B N M': 'Teclado virtual: A W S E D F T G Y H U J · K O L P ; \' · Z X C V B N M',
    'Keyboard Notes': 'Notas ↔ teclado',
    'Hide Keyboard Notes': 'Ocultar notas ↔ teclado',
    'Computer Keyboard Mapping': 'Equivalencia teclado del ordenador',
    'MIDI Source:': 'Fuente MIDI:',
    'PIANO ROLL': 'PIANO ROLL',
    'MUSIC SCORE': 'PARTITURA',
    Roll: 'Roll',
    Score: 'Partitura',
    'Editing On': 'Edición activada',
    'Edit Notes': 'Editar notas',
    'Finger Labels On': 'Dedos activados',
    'Finger Labels': 'Etiquetas de dedos',
    'Readable Score': 'Partitura legible',
    'Hide Guide': 'Ocultar guía',
    'Show Guide': 'Mostrar guía',
    'Ready · Press play': 'Listo · Pulsa play',
    'Waiting for MIDI': 'Esperando MIDI',
    Undo: 'Deshacer',
    Redo: 'Rehacer',
    'Hide History': 'Ocultar historial',
    Finger: 'Dedo',
    'Smart Auto': 'Auto inteligente',
    'Manual Only': 'Solo manual',
    History: 'Historial',
    'MODEL COMPARE': 'COMPARACIÓN DE MODELOS',
    'Comparing models…': 'Comparando modelos…',
    'Running model comparison…': 'Ejecutando comparación de modelos…',
    'Conversion failed': 'Conversión fallida',
    'Time:': 'Tiempo:',
    'Notes:': 'Notas:',
    'Dur:': 'Dur:',
    'Tempo:': 'Tempo:',
    'MIDI:': 'MIDI:',
    'audio file': 'archivo de audio',
    '88 KEYS · SYNTHESIA VIEW': '88 TECLAS · VISTA SYNTHESIA',
    'GRAND STAFF · EDITABLE': 'DOBLE PENTAGRAMA · EDITABLE',
    'MIDI conversion complete!': '¡Conversión MIDI completada!',
    'MIDI ready.': 'MIDI listo.',
    'Use Result': 'Usar resultado',
    Download: 'Descargar',
    Retry: 'Reintentar',
    'No result yet': 'Sin resultado todavía',
    'No conversions found': 'No se encontraron conversiones',
    'Try adjusting your filters': 'Prueba ajustando los filtros',
    'Total Conversions': 'Total conversiones',
    Successful: 'Exitosas',
    'Total Notes': 'Total notas',
    'Avg Duration': 'Duración media',
    'All Models': 'Todos los modelos',
    'Search files...': 'Buscar archivos...',
    'Sort:': 'Ordenar:',
    'File Name': 'Archivo',
    Date: 'Fecha',
    Model: 'Modelo',
    Size: 'Tamaño',
    entries: 'entradas',
    Completed: 'Completadas',
    Failed: 'Fallidas',
    Language: 'Idioma',
    Transcription: 'Transcripción',
    Playback: 'Reproducción',
    Notifications: 'Notificaciones',
    'Reset Defaults': 'Restablecer',
    'Browser Notifications': 'Notificaciones del navegador',
    'Current Setup': 'Configuración actual',
    'Settings': 'Ajustes',
    'AI-POWERED PIANO TRANSCRIPTION': 'TRANSCRIPCIÓN DE PIANO CON IA',
    'Convert Piano Audio': 'Convierte audio de piano',
    'to MIDI Instantly': 'a MIDI al instante',
    'Upload your piano recordings or record live. Our AI-powered transcription engine converts your performance into accurate MIDI files in seconds.': 'Sube tus grabaciones de piano o graba en directo. Nuestro motor de transcripción con IA convierte tu interpretación en archivos MIDI precisos en segundos.',
    'Launch WidiAI': 'Abrir WidiAI',
    'No registration required • Works locally • Browser-based workflow': 'Sin registro • Funciona en local • Flujo en navegador',
    'Basic controls that are directly connected to conversion and playback.': 'Controles básicos conectados directamente a la conversión y la reproducción.',
    'Changes are saved automatically.': 'Los cambios se guardan automáticamente.',
    'Backend API URL': 'URL de la API backend',
    'Used for conversion requests.': 'Se usa para solicitudes de conversión.',
    'Current endpoint:': 'Endpoint actual:',
    'Default Model': 'Modelo predeterminado',
    'Active model for new conversions.': 'Modelo activo para nuevas conversiones.',
    'Auto-convert After Upload / Recording': 'Auto-convertir tras subir / grabar',
    'Starts conversion immediately when audio is loaded.': 'Inicia la conversión automáticamente al cargar audio.',
    'Choose microphone or internal piano bus for recording.': 'Elige micrófono o bus interno del piano para grabar.',
    'Finger Suggestion Algorithm': 'Algoritmo de sugerencia de dedos',
    'Use SF2 Soundfont Engine': 'Usar motor SF2 Soundfont',
    'When enabled, playback uses the selected SF2 soundfont when available.': 'Cuando está activado, la reproducción usa el SF2 seleccionado cuando está disponible.',
    'Use Full Grand Piano.sf2': 'Usar Full Grand Piano.sf2',
    'When enabled, playback uses the SF2 soundfont when available.': 'Cuando está activado, la reproducción usa el soundfont SF2 cuando está disponible.',
    'SF2 Instrument': 'Instrumento SF2',
    'Select the instrument used by the SF2 preview engine.': 'Selecciona el instrumento usado por el motor de preescucha SF2.',
    'Pedal Assist (anti-staccato)': 'Asistencia de pedal (anti-staccato)',
    'Extends note tails to preserve legato feel when the source is not staccato.': 'Alarga la cola de las notas para mantener un legato natural si la fuente no es staccato.',
    'Pedal Assist Amount': 'Intensidad de asistencia de pedal',
    'Higher values keep notes sustained longer.': 'Valores altos mantienen las notas más sostenidas.',
    'Playback Dynamics': 'Dinámica de reproducción',
    'Scales note velocity for preview and MIDI playback.': 'Escala la velocidad de notas para preescucha y reproducción MIDI.',
    'Interface Language': 'Idioma de la interfaz',
    'Choose English, Spanish, or Catalan.': 'Elige inglés, español o catalán.',
    'Current Language Setup': 'Configuración de idioma actual',
    'Mode:': 'Modo:',
    'Smart Auto uses a global dynamic-programming pass with playability constraints.': 'Auto inteligente usa un ajuste global por programación dinámica con restricciones de tocabilidad.',
    'Save': 'Guardar',
    'Test': 'Probar',
    'Go to home': 'Ir al inicio',
    'Language switch': 'Selector de idioma',
    'Testing connection to': 'Probando conexión con',
    'Connection successful:': 'Conexión correcta:',
    'Connection failed:': 'Conexión fallida:',
    'Recording source switched to Internal Piano.': 'Fuente de grabación cambiada a Piano interno.',
    'Recording source switched to Ambient Mic.': 'Fuente de grabación cambiada a Micrófono ambiente.',
    'Internal recording error': 'Error de grabación interna',
    'Microphone error': 'Error de micrófono',
    'Stop recording or wait for processing before loading a MIDI file.': 'Detén la grabación o espera al procesamiento antes de cargar un archivo MIDI.',
    'Wait for the current conversion to finish before loading a MIDI file.': 'Espera a que termine la conversión actual antes de cargar un archivo MIDI.',
    'MIDI file is too large. Please choose a smaller .mid/.midi file.': 'El archivo MIDI es demasiado grande. Elige un archivo .mid/.midi más pequeño.',
    'Invalid file type. Please upload a .mid or .midi file.': 'Tipo de archivo no válido. Sube un archivo .mid o .midi.',
    'Use the MIDI Player upload button for .mid/.midi files.': 'Para archivos .mid/.midi usa el botón de subida del reproductor MIDI.',
    'MIDI loaded: {name}. You can edit notes and export it again.': 'MIDI cargado: {name}. Puedes editar notas y volver a exportarlo.',
    'MIDI load error:': 'Error al cargar MIDI:',
    'Playback instrument set to {instrument}.': 'Instrumento de reproducción cambiado a {instrument}.',
    'Playback using {instrument}.': 'Reproducción usando {instrument}.',
    On: 'Activado',
    Off: 'Desactivado',
    'Playback Profile': 'Perfil de reproducción',
    'Choose articulation feel for preview and MIDI playback.': 'Elige el carácter de articulación para preescucha y reproducción MIDI.',
    Natural: 'Natural',
    Studio: 'Studio',
    Dry: 'Seco',
    'Profile:': 'Perfil:',
    'Edit History': 'Historial de edición',
    'Undo {undo} · Redo {redo} · Click to restore': 'Deshacer {undo} · Rehacer {redo} · Haz clic para restaurar',
    notes: 'notas',
    'No edit actions yet.': 'Aún no hay acciones de edición.',
    'Edit Mode Active': 'Modo edición activo',
    'Score Editing Guide': 'Guía de edición de partitura',
    'Roll Editing Guide': 'Guía de edición de roll',
    'Treble Clef': 'Clave de sol',
    'Bass Clef': 'Clave de fa',
    'Hover a title to see full controls': 'Pasa el cursor sobre un título para ver todos los controles',
    'Playback Controls': 'Controles de reproducción',
    'Undo / Redo': 'Deshacer / Rehacer',
    'Multi-select': 'Selección múltiple',
    Zoom: 'Zoom',
    Pitch: 'Altura',
    Time: 'Tiempo',
    Add: 'Añadir',
    Delete: 'Borrar',
    Duplicate: 'Duplicar',
    '<strong>Space:</strong> toggles play/pause from the current cursor time (it does not reset).': '<strong>Espacio:</strong> alterna play/pausa desde el cursor actual (no se reinicia).',
    '<strong>Arrow Left/Right:</strong> seek the transport by 0.5 seconds.': '<strong>Flecha Izq./Der.:</strong> mueve el transporte 0,5 segundos.',
    '<strong>Shift + Arrow Left/Right:</strong> seek by 2 seconds for faster navigation.': '<strong>Shift + Flecha Izq./Der.:</strong> mueve 2 segundos para navegar más rápido.',
    '<strong>Edit mode rule:</strong> if notes are selected, arrows edit notes; clear selection to seek transport.': '<strong>Regla del modo edición:</strong> si hay notas seleccionadas, las flechas editan notas; limpia la selección para mover el transporte.',
    '<strong>Cmd/Ctrl + Z:</strong> undo the most recent committed note edit.': '<strong>Cmd/Ctrl + Z:</strong> deshace la última edición de notas confirmada.',
    '<strong>Shift + Cmd/Ctrl + Z:</strong> redo the latest undone edit.': '<strong>Shift + Cmd/Ctrl + Z:</strong> rehace la última edición deshecha.',
    '<strong>Ctrl + Y:</strong> alternative redo shortcut.': '<strong>Ctrl + Y:</strong> atajo alternativo para rehacer.',
    '<strong>History scope:</strong> add, delete, drag, duplicate and keyboard note moves/resizes.': '<strong>Alcance del historial:</strong> añadir, borrar, arrastrar, duplicar y mover/redimensionar notas con teclado.',
    '<strong>Cmd/Ctrl + Click:</strong> add or remove notes from selection.': '<strong>Cmd/Ctrl + Clic:</strong> añade o quita notas de la selección.',
    '<strong>Drag on empty editor space:</strong> lasso/box select multiple notes at once.': '<strong>Arrastrar en espacio vacío:</strong> selección por lazo/cuadro de varias notas.',
    '<strong>Cmd/Ctrl + A:</strong> select all editable notes in the current view.': '<strong>Cmd/Ctrl + A:</strong> selecciona todas las notas editables de la vista actual.',
    '<strong>Delete / Backspace:</strong> remove every selected note at once.': '<strong>Delete / Backspace:</strong> elimina todas las notas seleccionadas a la vez.',
    '<strong>Cmd/Ctrl + D and arrows:</strong> duplicate or move the full selection together.': '<strong>Cmd/Ctrl + D y flechas:</strong> duplica o mueve toda la selección a la vez.',
    '<strong>X controls:</strong> horizontal zoom out / reset / in.': '<strong>Controles X:</strong> zoom horizontal menos / reset / más.',
    '<strong>Y controls:</strong> vertical zoom out / reset / in.': '<strong>Controles Y:</strong> zoom vertical menos / reset / más.',
    '<strong>Saved per view:</strong> roll uses rollZoomX/rollZoomY and score uses scoreZoomX/scoreZoomY.': '<strong>Guardado por vista:</strong> roll usa rollZoomX/rollZoomY y partitura usa scoreZoomX/scoreZoomY.',
    '<strong>Finger Labels button:</strong> toggles finger suggestions on editable notes.': '<strong>Botón Finger Labels:</strong> activa o desactiva sugerencias de dedos en notas editables.',
    '<strong>Smart Auto mode:</strong> assigns automatic finger suggestions per hand.': '<strong>Modo Auto inteligente:</strong> asigna sugerencias automáticas por mano.',
    '<strong>Manual mode:</strong> fingers appear only when you assign them.': '<strong>Modo manual:</strong> los dedos aparecen solo cuando los asignas.',
    '<strong>Click a finger badge:</strong> cycle manual finger override (1 → 5).': '<strong>Clic en una etiqueta de dedo:</strong> recorre la asignación manual (1 → 5).',
    '<strong>Shift + Click badge:</strong> cycle backward (5 → 1).': '<strong>Shift + clic en etiqueta:</strong> recorre hacia atrás (5 → 1).',
    '<strong>Right click badge:</strong> clear manual override on that note.': '<strong>Clic derecho en etiqueta:</strong> limpia la asignación manual de esa nota.',
    '<strong>Keys 1..5:</strong> assign that finger to selected note(s), <strong>0:</strong> clear override.': '<strong>Teclas 1..5:</strong> asigna ese dedo a las notas seleccionadas, <strong>0:</strong> limpia la asignación.',
    '<strong>Drag note up/down:</strong> moves pitch by staff position.': '<strong>Arrastrar nota arriba/abajo:</strong> mueve la altura por posición en el pentagrama.',
    '<strong>Arrow Up/Down:</strong> move selected notes by semitone.': '<strong>Flecha Arriba/Abajo:</strong> mueve notas seleccionadas por semitono.',
    '<strong>Shift + Arrow Up/Down:</strong> move by octave.': '<strong>Shift + Flecha Arriba/Abajo:</strong> mueve por octava.',
    '<strong>Drag note left/right:</strong> moves start time without changing duration.': '<strong>Arrastrar nota izquierda/derecha:</strong> mueve el inicio sin cambiar la duración.',
    '<strong>Arrow Left/Right:</strong> nudge selected notes in time.': '<strong>Flecha Izq./Der.:</strong> desplaza en tiempo las notas seleccionadas.',
    '<strong>Shift + Arrow Left/Right:</strong> larger time step.': '<strong>Shift + Flecha Izq./Der.:</strong> paso temporal más grande.',
    '<strong>Drag right tail:</strong> change note length.': '<strong>Arrastrar cola derecha:</strong> cambia la longitud de la nota.',
    '<strong>[ / ]:</strong> shorten or lengthen selected notes.': '<strong>[ / ]:</strong> acorta o alarga las notas seleccionadas.',
    '<strong>Shift + [ / ]:</strong> larger duration step.': '<strong>Shift + [ / ]:</strong> paso de duración más grande.',
    '<strong>Double click empty staff space:</strong> creates a note at that pitch and time.': '<strong>Doble clic en zona vacía del pentagrama:</strong> crea una nota en esa altura y tiempo.',
    '<strong>Delete / Backspace:</strong> remove selected note(s).': '<strong>Delete / Backspace:</strong> elimina la(s) nota(s) seleccionada(s).',
    '<strong>Right click:</strong> remove hovered note quickly.': '<strong>Clic derecho:</strong> elimina rápidamente la nota bajo el cursor.',
    '<strong>Cmd/Ctrl + D:</strong> copy selected note(s) to the next rhythmic slot.': '<strong>Cmd/Ctrl + D:</strong> copia la(s) nota(s) seleccionada(s) al siguiente pulso rítmico.',
    '<strong>Drag left/right:</strong> changes pitch lane in the roll.': '<strong>Arrastrar izquierda/derecha:</strong> cambia el carril de altura en el roll.',
    '<strong>Arrow Left/Right:</strong> move selected note pitch by semitone.': '<strong>Flecha Izq./Der.:</strong> mueve la altura de la nota seleccionada por semitono.',
    '<strong>Shift + Arrow Left/Right:</strong> move by octave.': '<strong>Shift + Flecha Izq./Der.:</strong> mueve por octava.',
    '<strong>Shift + Drag:</strong> move note in time while keeping pitch fixed.': '<strong>Shift + Arrastrar:</strong> mueve la nota en el tiempo manteniendo la altura.',
    '<strong>Arrow Up/Down:</strong> nudge selected notes in time.': '<strong>Flecha Arriba/Abajo:</strong> desplaza en tiempo las notas seleccionadas.',
    '<strong>Shift + Arrow Up/Down:</strong> larger time step.': '<strong>Shift + Flecha Arriba/Abajo:</strong> paso temporal más grande.',
    '<strong>Drag top edge up/down:</strong> resize note duration.': '<strong>Arrastrar borde superior arriba/abajo:</strong> redimensiona la duración de la nota.',
    '<strong>Double click empty roll space:</strong> create a new note.': '<strong>Doble clic en zona vacía del roll:</strong> crea una nueva nota.',
    '<strong>Cmd/Ctrl + D:</strong> duplicate selected note(s) forward in time.': '<strong>Cmd/Ctrl + D:</strong> duplica la(s) nota(s) seleccionada(s) hacia delante en el tiempo.',
    'Score disclaimer:': 'Aviso de partitura:',
    'this is not a professional engraving score. It is designed only for interactive note editing.': 'esto no es una partitura de grabado profesional. Está diseñada solo para edición interactiva de notas.',
    'Score view enabled. You can edit notes directly on the staff.': 'Vista de partitura activada. Puedes editar notas directamente en el pentagrama.',
    'Piano roll view enabled.': 'Vista de piano roll activada.',
    'Edit mode enabled. Use the visual guide for roll and score shortcuts.': 'Modo edición activado. Usa la guía visual para atajos de roll y partitura.',
    'Edit mode disabled.': 'Modo edición desactivado.',
    'Finger suggestions enabled (smart auto algorithm).': 'Sugerencias de dedos activadas (algoritmo auto inteligente).',
    'Finger labels enabled in manual mode.': 'Etiquetas de dedos activadas en modo manual.',
    'Finger labels disabled.': 'Etiquetas de dedos desactivadas.',
    'Smart finger suggestion enabled.': 'Sugerencia de dedos inteligente activada.',
    'Manual fingering mode enabled.': 'Modo de digitación manual activado.',
    'Edit notes': 'Editar notas',
    'Delete notes': 'Borrar notas',
    'Duplicate notes': 'Duplicar notas',
    'Add note': 'Añadir nota',
    'Set manual fingering': 'Asignar digitación manual',
    'Clear manual fingering': 'Limpiar digitación manual',
    'Change note duration': 'Cambiar duración de la nota',
    'Move note timing': 'Mover tiempo de la nota',
    'Change note pitch': 'Cambiar altura de la nota',
    'Move note pitch and timing': 'Mover altura y tiempo de la nota',
    edit: 'edición',
    undo: 'deshacer',
    redo: 'rehacer',
    restore: 'restaurar',
  },
  ca: {
    Dashboard: 'Tauler',
    History: 'Historial',
    Settings: 'Configuració',
    Home: 'Inici',
    'AUDIO INPUT': 'ENTRADA D\'ÀUDIO',
    'Record piano audio': 'Gravar àudio de piano',
    '● Recording...': '● Gravant...',
    'Record Source': 'Font de gravació',
    'Ambient Mic': 'Micròfon ambient',
    'Internal Piano': 'Piano intern',
    'Upload audio file': 'Pujar fitxer d\'àudio',
    'Upload MIDI file': 'Pujar fitxer MIDI',
    'Drag and drop audio here (.wav, .mp3, .flac, .ogg, .m4a, .webm)': 'Arrossega i deixa anar l\'àudio aquí (.wav, .mp3, .flac, .ogg, .m4a, .webm)',
    'Drag and drop a MIDI file here (.mid, .midi)': 'Arrossega i deixa anar un fitxer MIDI aquí (.mid, .midi)',
    'Drag and drop audio or MIDI here (.wav, .mp3, .flac, .ogg, .m4a, .webm, .mid, .midi)': 'Arrossega i deixa anar àudio o MIDI aquí (.wav, .mp3, .flac, .ogg, .m4a, .webm, .mid, .midi)',
    Clear: 'Netejar',
    'AI MODEL': 'MODEL IA',
    'Convert to MIDI': 'Convertir a MIDI',
    'Re-convert to MIDI': 'Tornar a convertir a MIDI',
    'Compare Both Models': 'Comparar tots dos models',
    'Transformer-based model': 'Model basat en Transformer',
    'Google Magenta model': 'Model Google Magenta',
    'Transformer-based model. Balanced performance': 'Model basat en Transformer. Rendiment equilibrat',
    'Google Magenta model. Optimal for clean recordings': 'Model Google Magenta. Òptim per a gravacions netes',
    Recommended: 'Recomanat',
    'MIDI PLAYER': 'REPRODUCTOR MIDI',
    Demo: 'Demo',
    Upload: 'Pujar',
    Transcribe: 'Transcriure',
    'Build MIDI': 'Construir MIDI',
    Notes: 'Notes',
    Duration: 'Durada',
    Tempo: 'Tempo',
    'No MIDI yet': 'Encara no hi ha MIDI',
    'Upload or record audio, then convert.': 'Puja o grava àudio i després converteix.',
    'Export .mid file': 'Exportar fitxer .mid',
    Instrument: 'Instrument',
    'Virtual Keyboard: A W S E D F T G Y H U J · K O L P ; \' · Z X C V B N M': 'Teclat virtual: A W S E D F T G Y H U J · K O L P ; \' · Z X C V B N M',
    'Keyboard Notes': 'Notes ↔ teclat',
    'Hide Keyboard Notes': 'Amagar notes ↔ teclat',
    'Computer Keyboard Mapping': 'Equivalència teclat de l\'ordinador',
    'MIDI Source:': 'Font MIDI:',
    'PIANO ROLL': 'PIANO ROLL',
    'MUSIC SCORE': 'PARTITURA',
    Roll: 'Roll',
    Score: 'Partitura',
    'Editing On': 'Edició activada',
    'Edit Notes': 'Editar notes',
    'Finger Labels On': 'Dits activats',
    'Finger Labels': 'Etiquetes de dits',
    'Readable Score': 'Partitura llegible',
    'Hide Guide': 'Amagar guia',
    'Show Guide': 'Mostrar guia',
    'Ready · Press play': 'A punt · Prem play',
    'Waiting for MIDI': 'Esperant MIDI',
    Undo: 'Desfer',
    Redo: 'Refer',
    'Hide History': 'Amagar historial',
    Finger: 'Dit',
    'Smart Auto': 'Auto intel·ligent',
    'Manual Only': 'Només manual',
    'MODEL COMPARE': 'COMPARACIÓ DE MODELS',
    'Comparing models…': 'Comparant models…',
    'Running model comparison…': 'Executant comparació de models…',
    'Conversion failed': 'Conversió fallida',
    'Time:': 'Temps:',
    'Notes:': 'Notes:',
    'Dur:': 'Dur:',
    'Tempo:': 'Tempo:',
    'MIDI:': 'MIDI:',
    'audio file': 'fitxer d\'àudio',
    '88 KEYS · SYNTHESIA VIEW': '88 TECLES · VISTA SYNTHESIA',
    'GRAND STAFF · EDITABLE': 'DOBLE PENTAGRAMA · EDITABLE',
    'MIDI conversion complete!': 'Conversió MIDI completada!',
    'MIDI ready.': 'MIDI a punt.',
    'Use Result': 'Fer servir resultat',
    Download: 'Descarregar',
    Retry: 'Reintentar',
    'No result yet': 'Sense resultat encara',
    'No conversions found': 'No s\'han trobat conversions',
    'Try adjusting your filters': 'Prova d\'ajustar els filtres',
    'Total Conversions': 'Total conversions',
    Successful: 'Correctes',
    'Total Notes': 'Total notes',
    'Avg Duration': 'Durada mitjana',
    'All Models': 'Tots els models',
    'Search files...': 'Cercar fitxers...',
    'Sort:': 'Ordenar:',
    'File Name': 'Fitxer',
    Date: 'Data',
    Model: 'Model',
    Size: 'Mida',
    entries: 'entrades',
    Completed: 'Completades',
    Failed: 'Fallides',
    Language: 'Idioma',
    Transcription: 'Transcripció',
    Playback: 'Reproducció',
    Notifications: 'Notificacions',
    'Reset Defaults': 'Restablir',
    'Browser Notifications': 'Notificacions del navegador',
    'Current Setup': 'Configuració actual',
    'Settings': 'Configuració',
    'AI-POWERED PIANO TRANSCRIPTION': 'TRANSCRIPCIÓ DE PIANO AMB IA',
    'Convert Piano Audio': 'Converteix àudio de piano',
    'to MIDI Instantly': 'a MIDI a l\'instant',
    'Upload your piano recordings or record live. Our AI-powered transcription engine converts your performance into accurate MIDI files in seconds.': 'Puja les teves gravacions de piano o grava en directe. El nostre motor de transcripció amb IA converteix la teva interpretació en fitxers MIDI precisos en segons.',
    'Launch WidiAI': 'Obrir WidiAI',
    'No registration required • Works locally • Browser-based workflow': 'Sense registre • Funciona en local • Flux al navegador',
    'Basic controls that are directly connected to conversion and playback.': 'Controls bàsics connectats directament a la conversió i la reproducció.',
    'Changes are saved automatically.': 'Els canvis es desen automàticament.',
    'Backend API URL': 'URL de l\'API backend',
    'Used for conversion requests.': 'S\'utilitza per a les peticions de conversió.',
    'Current endpoint:': 'Endpoint actual:',
    'Default Model': 'Model predeterminat',
    'Active model for new conversions.': 'Model actiu per a noves conversions.',
    'Auto-convert After Upload / Recording': 'Auto-conversió després de pujar / gravar',
    'Starts conversion immediately when audio is loaded.': 'Inicia la conversió immediatament quan es carrega l\'àudio.',
    'Choose microphone or internal piano bus for recording.': 'Tria micròfon o bus intern del piano per gravar.',
    'Finger Suggestion Algorithm': 'Algoritme de suggeriment de dits',
    'Use SF2 Soundfont Engine': 'Fer servir el motor SF2 Soundfont',
    'When enabled, playback uses the selected SF2 soundfont when available.': 'Quan està activat, la reproducció utilitza el SF2 seleccionat quan està disponible.',
    'Use Full Grand Piano.sf2': 'Fer servir Full Grand Piano.sf2',
    'When enabled, playback uses the SF2 soundfont when available.': 'Quan està activat, la reproducció fa servir el soundfont SF2 quan està disponible.',
    'SF2 Instrument': 'Instrument SF2',
    'Select the instrument used by the SF2 preview engine.': 'Selecciona l\'instrument utilitzat pel motor de previsualització SF2.',
    'Pedal Assist (anti-staccato)': 'Assistència de pedal (anti-staccato)',
    'Extends note tails to preserve legato feel when the source is not staccato.': 'Allarga la cua de les notes per mantenir una sensació legato quan la font no és staccato.',
    'Pedal Assist Amount': 'Intensitat d\'assistència de pedal',
    'Higher values keep notes sustained longer.': 'Valors alts mantenen les notes més sostingudes.',
    'Playback Dynamics': 'Dinàmica de reproducció',
    'Scales note velocity for preview and MIDI playback.': 'Escala la velocitat de les notes per a la previsualització i reproducció MIDI.',
    'Interface Language': 'Idioma de la interfície',
    'Choose English, Spanish, or Catalan.': 'Tria anglès, espanyol o català.',
    'Current Language Setup': 'Configuració d\'idioma actual',
    'Mode:': 'Mode:',
    'Smart Auto uses a global dynamic-programming pass with playability constraints.': 'Auto intel·ligent fa servir una passada global de programació dinàmica amb restriccions de tocabilitat.',
    'Save': 'Desar',
    'Test': 'Provar',
    'Go to home': 'Anar a l\'inici',
    'Language switch': 'Selector d\'idioma',
    'Testing connection to': 'Provant connexió amb',
    'Connection successful:': 'Connexió correcta:',
    'Connection failed:': 'Connexió fallida:',
    'Recording source switched to Internal Piano.': 'Font de gravació canviada a Piano intern.',
    'Recording source switched to Ambient Mic.': 'Font de gravació canviada a Micròfon ambient.',
    'Internal recording error': 'Error de gravació interna',
    'Microphone error': 'Error de micròfon',
    'Stop recording or wait for processing before loading a MIDI file.': 'Atura la gravació o espera el processament abans de carregar un fitxer MIDI.',
    'Wait for the current conversion to finish before loading a MIDI file.': 'Espera que acabi la conversió actual abans de carregar un fitxer MIDI.',
    'MIDI file is too large. Please choose a smaller .mid/.midi file.': 'El fitxer MIDI és massa gran. Tria un fitxer .mid/.midi més petit.',
    'Invalid file type. Please upload a .mid or .midi file.': 'Tipus de fitxer no vàlid. Puja un fitxer .mid o .midi.',
    'Use the MIDI Player upload button for .mid/.midi files.': 'Per a fitxers .mid/.midi fes servir el botó de pujada del reproductor MIDI.',
    'MIDI loaded: {name}. You can edit notes and export it again.': 'MIDI carregat: {name}. Pots editar notes i tornar-lo a exportar.',
    'MIDI load error:': 'Error en carregar MIDI:',
    'Playback instrument set to {instrument}.': 'Instrument de reproducció canviat a {instrument}.',
    'Playback using {instrument}.': 'Reproducció amb {instrument}.',
    On: 'Activat',
    Off: 'Desactivat',
    'Playback Profile': 'Perfil de reproducció',
    'Choose articulation feel for preview and MIDI playback.': 'Tria el caràcter d’articulació per a la previsualització i reproducció MIDI.',
    Natural: 'Natural',
    Studio: 'Studio',
    Dry: 'Sec',
    'Profile:': 'Perfil:',
    'Edit History': 'Historial d\'edició',
    'Undo {undo} · Redo {redo} · Click to restore': 'Desfer {undo} · Refer {redo} · Clica per restaurar',
    notes: 'notes',
    'No edit actions yet.': 'Encara no hi ha accions d\'edició.',
    'Edit Mode Active': 'Mode edició actiu',
    'Score Editing Guide': 'Guia d\'edició de partitura',
    'Roll Editing Guide': 'Guia d\'edició de roll',
    'Treble Clef': 'Clau de sol',
    'Bass Clef': 'Clau de fa',
    'Hover a title to see full controls': 'Passa el cursor per un títol per veure tots els controls',
    'Playback Controls': 'Controls de reproducció',
    'Undo / Redo': 'Desfer / Refer',
    'Multi-select': 'Selecció múltiple',
    Zoom: 'Zoom',
    Pitch: 'Altura',
    Time: 'Temps',
    Add: 'Afegir',
    Delete: 'Esborrar',
    Duplicate: 'Duplicar',
    '<strong>Space:</strong> toggles play/pause from the current cursor time (it does not reset).': '<strong>Espai:</strong> alterna play/pausa des del cursor actual (no es reinicia).',
    '<strong>Arrow Left/Right:</strong> seek the transport by 0.5 seconds.': '<strong>Fletxa Esq./Dreta:</strong> mou el transport 0,5 segons.',
    '<strong>Shift + Arrow Left/Right:</strong> seek by 2 seconds for faster navigation.': '<strong>Shift + Fletxa Esq./Dreta:</strong> mou 2 segons per navegar més ràpid.',
    '<strong>Edit mode rule:</strong> if notes are selected, arrows edit notes; clear selection to seek transport.': '<strong>Regla del mode edició:</strong> si hi ha notes seleccionades, les fletxes editen notes; neteja la selecció per moure el transport.',
    '<strong>Cmd/Ctrl + Z:</strong> undo the most recent committed note edit.': '<strong>Cmd/Ctrl + Z:</strong> desfà l\'última edició de notes confirmada.',
    '<strong>Shift + Cmd/Ctrl + Z:</strong> redo the latest undone edit.': '<strong>Shift + Cmd/Ctrl + Z:</strong> refà l\'última edició desfeta.',
    '<strong>Ctrl + Y:</strong> alternative redo shortcut.': '<strong>Ctrl + Y:</strong> drecera alternativa per refer.',
    '<strong>History scope:</strong> add, delete, drag, duplicate and keyboard note moves/resizes.': '<strong>Abast de l\'historial:</strong> afegir, esborrar, arrossegar, duplicar i moure/redimensionar notes amb teclat.',
    '<strong>Cmd/Ctrl + Click:</strong> add or remove notes from selection.': '<strong>Cmd/Ctrl + Clic:</strong> afegeix o treu notes de la selecció.',
    '<strong>Drag on empty editor space:</strong> lasso/box select multiple notes at once.': '<strong>Arrossegar en espai buit:</strong> selecció per llaç/caixa de diverses notes.',
    '<strong>Cmd/Ctrl + A:</strong> select all editable notes in the current view.': '<strong>Cmd/Ctrl + A:</strong> selecciona totes les notes editables de la vista actual.',
    '<strong>Delete / Backspace:</strong> remove every selected note at once.': '<strong>Delete / Backspace:</strong> elimina totes les notes seleccionades alhora.',
    '<strong>Cmd/Ctrl + D and arrows:</strong> duplicate or move the full selection together.': '<strong>Cmd/Ctrl + D i fletxes:</strong> duplica o mou tota la selecció alhora.',
    '<strong>X controls:</strong> horizontal zoom out / reset / in.': '<strong>Controls X:</strong> zoom horitzontal menys / reset / més.',
    '<strong>Y controls:</strong> vertical zoom out / reset / in.': '<strong>Controls Y:</strong> zoom vertical menys / reset / més.',
    '<strong>Saved per view:</strong> roll uses rollZoomX/rollZoomY and score uses scoreZoomX/scoreZoomY.': '<strong>Desat per vista:</strong> roll usa rollZoomX/rollZoomY i partitura usa scoreZoomX/scoreZoomY.',
    '<strong>Finger Labels button:</strong> toggles finger suggestions on editable notes.': '<strong>Botó Finger Labels:</strong> activa o desactiva suggeriments de dits en notes editables.',
    '<strong>Smart Auto mode:</strong> assigns automatic finger suggestions per hand.': '<strong>Mode Auto intel·ligent:</strong> assigna suggeriments automàtics per mà.',
    '<strong>Manual mode:</strong> fingers appear only when you assign them.': '<strong>Mode manual:</strong> els dits apareixen només quan els assignes.',
    '<strong>Click a finger badge:</strong> cycle manual finger override (1 → 5).': '<strong>Clic a una etiqueta de dit:</strong> recorre l\'assignació manual (1 → 5).',
    '<strong>Shift + Click badge:</strong> cycle backward (5 → 1).': '<strong>Shift + clic a etiqueta:</strong> recorre enrere (5 → 1).',
    '<strong>Right click badge:</strong> clear manual override on that note.': '<strong>Clic dret a etiqueta:</strong> neteja l\'assignació manual d\'aquesta nota.',
    '<strong>Keys 1..5:</strong> assign that finger to selected note(s), <strong>0:</strong> clear override.': '<strong>Tecles 1..5:</strong> assigna aquest dit a les notes seleccionades, <strong>0:</strong> neteja l\'assignació.',
    '<strong>Drag note up/down:</strong> moves pitch by staff position.': '<strong>Arrossegar nota amunt/avall:</strong> mou l\'altura per posició al pentagrama.',
    '<strong>Arrow Up/Down:</strong> move selected notes by semitone.': '<strong>Fletxa Amunt/Avall:</strong> mou notes seleccionades per semitò.',
    '<strong>Shift + Arrow Up/Down:</strong> move by octave.': '<strong>Shift + Fletxa Amunt/Avall:</strong> mou per octava.',
    '<strong>Drag note left/right:</strong> moves start time without changing duration.': '<strong>Arrossegar nota esquerra/dreta:</strong> mou l\'inici sense canviar la durada.',
    '<strong>Arrow Left/Right:</strong> nudge selected notes in time.': '<strong>Fletxa Esq./Dreta:</strong> desplaça en temps les notes seleccionades.',
    '<strong>Shift + Arrow Left/Right:</strong> larger time step.': '<strong>Shift + Fletxa Esq./Dreta:</strong> pas temporal més gran.',
    '<strong>Drag right tail:</strong> change note length.': '<strong>Arrossegar cua dreta:</strong> canvia la longitud de la nota.',
    '<strong>[ / ]:</strong> shorten or lengthen selected notes.': '<strong>[ / ]:</strong> escurça o allarga les notes seleccionades.',
    '<strong>Shift + [ / ]:</strong> larger duration step.': '<strong>Shift + [ / ]:</strong> pas de durada més gran.',
    '<strong>Double click empty staff space:</strong> creates a note at that pitch and time.': '<strong>Doble clic en zona buida del pentagrama:</strong> crea una nota en aquella altura i temps.',
    '<strong>Delete / Backspace:</strong> remove selected note(s).': '<strong>Delete / Backspace:</strong> elimina la/les nota(es) seleccionada(es).',
    '<strong>Right click:</strong> remove hovered note quickly.': '<strong>Clic dret:</strong> elimina ràpidament la nota sota el cursor.',
    '<strong>Cmd/Ctrl + D:</strong> copy selected note(s) to the next rhythmic slot.': '<strong>Cmd/Ctrl + D:</strong> copia la/les nota(es) seleccionada(es) al següent pols rítmic.',
    '<strong>Drag left/right:</strong> changes pitch lane in the roll.': '<strong>Arrossegar esquerra/dreta:</strong> canvia el carril d\'altura al roll.',
    '<strong>Arrow Left/Right:</strong> move selected note pitch by semitone.': '<strong>Fletxa Esq./Dreta:</strong> mou l\'altura de la nota seleccionada per semitò.',
    '<strong>Shift + Arrow Left/Right:</strong> move by octave.': '<strong>Shift + Fletxa Esq./Dreta:</strong> mou per octava.',
    '<strong>Shift + Drag:</strong> move note in time while keeping pitch fixed.': '<strong>Shift + Arrossegar:</strong> mou la nota en el temps mantenint l\'altura.',
    '<strong>Arrow Up/Down:</strong> nudge selected notes in time.': '<strong>Fletxa Amunt/Avall:</strong> desplaça en temps les notes seleccionades.',
    '<strong>Shift + Arrow Up/Down:</strong> larger time step.': '<strong>Shift + Fletxa Amunt/Avall:</strong> pas temporal més gran.',
    '<strong>Drag top edge up/down:</strong> resize note duration.': '<strong>Arrossegar vora superior amunt/avall:</strong> redimensiona la durada de la nota.',
    '<strong>Double click empty roll space:</strong> create a new note.': '<strong>Doble clic en zona buida del roll:</strong> crea una nota nova.',
    '<strong>Cmd/Ctrl + D:</strong> duplicate selected note(s) forward in time.': '<strong>Cmd/Ctrl + D:</strong> duplica la/les nota(es) seleccionada(es) cap endavant en el temps.',
    'Score disclaimer:': 'Avís de partitura:',
    'this is not a professional engraving score. It is designed only for interactive note editing.': 'això no és una partitura de gravat professional. Està dissenyada només per a l\'edició interactiva de notes.',
    'Score view enabled. You can edit notes directly on the staff.': 'Vista de partitura activada. Pots editar notes directament al pentagrama.',
    'Piano roll view enabled.': 'Vista de piano roll activada.',
    'Edit mode enabled. Use the visual guide for roll and score shortcuts.': 'Mode edició activat. Fes servir la guia visual per a dreceres de roll i partitura.',
    'Edit mode disabled.': 'Mode edició desactivat.',
    'Finger suggestions enabled (smart auto algorithm).': 'Suggeriments de dits activats (algoritme auto intel·ligent).',
    'Finger labels enabled in manual mode.': 'Etiquetes de dits activades en mode manual.',
    'Finger labels disabled.': 'Etiquetes de dits desactivades.',
    'Smart finger suggestion enabled.': 'Suggeriment de dits intel·ligent activat.',
    'Manual fingering mode enabled.': 'Mode de digitació manual activat.',
    'Edit notes': 'Editar notes',
    'Delete notes': 'Esborrar notes',
    'Duplicate notes': 'Duplicar notes',
    'Add note': 'Afegir nota',
    'Set manual fingering': 'Assignar digitació manual',
    'Clear manual fingering': 'Netejar digitació manual',
    'Change note duration': 'Canviar durada de la nota',
    'Move note timing': 'Moure temps de la nota',
    'Change note pitch': 'Canviar altura de la nota',
    'Move note pitch and timing': 'Moure altura i temps de la nota',
    edit: 'edició',
    undo: 'desfer',
    redo: 'refer',
    restore: 'restaurar',
  },
};

const UI_DYNAMIC_TRANSLATION_RULES = {
  es: [
    { re: /^Comparison finished\. (\d+)\/2 model\(s\) produced MIDI\.$/, fmt: m => `Comparación terminada. ${m[1]}/2 modelo(s) generaron MIDI.` },
    { re: /^Comparison finished with errors in both models\.$/, fmt: () => 'La comparación terminó con errores en ambos modelos.' },
    { re: /^Running model comparison…$/, fmt: () => 'Ejecutando comparación de modelos…' },
    { re: /^Comparing: (.+)…$/, fmt: m => `Comparando: ${m[1]}…` },
    { re: /^(.+) result loaded from comparison\.$/, fmt: m => `Resultado de ${m[1]} cargado desde la comparación.` },
    { re: /^(.+) comparison completed\.$/, fmt: m => `Comparación de ${m[1]} completada.` },
    { re: /^(.+) comparison failed\.$/, fmt: m => `Comparación de ${m[1]} fallida.` },
    { re: /^Model switched to (.+)\. Press Convert to re-transcribe the same audio\.$/, fmt: m => `Modelo cambiado a ${m[1]}. Pulsa Convert para transcribir de nuevo el mismo audio.` },
    { re: /^Saved locally: (.+)$/, fmt: m => `Guardado localmente: ${m[1]}` },
    { re: /^Restore to (.+)$/, fmt: m => `Restaurar a ${m[1]}` },
    { re: /^Undo · (.+)$/, fmt: m => `Deshacer · ${_translateStaticString(m[1], 'es')}` },
    { re: /^Redo · (.+)$/, fmt: m => `Rehacer · ${_translateStaticString(m[1], 'es')}` },
    { re: /^Restore · (.+)$/, fmt: m => `Restaurar · ${_translateStaticString(m[1], 'es')}` },
  ],
  ca: [
    { re: /^Comparison finished\. (\d+)\/2 model\(s\) produced MIDI\.$/, fmt: m => `Comparació acabada. ${m[1]}/2 model(s) han generat MIDI.` },
    { re: /^Comparison finished with errors in both models\.$/, fmt: () => 'La comparació ha acabat amb errors en tots dos models.' },
    { re: /^Running model comparison…$/, fmt: () => 'Executant comparació de models…' },
    { re: /^Comparing: (.+)…$/, fmt: m => `Comparant: ${m[1]}…` },
    { re: /^(.+) result loaded from comparison\.$/, fmt: m => `Resultat de ${m[1]} carregat des de la comparació.` },
    { re: /^(.+) comparison completed\.$/, fmt: m => `Comparació de ${m[1]} completada.` },
    { re: /^(.+) comparison failed\.$/, fmt: m => `Comparació de ${m[1]} fallida.` },
    { re: /^Model switched to (.+)\. Press Convert to re-transcribe the same audio\.$/, fmt: m => `Model canviat a ${m[1]}. Prem Convert per transcriure de nou el mateix àudio.` },
    { re: /^Saved locally: (.+)$/, fmt: m => `Desat localment: ${m[1]}` },
    { re: /^Restore to (.+)$/, fmt: m => `Restaurar a ${m[1]}` },
    { re: /^Undo · (.+)$/, fmt: m => `Desfer · ${_translateStaticString(m[1], 'ca')}` },
    { re: /^Redo · (.+)$/, fmt: m => `Refer · ${_translateStaticString(m[1], 'ca')}` },
    { re: /^Restore · (.+)$/, fmt: m => `Restaurar · ${_translateStaticString(m[1], 'ca')}` },
  ],
};

function _replaceAllLiteral(source, search, replacement) {
  if (!search || search === replacement) return source;
  if (!source.includes(search)) return source;
  return source.split(search).join(replacement);
}

function _translateDynamicString(trimmed, lang) {
  const rules = UI_DYNAMIC_TRANSLATION_RULES[lang] || [];
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    const match = trimmed.match(rule.re);
    if (!match) continue;
    return typeof rule.fmt === 'function' ? rule.fmt(match) : trimmed;
  }
  return '';
}

function _uiText(raw) {
  const value = String(raw || '');
  const lang = normalizeUiLanguage(state.uiLanguage);
  if (lang === 'en') return value;
  return _translateStaticString(value, lang);
}

function _tk(key, vars = {}, fallback = '') {
  const lang = normalizeUiLanguage(state.uiLanguage);
  return translateKey(lang, key, vars, fallback);
}

function _uiFormat(template, values = {}) {
  let output = _uiText(template);
  Object.keys(values).forEach(key => {
    output = output.split(`{${key}}`).join(String(values[key]));
  });
  return output;
}

function _translateStaticString(raw, lang) {
  const table = UI_STATIC_TRANSLATIONS[lang];
  if (!table) return raw;
  const source = String(raw || '');
  const trimmed = source.trim();
  if (!trimmed) return source;

  const exact = table[trimmed];
  if (typeof exact === 'string' && exact) {
    return source.replace(trimmed, exact);
  }

  const dynamic = _translateDynamicString(trimmed, lang);
  if (dynamic) {
    return source.replace(trimmed, dynamic);
  }

  let translated = source;
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  keys.forEach(key => {
    if (!key || key.length < 4) return;
    translated = _replaceAllLiteral(translated, key, table[key]);
  });
  return translated;
}

function _collectTranslatableTextNodes(root) {
  if (!root) return [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) continue;
    const raw = node.nodeValue || '';
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (!/[A-Za-z]/.test(trimmed)) continue;
    nodes.push(node);
  }
  return nodes;
}

function _applyStaticUiLanguage(root, lang) {
  if (!root || (lang !== 'es' && lang !== 'ca')) return;
  const textNodes = _collectTranslatableTextNodes(root);
  textNodes.forEach(node => {
    node.nodeValue = _translateStaticString(node.nodeValue, lang);
  });

  root.querySelectorAll('input[placeholder], [title], [aria-label]').forEach(el => {
    if (el.hasAttribute('placeholder')) {
      const next = _translateStaticString(el.getAttribute('placeholder') || '', lang);
      el.setAttribute('placeholder', next);
    }
    if (el.hasAttribute('title')) {
      const next = _translateStaticString(el.getAttribute('title') || '', lang);
      el.setAttribute('title', next);
    }
    if (el.hasAttribute('aria-label')) {
      const next = _translateStaticString(el.getAttribute('aria-label') || '', lang);
      el.setAttribute('aria-label', next);
    }
  });
}

function applyUiLanguage() {
  const appRoot = document.querySelector('.widi-app');
  if (!appRoot) return;
  const lang = normalizeUiLanguage(state.uiLanguage);
  state.uiLanguage = lang;

  if (lang === 'es' || lang === 'ca') {
    _applyStaticUiLanguage(appRoot, lang);
    document.documentElement.lang = lang;
    return;
  }
  document.documentElement.lang = 'en';
}

// ═══════════════════════════════════════════════════════════════════
// ROUTER + LAYOUT + INIT
// ═══════════════════════════════════════════════════════════════════

function _syncNavButtons() {
  document.querySelectorAll('[data-app-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.appNav === state.page);
  });
}

function _renderHeader() {
  if (!_appHeader) return;
  const logoHtml = `
    <button type="button" class="w-logo w-logo-btn" data-header-home aria-label="Go to home">
      <div class="w-logo-icon">${ICON.waves(18,'white')}</div>
      <div>
        <div style="display:flex;align-items:center;gap:8px;line-height:1;">
          <span class="w-logo-name">WidiAI</span>
          <span class="w-beta">BETA</span>
        </div>
        <p class="w-logo-sub">Wave MIDI AI</p>
      </div>
    </button>`;
  const langSwitcherHtml = `
    <div class="w-lang-switch" aria-label="Language switch">
      <button type="button" class="w-lang-btn ${state.uiLanguage === 'en' ? 'active' : ''}" data-ui-lang="en">EN</button>
      <button type="button" class="w-lang-btn ${state.uiLanguage === 'es' ? 'active' : ''}" data-ui-lang="es">ES</button>
      <button type="button" class="w-lang-btn ${state.uiLanguage === 'ca' ? 'active' : ''}" data-ui-lang="ca">CA</button>
    </div>`;

  if (state.page === 'home') {
    _appHeader.classList.add('w-header-home');
    _appHeader.innerHTML = `
      ${logoHtml}
      <div class="w-header-right">
        ${langSwitcherHtml}
      </div>`;
  } else {
    _appHeader.classList.remove('w-header-home');
    _appHeader.innerHTML = `
      ${logoHtml}
      <div class="w-header-right">
        <nav class="w-nav">
          <button class="w-nav-btn" data-app-nav="dashboard">Dashboard</button>
          <button class="w-nav-btn" data-app-nav="history">History</button>
          <button class="w-nav-btn" data-app-nav="settings">Settings</button>
        </nav>
        ${langSwitcherHtml}
      </div>`;
    _appHeader.querySelectorAll('[data-app-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof _navigateToPage === 'function') _navigateToPage(btn.dataset.appNav);
      });
    });
  }

  _appHeader.querySelector('[data-header-home]')?.addEventListener('click', () => {
    if (typeof _navigateToPage === 'function') _navigateToPage('home');
  });
  _appHeader.querySelectorAll('[data-ui-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextLang = normalizeUiLanguage(btn.dataset.uiLang);
      if (nextLang === state.uiLanguage) return;
      state.uiLanguage = nextLang;
      persistUiLanguageSettings();
      _renderHeader();
      const content = document.getElementById('w-content');
      if (content) renderPage(content);
    });
  });

  _syncNavButtons();
}

function renderPage(content) {
  if (state.page !== 'dashboard') {
    _releaseComputerKeyboardPiano();
  }
  if (state.page === 'home') {
    renderHome(content);
  } else if (state.page === 'dashboard') {
    renderDashboard(content);
  } else if (state.page === 'history') {
    renderHistory(content);
  } else if (state.page === 'settings') {
    renderSettings(content);
  }
  applyUiLanguage();
}

export function init(container) {
  const hasStoredApiUrl = Boolean(readLocalStorage(STORAGE_KEYS.apiUrl));
  if (!hasStoredApiUrl) {
    state.apiUrl = getConfiguredApiUrl();
  }
  injectCSS(container);
  container.className = 'widi-app';
  bindAudioUnlock();
  bindTransportShortcuts();
  persistAppSettings();
  persistUiLanguageSettings();

  // Background glow orbs
  const orbLayer = document.createElement('div');
  orbLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0;';
  [['15%','30%','#3b82f6'], ['80%','20%','#8b5cf6'], ['50%','80%','#6366f1']].forEach(([x,y,c]) => {
    const o = document.createElement('div');
    o.className = 'w-orb';
    o.style.cssText += `left:${x};top:${y};background:radial-gradient(circle,${c} 0%,transparent 70%);`;
    orbLayer.appendChild(o);
  });
  container.appendChild(orbLayer);

  // Header
  const header = document.createElement('header');
  header.className = 'w-header';
  container.appendChild(header);
  _appHeader = header;

  // Content
  const wrap = document.createElement('div');
  wrap.className = 'w-content';
  const content = document.createElement('div');
  content.id = 'w-content';
  content.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';
  wrap.appendChild(content);
  container.appendChild(wrap);

  const goToPage = page => {
    state.page = page;
    _renderHeader();
    renderPage(content);
  };
  _navigateToPage = goToPage;
  _renderHeader();
  renderPage(content);
  hydrateStoredAudio(content);
  hydrateHistoryEntries(content);

  // Cleanup on unmount
  return () => {
    destroyInstances();
    unbindTransportShortcuts();
    _navigateToPage = null;
    _appHeader = null;
    _dashboardUiCache = null;
    if (_recTimer) clearTimeout(_recTimer);
    if (_progressTimer) clearInterval(_progressTimer);
    if (_audioUrlRef) URL.revokeObjectURL(_audioUrlRef);
    if (state.midiUrl) URL.revokeObjectURL(state.midiUrl);
  };
}
