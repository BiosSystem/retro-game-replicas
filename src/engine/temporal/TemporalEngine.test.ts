import { describe, expect, it } from 'vitest';
import { solveCausality } from './CausalSolver';
import { runTemporalStress, TemporalRing } from './TemporalRing';
import { TimelineBrancher } from './TimelineBranch';

describe('temporal engine', () => {
  it('delta compresses and decodes a rolling 30 second history', () => {
    const ring = new TemporalRing(8);
    const state = new Int32Array(8);
    for (let frame = 0; frame < 2000; frame++) { state[frame % 8] = frame; ring.record(frame, state); }
    expect(ring.oldestFrame()).toBe(200);
    expect(ring.decode(200)?.[0]).toBe(200);
    expect(ring.decode(199)).toBeUndefined();
    expect(ring.decode(1999)?.[7]).toBe(1999);
    expect(ring.stats().ratio).toBeGreaterThan(1);
  });

  it('plays recorded input through bounded timeline clones', () => {
    const branches = new TimelineBrancher();
    branches.recordInput(10, 1); branches.recordInput(11, 4);
    branches.spawn(10, 11);
    expect(branches.step()[0].mask).toBe(1);
    expect(branches.step()[0].mask).toBe(4);
    expect(branches.active()).toHaveLength(0);
  });

  it('gives an older timeline collision priority and resolves switches', () => {
    const result = solveCausality([
      { id: 1, timeline: 0, x: 10, y: 10, width: 10, height: 10, inverseMass: 1 },
      { id: 2, timeline: 1, x: 14, y: 10, width: 10, height: 10, inverseMass: 1 },
    ], [{ id: 9, x: 20, y: 10, width: 4, height: 8 }]);
    expect(result.bodies[0].x).toBe(10);
    expect(result.bodies[1].x).toBeGreaterThanOrEqual(20);
    expect(result.pressedSwitches).toEqual([9]);
  });
  it('compresses and resimulates 10,000 synthetic deltas inside the stress budget', () => {
    runTemporalStress();
    const result = runTemporalStress();
    expect(result.frames).toBe(10000);
    expect(result.checksum).toBe(49_995_000);
    expect(result.durationMs).toBeLessThan(1.5);
  });
});
