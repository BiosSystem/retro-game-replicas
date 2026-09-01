import { AudioEngine } from '../../engine/AudioEngine';
import { decodeBase64, encodeBase64, type TrackerStorage } from './TrackerProjectStore';
import { decodeSong, encodeSong } from './tracker/SongCodec';
import type { TrackerSong } from './tracker/TrackerSequencer';

/** Keep optional authored cabinet music local to the browser and separate from default BGM. */
export class CabinetAudioManager {
  private readonly songs = new Map<string, TrackerSong>();
  private readonly storage: TrackerStorage | undefined;
  constructor(storage: TrackerStorage | undefined = browserStorage()) { this.storage = storage; this.restore(); }
  setCustomSong(cabinetScene: string, song: TrackerSong) { this.songs.set(cabinetScene, song); this.persist(); }
  removeCustomSong(cabinetScene: string) { this.songs.delete(cabinetScene); this.persist(); }
  hasCustomSong(cabinetScene: string) { return this.songs.has(cabinetScene); }
  async play(cabinetScene: string, fallback?: Parameters<typeof AudioEngine.playTrack>[0]) {
    const song = this.songs.get(cabinetScene);
    if (song) { await AudioEngine.playTrackerSong(song); return 'CUSTOM'; }
    if (fallback) AudioEngine.playTrack(fallback); else AudioEngine.stopTrack();
    return 'DEFAULT';
  }
  stop() { AudioEngine.stopTrackerSong(); }

  private restore() {
    try {
      const slots = JSON.parse(this.storage?.getItem('bios_cabinet_bgm_slots_v1') ?? '') as Record<string, string>;
      if (!slots || Array.isArray(slots) || typeof slots !== 'object') throw new Error('Invalid cabinet BGM slots');
      for (const [scene, encoded] of Object.entries(slots)) {
        if (!/^[A-Za-z][A-Za-z0-9]*Scene$/.test(scene) || typeof encoded !== 'string') throw new Error('Invalid cabinet BGM slot');
        this.songs.set(scene, decodeSong(decodeBase64(encoded)));
      }
    } catch { try { this.storage?.removeItem('bios_cabinet_bgm_slots_v1'); } catch { /* Browser storage is optional. */ } }
  }

  private persist() {
    try {
      const slots: Record<string, string> = {};
      for (const [scene, song] of this.songs) slots[scene] = encodeBase64(new Uint8Array(encodeSong(song)));
      this.storage?.setItem('bios_cabinet_bgm_slots_v1', JSON.stringify(slots));
    } catch { /* Keep playback available when browser storage is full or blocked. */ }
  }
}

export const cabinetAudioManager = new CabinetAudioManager();

function browserStorage(): TrackerStorage | undefined {
  try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; }
}
