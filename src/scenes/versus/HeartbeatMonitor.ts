export type HeartbeatState = 'CONNECTED' | 'INTERRUPTED' | 'FORFEIT';

export class HeartbeatMonitor {
  private lastPacketAt = 0;
  private interruptedAt = 0;
  private state: HeartbeatState = 'CONNECTED';

  observe(nowMs: number) {
    this.lastPacketAt = nowMs;
    this.state = 'CONNECTED';
    return this.state;
  }

  tick(nowMs: number): HeartbeatState {
    if (this.state === 'CONNECTED' && nowMs - this.lastPacketAt > 3000) { this.state = 'INTERRUPTED'; this.interruptedAt = nowMs; }
    if (this.state === 'INTERRUPTED' && nowMs - this.interruptedAt >= 15000) this.state = 'FORFEIT';
    return this.state;
  }

  secondsRemaining(nowMs: number) { return this.state === 'INTERRUPTED' ? Math.max(0, Math.ceil((15000 - (nowMs - this.interruptedAt)) / 1000)) : 0; }
  reset(nowMs: number) { this.lastPacketAt = nowMs; this.interruptedAt = 0; this.state = 'CONNECTED'; }
}
