import { expect, it } from 'vitest';
import { advanceShieldRipples, createWarpStars, warpStretchForSpeed } from './NeonVectorVisuals';

it('stretches parallax stars proportionally to ship velocity', () => {
  expect(warpStretchForSpeed(0)).toBe(1);
  expect(warpStretchForSpeed(320)).toBe(9);
  expect(createWarpStars(3)).toHaveLength(3);
});

it('expires completed shield ripple effects', () => {
  expect(advanceShieldRipples([{ x: 0, y: 0, ageMs: 100, durationMs: 120, color: 1 }], 20)).toEqual([]);
});
