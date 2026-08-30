const SAMPLE_WINDOW = 60;

export interface NetworkTelemetrySnapshot {
  rttMs: number;
  jitterMs: number;
  packetLossPercent: number;
  rollbackFrames: number;
  inputDelayFrames: number;
  quality: 'GREEN' | 'YELLOW' | 'RED';
}

export class NetworkTelemetry {
  private readonly rtt = new Float32Array(SAMPLE_WINDOW);
  private count = 0;
  private cursor = 0;
  private sent = 0;
  private received = 0;
  private rollbackFrames = 0;

  recordRtt(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 10_000) return;
    this.rtt[this.cursor] = milliseconds;
    this.cursor = (this.cursor + 1) % SAMPLE_WINDOW;
    this.count = Math.min(SAMPLE_WINDOW, this.count + 1);
  }

  recordSent(): void { this.sent = Math.min(0x7fffffff, this.sent + 1); }
  recordReceived(): void { this.received = Math.min(0x7fffffff, this.received + 1); }
  setRollbackFrames(frames: number): void { this.rollbackFrames = Math.max(0, Math.min(8, Math.floor(Number.isFinite(frames) ? frames : 0))); }

  snapshot(): NetworkTelemetrySnapshot {
    let total = 0;
    for (let index = 0; index < this.count; index++) total += this.rtt[index];
    const rttMs = this.count ? total / this.count : 0;
    let variance = 0;
    for (let index = 0; index < this.count; index++) variance += Math.abs(this.rtt[index] - rttMs);
    const jitterMs = this.count ? variance / this.count : 0;
    const packetLossPercent = this.sent ? Math.max(0, (this.sent - this.received) / this.sent * 100) : 0;
    return { rttMs, jitterMs, packetLossPercent, rollbackFrames: this.rollbackFrames, inputDelayFrames: recommendedInputDelay(rttMs), quality: latencyQuality(rttMs) };
  }
}

export function recommendedInputDelay(rttMs: number): number { return rttMs >= 120 ? 2 : rttMs >= 55 ? 1 : 0; }
export function latencyQuality(rttMs: number): 'GREEN' | 'YELLOW' | 'RED' { return rttMs < 40 ? 'GREEN' : rttMs < 90 ? 'YELLOW' : 'RED'; }
