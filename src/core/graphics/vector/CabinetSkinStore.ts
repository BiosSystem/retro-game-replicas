import { decodeDecal, encodeDecal } from './DecalCodec';
import type { VectorArtDocument } from './VectorArtModel';

const STORAGE_KEY = 'bios_cabinet_skins_v1';
const META_STORAGE_KEY = 'bios_cabinet_skin_meta_v1';
export interface SkinStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }

export class CabinetSkinStore {
  private readonly storage: SkinStorage | undefined;
  constructor(storage: SkinStorage | undefined = browserStorage()) { this.storage = storage; }
  get(cabinetScene: string) {
    try { const skins = this.read(); const value = skins[cabinetScene]; return value ? decodeDecal(fromBase64(value)) : undefined; } catch { this.clear(); return undefined; }
  }
  set(cabinetScene: string, document: VectorArtDocument) {
    if (!sceneKey(cabinetScene) || !this.storage) return false;
    try { const skins = this.read(); skins[cabinetScene] = toBase64(new Uint8Array(encodeDecal(document))); this.storage.setItem(STORAGE_KEY, JSON.stringify(skins)); this.storage.setItem(META_STORAGE_KEY, JSON.stringify(Object.keys(skins))); return true; } catch { return false; }
  }
  remove(cabinetScene: string) { try { const skins = this.read(); delete skins[cabinetScene]; this.storage?.setItem(STORAGE_KEY, JSON.stringify(skins)); this.storage?.setItem(META_STORAGE_KEY, JSON.stringify(Object.keys(skins))); } catch { this.clear(); } }
  private read() { const value = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? '{}') as unknown; if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Cabinet skin storage is invalid'); return value as Record<string, string>; }
  private clear() { try { this.storage?.removeItem(STORAGE_KEY); this.storage?.removeItem(META_STORAGE_KEY); } catch { /* Browser storage is optional. */ } }
}

export const cabinetSkinStore = new CabinetSkinStore();
function sceneKey(value: string) { return /^[A-Za-z][A-Za-z0-9]*Scene$/.test(value); }
function toBase64(bytes: Uint8Array) { let text = ''; for (let offset = 0; offset < bytes.length; offset += 0x8000) text += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return btoa(text); }
function fromBase64(value: string) { const text = atob(value); const bytes = new Uint8Array(text.length); for (let index = 0; index < text.length; index += 1) bytes[index] = text.charCodeAt(index); return bytes; }
function browserStorage(): SkinStorage | undefined { try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; } }
