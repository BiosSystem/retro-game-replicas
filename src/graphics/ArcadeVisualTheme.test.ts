import { describe, expect, it } from 'vitest';
import { ARCADE_PALETTES, reducedMotionEnabled, visualDensity } from './ArcadeVisualTheme';

describe('ArcadeVisualTheme', () => {
  it('keeps flagship palettes distinct and readable', () => {
    expect(new Set(Object.values(ARCADE_PALETTES).map(theme => theme.accent)).size).toBe(3);
    expect(Object.values(ARCADE_PALETTES).every(theme => theme.background !== theme.highlight)).toBe(true);
  });

  it('resolves accessibility and quality preferences', () => {
    const storage = { getItem: () => 'true' };
    expect(reducedMotionEnabled(storage, false)).toBe(true);
    expect(reducedMotionEnabled({ getItem: () => null }, true)).toBe(true);
    expect(visualDensity('low')).toBe(0.35);
    expect(visualDensity('medium')).toBe(0.65);
    expect(visualDensity('high')).toBe(1);
  });
});
