import { describe, expect, it } from 'vitest';
import { deterministicAngle, deterministicLane, isNear, relayWave, shortestAngleDelta, spiralWave } from './CabinetWaveSystems';

describe('procedural cabinet wave systems', () => {
  it('scales and bounds relay waves by tier and difficulty', () => {
    expect(relayWave(1, 'EASY')).toMatchObject({ count: 8, integrity: 6 });
    expect(relayWave(99, 'EXPERT')).toMatchObject({ count: 34, intervalMs: 175, integrity: 1 });
  });

  it('keeps spiral spawn seeds deterministic and in range', () => {
    expect(deterministicLane(4, 9)).toBe(deterministicLane(4, 9));
    expect(deterministicLane(4, 9, 3)).toBeLessThan(3);
    expect(deterministicAngle(8, 12)).toBe(deterministicAngle(8, 12));
    expect(deterministicAngle(8, 12)).toBeGreaterThanOrEqual(0);
    expect(deterministicAngle(8, 12)).toBeLessThan(Math.PI * 2);
    expect(spiralWave(99, 'HARD').count).toBe(42);
  });

  it('uses wrap-aware polar comparisons and radius collision checks', () => {
    expect(Math.abs(shortestAngleDelta(Math.PI * 1.95, Math.PI * 0.05))).toBeLessThan(Math.PI / 5);
    expect(isNear(4, 5, 7, 9, 6)).toBe(true);
    expect(isNear(4, 5, 20, 9, 6)).toBe(false);
  });
});
