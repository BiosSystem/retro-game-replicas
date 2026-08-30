import { describe, expect, it } from 'vitest';
import { NetworkTelemetry, latencyQuality, recommendedInputDelay } from './NetworkTelemetry';

describe('network telemetry', () => {
  it('uses fixed-window latency, loss, rollback, and input-delay metrics', () => {
    const telemetry = new NetworkTelemetry(); telemetry.recordRtt(30); telemetry.recordRtt(50); telemetry.recordSent(); telemetry.recordSent(); telemetry.recordReceived(); telemetry.setRollbackFrames(12);
    expect(telemetry.snapshot()).toMatchObject({ rttMs: 40, jitterMs: 10, packetLossPercent: 50, rollbackFrames: 8, inputDelayFrames: 0, quality: 'YELLOW' });
  });
  it('selects a bounded input delay from measured RTT', () => { expect(recommendedInputDelay(54)).toBe(0); expect(recommendedInputDelay(55)).toBe(1); expect(recommendedInputDelay(120)).toBe(2); expect(latencyQuality(90)).toBe('RED'); });
});
