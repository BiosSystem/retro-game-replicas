import type { StoragePort } from './profile/RetroProfile';

export const CabinetPalette = { CYAN_SYNTH: '#00ffff', MAGENTA_HEAT: '#ff2ec4', AMBER_TERMINAL: '#ffb44c', EMERALD_VECTOR: '#00ff9d' } as const;
export type CabinetPaletteName = keyof typeof CabinetPalette;
export interface NineSlicePanel { palette: CabinetPaletteName; header: string; scanlines: boolean; }
export function createNineSlicePanel(header: string, palette: CabinetPaletteName = 'CYAN_SYNTH'): NineSlicePanel { return { header: header.slice(0, 48), palette, scanlines: true }; }

export function readCabinetPalette(storage: StoragePort): CabinetPaletteName { const value = storage.getItem('arcade_ui_palette'); return value && value in CabinetPalette ? value as CabinetPaletteName : 'CYAN_SYNTH'; }
export function writeCabinetPalette(storage: StoragePort, palette: CabinetPaletteName) { storage.setItem('arcade_ui_palette', palette); return palette; }
