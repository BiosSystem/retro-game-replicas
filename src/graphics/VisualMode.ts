export type VisualMode = 'CLASSIC_1980S' | 'OVERDRIVE_2026';

export interface VisualModeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const VISUAL_MODE_STORAGE_KEY = 'arcade_visual_mode';
export const VISUAL_MODE_ORDER: readonly VisualMode[] = ['CLASSIC_1980S', 'OVERDRIVE_2026'];

export function parseVisualMode(value: string | null): VisualMode {
  return value === 'OVERDRIVE_2026' ? 'OVERDRIVE_2026' : 'CLASSIC_1980S';
}

export function nextVisualMode(mode: VisualMode): VisualMode {
  return VISUAL_MODE_ORDER[(VISUAL_MODE_ORDER.indexOf(mode) + 1) % VISUAL_MODE_ORDER.length];
}

export function readVisualMode(storage: Pick<VisualModeStorage, 'getItem'>): VisualMode {
  return parseVisualMode(storage.getItem(VISUAL_MODE_STORAGE_KEY));
}

export function writeVisualMode(storage: VisualModeStorage, mode: VisualMode) {
  storage.setItem(VISUAL_MODE_STORAGE_KEY, mode);
}
