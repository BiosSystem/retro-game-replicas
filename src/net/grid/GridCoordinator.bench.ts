import { bench, describe } from 'vitest';
import { GridCoordinator, localGridPeer } from './GridCoordinator';

const values = Array.from({ length: 100_000 }, (_, index) => (index % 31) / 31);
describe('distributed grid', () => {
  bench('reduce 100,000 values over four peers', async () => {
    const grid = new GridCoordinator(); for (let index = 0; index < 4; index++) grid.addPeer(localGridPeer(`peer-${index}`));
    await grid.execute('GRADIENT_SUM', values, 4096);
  });
});
