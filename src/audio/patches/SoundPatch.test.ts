import { describe, expect, it } from 'vitest';
import { DEFAULT_PATCH, validateSoundPatch } from './SoundPatch';
import { SoundPatchStore } from './SoundPatchStore';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('sound patches', () => {
  it('round-trips a bounded custom pulse patch', () => {
    const storage = new MemoryStorage(); const store = new SoundPatchStore(storage);
    store.save({ ...DEFAULT_PATCH, id: 'boss-alarm', dutyCycle: 0.125, filterHz: 1800 });
    expect(store.load().find(patch => patch.id === 'boss-alarm')).toMatchObject({ dutyCycle: 0.125, filterHz: 1800 });
    expect(JSON.parse(store.serialize(DEFAULT_PATCH))).toEqual(DEFAULT_PATCH);
  });

  it('rejects unsafe and out-of-range patch data', () => {
    expect(validateSoundPatch({ ...DEFAULT_PATCH, name: '<script>', frequency: 9000, execute: 'alert(1)' }).valid).toBe(false);
  });

  it('recovers from corrupt storage with a generated default', () => {
    const storage = new MemoryStorage(); storage.setItem('biossystem.sound-patches.v1', '{bad');
    expect(new SoundPatchStore(storage).load()).toEqual([DEFAULT_PATCH]);
  });

  it('assigns a saved patch to an effect slot', () => {
    const store = new SoundPatchStore(new MemoryStorage());
    store.save({ ...DEFAULT_PATCH, id: 'coin-chirp' });
    store.assign('COIN', 'coin-chirp');
    expect(store.assigned('COIN')?.id).toBe('coin-chirp');
  });
});
