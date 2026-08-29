import { describe, expect, it } from 'vitest';
import { nineSliceLayout } from './NeonUiLayout';

describe('neon UI layout', () => {
  it('retains fixed corners while stretching the center', () => {
    const slices = nineSliceLayout(100, 60, 8);
    expect(slices).toHaveLength(9);
    expect(slices[0]).toEqual({ x: 0, y: 0, width: 8, height: 8 });
    expect(slices[4]).toEqual({ x: 8, y: 8, width: 84, height: 44 });
    expect(slices[8]).toEqual({ x: 92, y: 52, width: 8, height: 8 });
  });
});
