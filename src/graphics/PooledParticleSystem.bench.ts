import { bench, describe } from 'vitest';
import { PooledParticleSystem } from './PooledParticleSystem';

describe('pooled particle stress', () => {
  bench('update 10000 simultaneous particles', () => {
    const pool = new PooledParticleSystem(10_000);
    pool.emit({ x: 320, y: 240, count: 10_000, speedMin: 30, speedMax: 240, lifeMs: 1000, color: 0xff44cc });
    pool.update(16.67);
  });
});
