import { describe, expect, it } from 'vitest';
import { PropagationDelayLine, createSpatialRing, propagationDelaySamples, relativisticDopplerRatio } from './RelativisticAudioWorklet';

describe('relativistic spatial AudioWorklet support', () => {
  it('allocates a bounded fallback ring without cross-origin isolation', () => {
    const ring = createSpatialRing(16_001);
    expect(ring.mode).toBe('MESSAGE');
    expect(ring.capacity).toBe(16_128);
    expect(ring.samples.buffer).toBe(ring.buffer);
  });

  it('calculates speed-of-sound delay and bounded Doppler shift', () => {
    expect(propagationDelaySamples(343, 48_000)).toBe(48_000);
    expect(relativisticDopplerRatio(0, 0, 1)).toBe(1);
    expect(relativisticDopplerRatio(20, 20, 0.8)).toBeGreaterThan(0.8);
  });

  it('processes fixed audio blocks without resizing the delay pool', () => {
    const line = new PropagationDelayLine(256);
    const input = new Float32Array(128);
    const output = new Float32Array(128);
    input[0] = 1;
    expect(line.process(input, output, 8, 1)).toBe(output);
    expect(output[8]).toBeCloseTo(1);
  });
});
