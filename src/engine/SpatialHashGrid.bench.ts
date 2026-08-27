import { bench, describe } from 'vitest';
import { SpatialHashGrid } from './SpatialHashGrid';

describe('SpatialHashGrid broad phase', () => {
  const bodies = Array.from({ length: 5000 }, (_, index) => ({
    id: `${index}`,
    x: (index * 47) % 4096,
    y: (index * 83) % 4096,
    width: 16,
    height: 16,
  }));

  bench('insert 5000 and query 500 regions', () => {
    const grid = new SpatialHashGrid(64);
    for (const body of bodies) grid.insert(body);
    for (let index = 0; index < 500; index++) {
      grid.query({ id: 'query', x: (index * 31) % 4096, y: (index * 59) % 4096, width: 48, height: 48 });
    }
  });
});
