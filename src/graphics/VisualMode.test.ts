import { describe, expect, it } from 'vitest';
import { VISUAL_MODE_STORAGE_KEY, nextVisualMode, parseVisualMode, readVisualMode, writeVisualMode } from './VisualMode';
import { isVisualFrameFrozen, requestVisualHitStop, resetVisualFrameFreeze } from './VisualFrameFreeze';

describe('visual mode preferences', () => {
  it('defaults to classic mode and cycles through the two supported modes', () => {
    expect(parseVisualMode(null)).toBe('CLASSIC_1980S');
    expect(nextVisualMode('CLASSIC_1980S')).toBe('OVERDRIVE_2026');
    expect(nextVisualMode('OVERDRIVE_2026')).toBe('CLASSIC_1980S');
  });

  it('persists only the selected visual mode', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    writeVisualMode(storage, 'OVERDRIVE_2026');
    expect(values.get(VISUAL_MODE_STORAGE_KEY)).toBe('OVERDRIVE_2026');
    expect(readVisualMode(storage)).toBe('OVERDRIVE_2026');
  });
});

describe('visual hit-stop', () => {
  it('clamps visual-only freezes to the 30-50 ms feedback budget', () => {
    resetVisualFrameFreeze();
    expect(requestVisualHitStop(10, 1)).toBe(40);
    resetVisualFrameFreeze();
    expect(requestVisualHitStop(100, 999)).toBe(150);
    expect(isVisualFrameFrozen(149)).toBe(true);
    expect(isVisualFrameFrozen(150)).toBe(false);
  });
});
