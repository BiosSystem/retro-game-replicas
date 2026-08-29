let frozenUntil = 0;

export function requestVisualHitStop(now: number, durationMs: number) {
  const duration = Math.max(30, Math.min(50, Number.isFinite(durationMs) ? durationMs : 30));
  frozenUntil = Math.max(frozenUntil, now + duration);
  return frozenUntil;
}

export function isVisualFrameFrozen(now: number) {
  return now < frozenUntil;
}

export function resetVisualFrameFreeze() {
  frozenUntil = 0;
}
