import { decodeSong, encodeSong } from './tracker/SongCodec';
import type { TrackerSong } from './tracker/TrackerSequencer';
import { DEFAULT_FM_PATCH, type FmPatch } from './synth/SynthPrimitives';

export const TRACKER_PROJECT_STORAGE_KEY = 'bios_tracker_project_v1';
const PROJECT_VERSION = 1;

export interface TrackerStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface TrackerProject {
  song: TrackerSong;
  patch: FmPatch;
  cabinetScene: string;
}

interface StoredTrackerProject {
  version: number;
  song: string;
  patch: FmPatch;
  cabinetScene: string;
}

/** Store compact tracker projects locally. Reject invalid or stale data before it reaches the audio graph. */
export class TrackerProjectStore {
  private readonly storage: TrackerStorage | undefined;
  constructor(storage: TrackerStorage | undefined = browserStorage()) { this.storage = storage; }

  load(fallback: () => TrackerProject): TrackerProject {
    if (!this.storage) return fallback();
    try {
      const parsed = JSON.parse(this.storage.getItem(TRACKER_PROJECT_STORAGE_KEY) ?? '') as Partial<StoredTrackerProject>;
      if (parsed.version !== PROJECT_VERSION || typeof parsed.song !== 'string' || !isPatch(parsed.patch) || !isSceneKey(parsed.cabinetScene)) throw new Error('Stored tracker project is invalid');
      return { song: decodeSong(decodeBase64(parsed.song)), patch: structuredClone(parsed.patch), cabinetScene: parsed.cabinetScene };
    } catch {
      this.clear();
      return fallback();
    }
  }

  save(project: TrackerProject): boolean {
    if (!this.storage || !isPatch(project.patch) || !isSceneKey(project.cabinetScene)) return false;
    try {
      const stored: StoredTrackerProject = {
        version: PROJECT_VERSION,
        song: encodeBase64(new Uint8Array(encodeSong(project.song))),
        patch: structuredClone(project.patch),
        cabinetScene: project.cabinetScene,
      };
      this.storage.setItem(TRACKER_PROJECT_STORAGE_KEY, JSON.stringify(stored));
      return true;
    } catch { return false; }
  }

  clear() { try { this.storage?.removeItem(TRACKER_PROJECT_STORAGE_KEY); } catch { /* Browser storage is optional. */ } }
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

export function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function browserStorage(): TrackerStorage | undefined {
  try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; }
}

function isSceneKey(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9]*Scene$/.test(value); }
function isPatch(value: unknown): value is FmPatch {
  if (!value || typeof value !== 'object') return false;
  const patch = value as Partial<FmPatch>;
  const envelope = patch.envelope as Partial<FmPatch['envelope']> | undefined;
  const filter = patch.filter as Partial<FmPatch['filter']> | undefined;
  return ['pulse12', 'pulse25', 'pulse50', 'triangle', 'saw', 'noise'].includes(patch.waveform ?? '')
    && Number.isFinite(patch.carrierRatio) && Number.isFinite(patch.modulatorRatio) && Number.isFinite(patch.modulationIndex) && Number.isFinite(patch.gain)
    && Number.isFinite(envelope?.attack) && Number.isFinite(envelope?.decay) && Number.isFinite(envelope?.sustain) && Number.isFinite(envelope?.release)
    && ['lowpass', 'highpass', 'bandpass'].includes(filter?.mode ?? '') && Number.isFinite(filter?.frequency) && Number.isFinite(filter?.q);
}

export function defaultPatch() { return structuredClone(DEFAULT_FM_PATCH); }
