import { expect, it } from 'vitest';
import { CabinetLightPool } from './CabinetLightPool';

it('bounds and expires ambient light pulses', () => {
  const pool = new CabinetLightPool(1);
  pool.emit(4, 5, 0xff00ff, 1, 50); pool.emit(6, 7, 0x00ffff, 1, 100);
  expect(pool.snapshot()).toHaveLength(1);
  expect(pool.update(100)).toEqual([]);
});
