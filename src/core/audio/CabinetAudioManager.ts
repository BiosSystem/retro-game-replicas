import { AudioEngine } from '../../engine/AudioEngine';
import type { TrackerSong } from './tracker/TrackerSequencer';

/** Keep optional authored cabinet music local to the browser and separate from default BGM. */
export class CabinetAudioManager {
  private readonly songs = new Map<string, TrackerSong>();
  setCustomSong(cabinetScene: string, song: TrackerSong) { this.songs.set(cabinetScene, song); }
  removeCustomSong(cabinetScene: string) { this.songs.delete(cabinetScene); }
  hasCustomSong(cabinetScene: string) { return this.songs.has(cabinetScene); }
  async play(cabinetScene: string, fallback?: Parameters<typeof AudioEngine.playTrack>[0]) {
    const song = this.songs.get(cabinetScene);
    if (song) { await AudioEngine.playTrackerSong(song); return 'CUSTOM'; }
    if (fallback) AudioEngine.playTrack(fallback); else AudioEngine.stopTrack();
    return 'DEFAULT';
  }
  stop() { AudioEngine.stopTrackerSong(); }
}

export const cabinetAudioManager = new CabinetAudioManager();
