export function formatCompareElapsed(ms) {
  const value = Math.max(0, Math.round(Number(ms) || 0));
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function estimateCompareDurationMs(audioFile, modelId) {
  const sizeMb = audioFile?.size ? audioFile.size / (1024 * 1024) : 2;
  const model = String(modelId || '').trim().toLowerCase();
  const modelMultiplier = model === 'onsets_and_frames' ? 1.45 : 1;
  const estimated = 7000 + (sizeMb * 3500 * modelMultiplier);
  return Math.max(9000, Math.min(75000, estimated));
}

export function easingProgress(elapsedMs, estimatedMs, startPct, endPct) {
  const safeElapsed = Math.max(0, Number(elapsedMs) || 0);
  const safeEstimate = Math.max(1, Number(estimatedMs) || 1);
  const eased = 1 - Math.exp(-safeElapsed / safeEstimate);
  const target = Number(startPct) + ((Number(endPct) - Number(startPct) - 2) * eased);
  return Math.max(Number(startPct), Math.min(Number(endPct) - 1, target));
}
