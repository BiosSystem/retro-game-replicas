import { describe, expect, it } from 'vitest';
import { FrameTelemetry } from './FrameTelemetry';

describe('frame telemetry', () => {
  it('uses a fixed ring and calculates mean, p95, and dropped frames', () => {
    const telemetry = new FrameTelemetry(4);
    for (const value of [10, 16, 20, 40, 8]) telemetry.record(value);
    const sample = telemetry.snapshot();
    expect(sample.samples).toBe(4);
    expect(sample.meanFrameMs).toBeCloseTo(21);
    expect(sample.p95FrameMs).toBe(40);
    expect(sample.droppedFramePercent).toBe(50);
  });

  it('ignores invalid samples', () => {
    const telemetry = new FrameTelemetry(); telemetry.record(0); telemetry.record(Number.NaN);
    expect(telemetry.snapshot().samples).toBe(0);
  });
});
