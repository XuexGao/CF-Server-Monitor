const FRONTEND_ACTIVE_GRACE_MS = 2 * 60 * 1000;

let frontendActiveUntil = 0;

export function markFrontendRealtimeActive(now = Date.now()) {
  frontendActiveUntil = Math.max(frontendActiveUntil, now + FRONTEND_ACTIVE_GRACE_MS);
}

export function hasRecentFrontendRealtimeActivity(now = Date.now()) {
  return now <= frontendActiveUntil;
}
