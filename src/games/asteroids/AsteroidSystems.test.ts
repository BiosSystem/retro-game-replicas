import { describe, expect, it } from 'vitest';
import { fractureSizes, predictIntercept, unlockedWeapons } from './AsteroidSystems';

describe('Neon Vector Asteroids systems', () => {
  it('fractures large rocks through three deterministic tiers', () => {
    expect(fractureSizes(3)).toEqual([2, 2]);
    expect(fractureSizes(2)).toEqual([1, 1]);
    expect(fractureSizes(1)).toEqual([]);
  });

  it('leads moving targets with a finite intercept', () => {
    const aim = predictIntercept({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 20 }, 100);
    expect(aim.x).toBeCloseTo(100);
    expect(aim.y).toBeGreaterThan(0);
  });

  it('unlocks weapon tiers from mineral progression', () => {
    expect(unlockedWeapons(0)).toEqual(['SPREAD']);
    expect(unlockedWeapons(5)).toEqual(['SPREAD', 'LASER']);
    expect(unlockedWeapons(12)).toEqual(['SPREAD', 'LASER', 'EMP']);
  });
});
