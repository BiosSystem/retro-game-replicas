import { describe, expect, it } from 'vitest';
import { CabinetAudioManager } from '../CabinetAudioManager';
import { TRACKER_PROJECT_STORAGE_KEY, TrackerProjectStore, defaultPatch, type TrackerStorage } from '../TrackerProjectStore';
import { TrackerPattern } from '../tracker/TrackerPattern';
import type { TrackerSong } from '../tracker/TrackerSequencer';

class MemoryStorage implements TrackerStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function song(): TrackerSong {
  const pattern = new TrackerPattern(32);
  pattern.setCell(0, 'CH1', { note: 1, octave: 4, patchId: 1, volume: 127, effectType: 0, effectValue: 0 });
  return { bpm: 120, speed: 6, patterns: [pattern], order: new Uint16Array([0]), instruments: [{ id: 1, name: 'Lead' }] };
}

describe('tracker project persistence', () => {
  it('round trips the binary song, patch configuration, and cabinet slot', () => {
    const storage = new MemoryStorage(); const store = new TrackerProjectStore(storage); const patch = defaultPatch(); patch.modulationIndex = 2.5;
    expect(store.save({ song: song(), patch, cabinetScene: 'MetaArcadeScene' })).toBe(true);
    const restored = store.load(() => { throw new Error('Unexpected fallback'); });
    expect(restored.song.patterns[0].getCell(0, 'CH1').octave).toBe(4);
    expect(restored.patch.modulationIndex).toBe(2.5); expect(restored.cabinetScene).toBe('MetaArcadeScene');
  });

  it('clears corrupt projects and uses the supplied safe fallback', () => {
    const storage = new MemoryStorage(); storage.setItem(TRACKER_PROJECT_STORAGE_KEY, '{invalid'); const store = new TrackerProjectStore(storage);
    const fallback = { song: song(), patch: defaultPatch(), cabinetScene: 'MetaArcadeScene' };
    expect(store.load(() => fallback)).toBe(fallback); expect(storage.getItem(TRACKER_PROJECT_STORAGE_KEY)).toBeNull();
  });

  it('restores custom cabinet BGM slots and removes malformed slot data', () => {
    const storage = new MemoryStorage(); const manager = new CabinetAudioManager(storage); manager.setCustomSong('MetaArcadeScene', song());
    expect(new CabinetAudioManager(storage).hasCustomSong('MetaArcadeScene')).toBe(true);
    storage.setItem('bios_cabinet_bgm_slots_v1', '{invalid'); new CabinetAudioManager(storage);
    expect(storage.getItem('bios_cabinet_bgm_slots_v1')).toBeNull();
  });
});
