export function historyTimestamp(value) {
  const ts = Date.parse(String(value || ''));
  if (Number.isNaN(ts)) return 0;
  return ts;
}

export function filterAndSortHistoryEntries(entries, filters, normalizeModelId) {
  const source = Array.isArray(entries) ? entries : [];
  const safeFilters = filters && typeof filters === 'object' ? filters : {};
  const status = String(safeFilters.histStatus || 'all');
  const model = String(safeFilters.histModel || 'all');
  const search = String(safeFilters.histSearch || '').toLowerCase();
  const sort = String(safeFilters.histSort || 'date');

  return source
    .filter(entry => status === 'all' || entry.status === status)
    .filter(entry => model === 'all' || normalizeModelId(entry.modelId) === model)
    .filter(entry => String(entry.fileName || '').toLowerCase().includes(search))
    .sort((a, b) => {
      if (sort === 'notes') return (Number(b.notes) || 0) - (Number(a.notes) || 0);
      if (sort === 'duration') return (Number(b.durationSec) || 0) - (Number(a.durationSec) || 0);
      return historyTimestamp(b.createdAt) - historyTimestamp(a.createdAt);
    });
}

export function summarizeHistory(entries) {
  const source = Array.isArray(entries) ? entries : [];
  const total = source.length;
  const successful = source.filter(entry => entry.status === 'completed').length;
  const totalNotes = source.reduce((acc, entry) => acc + Math.max(0, Number(entry.notes) || 0), 0);
  const avgDurationPool = source.filter(entry => entry.status === 'completed' && Number.isFinite(Number(entry.durationSec)) && Number(entry.durationSec) > 0);
  const avgDurationSec = avgDurationPool.length
    ? avgDurationPool.reduce((acc, entry) => acc + Number(entry.durationSec), 0) / avgDurationPool.length
    : 0;
  return { total, successful, totalNotes, avgDurationSec };
}
