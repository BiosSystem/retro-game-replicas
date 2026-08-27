import { describe, expect, it } from 'vitest';
import { SpatialHashGrid } from './SpatialHashGrid';

describe('SpatialHashGrid', () => {
  it('finds intersecting bodies across cell boundaries without duplicates', () => {
    const grid = new SpatialHashGrid(32);
    grid.insert({ id: 'wide', x: 20, y: 20, width: 40, height: 40 });
    grid.insert({ id: 'far', x: 200, y: 200, width: 10, height: 10 });
    expect(grid.query({ id: 'query', x: 40, y: 40, width: 10, height: 10 }).map(item => item.id)).toEqual(['wide']);
  });

  it('rejects invalid cell sizes', () => expect(() => new SpatialHashGrid(0)).toThrow());
});
