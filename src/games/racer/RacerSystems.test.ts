import { describe, expect, it } from 'vitest';
import { advanceRacer, collisionSeverity, generateHorizonBackdrop, generateRoadSample, projectRoadScanline, RACER_TICK_SECONDS, shiftGear } from './RacerSystems';

describe('pseudo-3D racer systems', () => {
  it('generates stable curved road data', () => { expect(generateRoadSample(42)).toEqual(generateRoadSample(42)); expect(generateRoadSample(42)).not.toEqual(generateRoadSample(43)); });
  it('widens projected scanlines toward the player', () => { const horizon = projectRoadScanline(150, 140, 640, 0.5); const near = projectRoadScanline(470, 140, 640, 0.5); expect(near.halfWidth).toBeGreaterThan(horizon.halfWidth); expect(near.center).toBeGreaterThan(horizon.center); });
  it('bounds gears, speed, and collision depth', () => { expect(shiftGear(5, 1)).toBe(5); expect(advanceRacer(0, 1, false, 1, 1)).toBeGreaterThan(0); expect(collisionSeverity(0, 0, 1)).toBe(1); expect(collisionSeverity(0, 1, 1)).toBe(0); });
  it('generates deterministic horizon palettes and uses a 60 Hz simulation tick', () => { expect(generateHorizonBackdrop(240)).toEqual(generateHorizonBackdrop(240)); expect(generateHorizonBackdrop(240)).not.toEqual(generateHorizonBackdrop(241)); expect(RACER_TICK_SECONDS).toBeCloseTo(1 / 60); });
});
