export type ArcadeThemeId = 'relay' | 'vector' | 'epoch';

export interface ArcadePalette {
  background: number;
  accent: number;
  danger: number;
  highlight: number;
  hud: string;
}

export const ARCADE_PALETTES: Readonly<Record<ArcadeThemeId, ArcadePalette>> = {
  relay: { background: 0x020611, accent: 0x00dfff, danger: 0xff2255, highlight: 0xffffff, hud: '#00eaff' },
  vector: { background: 0x02000c, accent: 0xff2ec4, danger: 0xff2255, highlight: 0x00ffff, hud: '#ff2ec4' },
  epoch: { background: 0x020705, accent: 0x8effc1, danger: 0xff6b5f, highlight: 0xdfffff, hud: '#8effc1' },
};

export function reducedMotionEnabled(storage?: Pick<Storage, 'getItem'>, mediaMatches = false) {
  return storage?.getItem('arcade_reduced_motion') === 'true' || mediaMatches;
}

export function visualDensity(quality?: string) {
  if (quality === 'low') return 0.35;
  if (quality === 'medium') return 0.65;
  return 1;
}
