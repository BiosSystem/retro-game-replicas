import { describe, expect, it } from 'vitest';
import { avatarRecipe, avatarSvgDataUri, hashSeed, RetroProfileStore } from './RetroProfile';

describe('retro player profile', () => {
  it('persists one bounded deterministic avatar identity', () => {
    const data = new Map<string, string>(); const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    const store = new RetroProfileStore(storage, () => 'player-seed-42');
    expect(store.load()).toEqual({ version: 1, name: 'AAA', avatarSeed: 'player-seed-42' });
    expect(store.setName('<Ace!>')).toMatchObject({ name: 'ACE!' });
    expect(new RetroProfileStore(storage).load()).toEqual(store.load());
  });

  it('derives stable pixel recipes and inline SVG without raster assets', () => {
    expect(avatarRecipe('same-seed')).toEqual(avatarRecipe('same-seed'));
    expect(hashSeed('same-seed')).not.toBe(hashSeed('other-seed'));
    expect(decodeURIComponent(avatarSvgDataUri('same-seed'))).toContain('shape-rendering="crispEdges"');
  });
});
