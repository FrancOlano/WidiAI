export const PLAYBACK_PROFILES = Object.freeze({
  natural: Object.freeze({
    id: 'natural',
    gateScale: 1.0,
    tailBoost: 1.0,
    velocityCurveExp: 0.95,
    velocityGain: 1.0,
    minNoteDuration: 0.04,
    maxTailMs: 420,
  }),
  studio: Object.freeze({
    id: 'studio',
    gateScale: 0.94,
    tailBoost: 0.82,
    velocityCurveExp: 1.08,
    velocityGain: 1.04,
    minNoteDuration: 0.035,
    maxTailMs: 320,
  }),
  dry: Object.freeze({
    id: 'dry',
    gateScale: 0.84,
    tailBoost: 0.58,
    velocityCurveExp: 1.2,
    velocityGain: 0.96,
    minNoteDuration: 0.03,
    maxTailMs: 220,
  }),
});

export function normalizePlaybackProfile(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'studio' || normalized === 'dry') return normalized;
  return 'natural';
}

export function getPlaybackProfile(value) {
  const id = normalizePlaybackProfile(value);
  return PLAYBACK_PROFILES[id] || PLAYBACK_PROFILES.natural;
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function applyPlaybackProfileToNotes(notes, profileValue) {
  const profile = getPlaybackProfile(profileValue);
  const source = Array.isArray(notes) ? notes : [];
  if (!source.length) return [];

  return source.map(note => {
    const midi = Math.max(0, Math.min(127, Math.round(Number(note.note) || 60)));
    const startTime = Math.max(0, Number(note.startTime) || 0);
    const baseDuration = Math.max(0.03, Number(note.duration) || 0.12);
    const velocity = clamp(note.velocity, 1, 127, 96);
    const velocityNorm = velocity / 127;
    const curved = Math.pow(velocityNorm, profile.velocityCurveExp) * profile.velocityGain;
    const shapedVelocity = Math.max(1, Math.min(127, Math.round(curved * 127)));
    const duration = Math.max(profile.minNoteDuration, baseDuration * profile.gateScale);

    return {
      ...note,
      note: midi,
      startTime,
      duration,
      velocity: shapedVelocity,
    };
  });
}

export function computeSf2TailMs({ playbackProfile, pedalAssist, pedalAssistAmount }) {
  const profile = getPlaybackProfile(playbackProfile);
  if (!pedalAssist) {
    return Math.min(profile.maxTailMs, Math.max(55, Math.round(95 * profile.tailBoost)));
  }
  const pedal = Math.max(0, Math.min(1, Number(pedalAssistAmount) || 0));
  const base = 120 + (280 * pedal);
  return Math.min(profile.maxTailMs, Math.max(80, Math.round(base * profile.tailBoost)));
}

export function applyProfileToPedalAmount(rawAmount, playbackProfile) {
  const profile = getPlaybackProfile(playbackProfile);
  const pedal = Math.max(0, Math.min(1, Number(rawAmount) || 0));
  if (profile.id === 'dry') return pedal * 0.62;
  if (profile.id === 'studio') return pedal * 0.82;
  return pedal;
}
