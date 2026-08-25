import { describe, expect, it } from 'vitest';
import { generateChronoChamber, initialChronoState, packChronoState, stepChrono, temporalPitch, unpackChronoState } from './ChronoSystems';

describe('Neon Chrono systems', () => {
  it('generates deterministic ability chambers', () => { expect(generateChronoChamber(12)).toEqual(generateChronoChamber(12)); expect(generateChronoChamber(13)).not.toEqual(generateChronoChamber(12)); });
  it('round trips fixed point world state', () => { const state = stepChrono(initialChronoState(), 8, generateChronoChamber(0), 1 / 60); expect(unpackChronoState(packChronoState(state)).x).toBeCloseTo(state.x, 3); });
  it('slows movement and drops procedural rewind pitch', () => { const chamber = generateChronoChamber(0), start = initialChronoState(); const normal = stepChrono(start, 8, chamber, 1 / 60, 1), slow = stepChrono(start, 8, chamber, 1 / 60, .25); expect(slow.x).toBeLessThan(normal.x); expect(temporalPitch(.25, true)).toBeLessThan(temporalPitch(1, false)); });
});
