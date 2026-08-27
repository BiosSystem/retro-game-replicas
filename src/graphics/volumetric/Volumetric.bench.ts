import { bench, describe } from 'vitest';
import { integrateAtmosphere } from './Scattering';

describe('volumetric CPU reference', () => {
  bench('integrate 10,000 fog rays at 24 steps', () => {
    let total = 0;
    for (let i = 0; i < 10000; i++) total += integrateAtmosphere(80 + i % 20, 0.65, (i % 100) / 50 - 1, 24).luminance;
    if (total < 0) throw new Error('Unreachable');
  });
});
