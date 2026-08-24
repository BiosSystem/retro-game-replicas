import { describe, expect, it } from 'vitest';
import { AdaptiveQualityController, PooledParticleSystem } from './PooledParticleSystem';

describe('pooled particle and quality systems', () => {
  it('reuses a fixed particle capacity under burst pressure', () => {
    const pool = new PooledParticleSystem(1000);
    pool.emit({ x: 0, y: 0, count: 5000, speedMin: 10, speedMax: 20, lifeMs: 100, color: 0xffffff });
    expect(pool.activeCount).toBe(1000);
    pool.update(101);
    expect(pool.activeCount).toBe(0);
    pool.emit({ x: 0, y: 0, count: 1000, speedMin: 1, speedMax: 2, lifeMs: 100, color: 0xffffff });
    expect(pool.activeCount).toBe(1000);
  });

  it('reduces particle and render scale after sustained low frame rates', () => {
    const quality = new AdaptiveQualityController();
    for (let index = 0; index < 6; index++) quality.sample(35);
    expect(quality.tier).toBe('LOW'); expect(quality.particleBudget).toBe(0.35); expect(quality.resolutionScale).toBe(0.7);
  });
});
