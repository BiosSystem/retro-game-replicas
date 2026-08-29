export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export interface RetroProfile { version: 1; name: string; avatarSeed: string; }
export interface AvatarRecipe { skin: number; suit: number; accent: number; eyes: number; antenna: number; }

const PROFILE_KEY = 'bios_arcade_profile_v1';
const PALETTES = [
  [0xffc29b, 0x102050, 0x00ffcc], [0x9bdbff, 0x3a104f, 0xff2ec4],
  [0xd7a56d, 0x113b2c, 0xffff00], [0x8fe39a, 0x301044, 0xff6633],
] as const;

export class RetroProfileStore {
  private readonly storage: StoragePort; private readonly makeSeed: () => string;
  constructor(storage: StoragePort, makeSeed = defaultSeed) { this.storage = storage; this.makeSeed = makeSeed; }

  load(): RetroProfile {
    try {
      const value = JSON.parse(this.storage.getItem(PROFILE_KEY) ?? '{}') as Partial<RetroProfile>;
      if (value.version === 1 && validSeed(value.avatarSeed) && cleanName(value.name) === value.name) return value as RetroProfile;
    } catch { /* Create a bounded profile below. */ }
    const profile: RetroProfile = { version: 1, name: 'AAA', avatarSeed: cleanSeed(this.makeSeed()) };
    this.save(profile);
    return profile;
  }

  setName(name: string) { const profile = { ...this.load(), name: cleanName(name) }; this.save(profile); return profile; }
  reroll() { const profile = { ...this.load(), avatarSeed: cleanSeed(this.makeSeed()) }; this.save(profile); return profile; }
  private save(profile: RetroProfile) { this.storage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
}

export function avatarRecipe(seed: string): AvatarRecipe {
  const hash = hashSeed(cleanSeed(seed));
  const palette = PALETTES[hash & 3];
  return { skin: palette[0], suit: palette[1], accent: palette[2], eyes: (hash >>> 5) & 3, antenna: (hash >>> 8) & 3 };
}

export interface PixelSurface { fillStyle(color: number, alpha?: number): PixelSurface; fillRect(x: number, y: number, width: number, height: number): PixelSurface; }

export function drawRetroAvatar(surface: PixelSurface, x: number, y: number, size: number, seed: string) {
  const recipe = avatarRecipe(seed); const unit = Math.max(1, Math.floor(size / 8)); const left = Math.round(x - unit * 4); const top = Math.round(y - unit * 4);
  const rect = (column: number, row: number, width: number, height: number, color: number) => surface.fillStyle(color).fillRect(left + column * unit, top + row * unit, width * unit, height * unit);
  rect(1, 1, 6, 5, recipe.skin); rect(0, 6, 8, 2, recipe.suit); rect(1, 6, 6, 1, recipe.accent);
  rect(1, 0, 6, 1, recipe.suit); rect(0, 1, 1, 3, recipe.suit); rect(7, 1, 1, 3, recipe.suit);
  rect(2, 3, recipe.eyes === 3 ? 4 : 1, 1, recipe.accent); if (recipe.eyes !== 3) rect(5, 3, 1, 1, recipe.accent);
  rect(3, 5, 2, 1, 0x101018); if (recipe.antenna > 0) rect(recipe.antenna + 1, 0, 1, 1, recipe.accent);
}

export function avatarSvgDataUri(seed: string) {
  const cells: string[] = []; const surface: PixelSurface = { fillStyle(color) { this.color = color; return this; }, fillRect(x, y, width, height) { cells.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#${(this.color ?? 0).toString(16).padStart(6, '0')}"/>`); return this; }, color: 0 } as PixelSurface & { color: number };
  drawRetroAvatar(surface, 32, 32, 64, seed);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">${cells.join('')}</svg>`)}`;
}

export function hashSeed(seed: string) { let value = 2166136261; for (let index = 0; index < seed.length; index++) value = Math.imul(value ^ seed.charCodeAt(index), 16777619); return value >>> 0; }
function cleanName(value: unknown) { return String(value ?? '').toUpperCase().replace(/[^A-Z0-9!?. -]/g, '').trim().slice(0, 12) || 'AAA'; }
function validSeed(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z0-9_-]{4,32}$/.test(value); }
function cleanSeed(value: string) { const safe = value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32); return safe.length >= 4 ? safe : `P${hashSeed(value).toString(36).padStart(7, '0')}`; }
function defaultSeed() { const values = new Uint32Array(2); crypto.getRandomValues(values); return `P${values[0].toString(36)}${values[1].toString(36)}`; }
