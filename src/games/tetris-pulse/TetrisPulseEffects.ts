export type GarbageSirenState = 'OFF' | 'WATCH' | 'ALERT' | 'CRITICAL';

export class ReactiveGridPulse {
  private intensity = 0;

  trigger(amount = 1) { this.intensity = Math.min(1, Math.max(this.intensity, amount)); return this.intensity; }
  update(deltaMs: number) { this.intensity = Math.max(0, this.intensity - Math.max(0, deltaMs) / 360); return this.intensity; }
  get value() { return this.intensity; }
}

export class GlassShardEmitter {
  private activeUntil = 0;

  emit(nowMs: number, lifeMs = 650) { this.activeUntil = Math.max(this.activeUntil, nowMs + Math.max(1, lifeMs)); }
  update(nowMs: number) { return nowMs < this.activeUntil; }
  reset() { this.activeUntil = 0; }
}

export function garbageSirenState(queuedLines: number): GarbageSirenState {
  if (queuedLines >= 6) return 'CRITICAL';
  if (queuedLines >= 3) return 'ALERT';
  if (queuedLines > 0) return 'WATCH';
  return 'OFF';
}
