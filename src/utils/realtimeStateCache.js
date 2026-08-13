const REALTIME_STATE_CACHE_TTL_MS = 4 * 60 * 1000;
const MAX_REALTIME_STATE_CACHE_ENTRIES = 100;

const realtimeStateCache = new Map();

function normalizeServerIds(serverIds) {
  return Array.from(new Set(
    (Array.isArray(serverIds) ? serverIds : [])
      .map(serverId => String(serverId || '').trim())
      .filter(Boolean)
  ));
}

function normalizeCacheOptions(options = {}) {
  return {
    includeLatencyWindows: options?.includeLatencyWindows !== false
  };
}

function getCacheKey(serverIds, options = {}) {
  const idsKey = normalizeServerIds(serverIds).join('\u0000');
  if (!idsKey) return '';

  const { includeLatencyWindows } = normalizeCacheOptions(options);
  return `${includeLatencyWindows ? 'with-latency' : 'base'}:${idsKey}`;
}

function pruneRealtimeStateCache(now = Date.now()) {
  for (const [key, entry] of realtimeStateCache) {
    if (!entry || now - entry.cachedAt > REALTIME_STATE_CACHE_TTL_MS) {
      realtimeStateCache.delete(key);
    }
  }

  while (realtimeStateCache.size > MAX_REALTIME_STATE_CACHE_ENTRIES) {
    const oldestKey = realtimeStateCache.keys().next().value;
    if (oldestKey === undefined) break;
    realtimeStateCache.delete(oldestKey);
  }
}

function normalizeRealtimeState(state = {}, options = {}) {
  const { includeLatencyWindows } = normalizeCacheOptions(options);
  return {
    latestReportUpdates: Array.isArray(state.latestReportUpdates) ? state.latestReportUpdates : [],
    latencyWindows: includeLatencyWindows && Array.isArray(state.latencyWindows) ? state.latencyWindows : []
  };
}

export function getCachedRealtimeState(serverIds, options = {}, now = Date.now()) {
  if (typeof options === 'number') {
    now = options;
    options = {};
  }

  const key = getCacheKey(serverIds, options);
  if (!key) return null;

  pruneRealtimeStateCache(now);
  const entry = realtimeStateCache.get(key);
  if (!entry || now - entry.cachedAt > REALTIME_STATE_CACHE_TTL_MS) return null;

  return {
    ...normalizeRealtimeState(entry, options),
    cacheHit: true,
    cacheAgeMs: Math.max(0, now - entry.cachedAt)
  };
}

export function cacheRealtimeState(serverIds, state, options = {}, cachedAt = Date.now()) {
  if (typeof options === 'number') {
    cachedAt = options;
    options = {};
  }

  const key = getCacheKey(serverIds, options);
  if (!key) return;

  pruneRealtimeStateCache(cachedAt);
  realtimeStateCache.delete(key);
  realtimeStateCache.set(key, {
    cachedAt,
    ...normalizeRealtimeState(state, options)
  });
}
