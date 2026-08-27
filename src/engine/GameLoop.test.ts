import { describe, expect, it } from 'vitest';
import { clampFrameDelta } from './GameLoop';

describe('core frame delta clamping', () => {
  it('preserves 60 Hz, 120 Hz, 144 Hz, and VRR frame deltas', () => {
    for (const delta of [16.6667, 8.3333, 6.9444, 11.2]) expect(clampFrameDelta(delta)).toBeCloseTo(delta, 4);
  });

  it('rejects invalid deltas and caps long frame gaps', () => {
    expect(clampFrameDelta(Number.NaN)).toBe(0);
    expect(clampFrameDelta(-1)).toBe(0);
    expect(clampFrameDelta(500)).toBe(50);
    expect(clampFrameDelta(80, 20)).toBe(20);
  });
});
