import { arcadeModRuntime, type ModRuntime } from '../../mods/ModRuntime';
import { validateModManifest, type ModManifest } from '../../mods/ModSchema';

const STORAGE_KEY = 'retro_community_mods_v1';
export const MOD_BYTES_MAX = 65536;

export interface ModInspection { valid: boolean; errors: string[]; manifest?: ModManifest; raw: string; }

export class CommunityModStorage {
  private readonly storage: Pick<Storage, 'getItem' | 'setItem'>;
  constructor(storage: Pick<Storage, 'getItem' | 'setItem'>) { this.storage = storage; }
  load() { try { const value: unknown = JSON.parse(this.storage.getItem(STORAGE_KEY) ?? '[]'); return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.length <= MOD_BYTES_MAX).slice(0, 32) : []; } catch { return []; } }
  save(raws: string[]) { this.storage.setItem(STORAGE_KEY, JSON.stringify(raws.slice(0, 32))); }
}

export class CommunityModState {
  private readonly runtime: ModRuntime;
  private readonly storage: CommunityModStorage;
  private readonly rawById = new Map<string, string>();
  constructor(storage: CommunityModStorage, runtime: ModRuntime = arcadeModRuntime) { this.storage = storage; this.runtime = runtime; }

  inspect(raw: string): ModInspection {
    if (new TextEncoder().encode(raw).byteLength > MOD_BYTES_MAX) return { valid: false, errors: ['Mod JSON exceeds 64 KiB'], raw };
    let parsed: unknown; try { parsed = JSON.parse(raw); } catch { return { valid: false, errors: ['Mod JSON is invalid'], raw }; }
    const result = validateModManifest(parsed); return { valid: result.valid, errors: result.errors, manifest: result.manifest, raw };
  }

  import(raw: string) {
    const inspection = this.inspect(raw); if (!inspection.valid || !inspection.manifest) return inspection;
    const id = inspection.manifest.id; if (this.rawById.has(id)) this.runtime.unregister(id);
    try { this.runtime.register(inspection.manifest); } catch (error) { return { valid: false, errors: [error instanceof Error ? error.message : 'Mod registration failed'], raw }; }
    this.rawById.set(id, JSON.stringify(inspection.manifest)); this.persist(); return inspection;
  }

  remove(id: string) { this.runtime.unregister(id); const removed = this.rawById.delete(id); this.persist(); return removed; }
  hydrate() { for (const raw of this.storage.load()) this.import(raw); return this.list(); }
  list() { return this.runtime.list(); }
  private persist() { this.storage.save([...this.rawById.values()]); }
}

export function validateModUrl(raw: string) {
  let url: URL; try { url = new URL(raw); } catch { throw new Error('Enter a valid HTTPS URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Use an HTTPS URL without credentials or fragments');
  return url;
}

export async function fetchModJson(rawUrl: string, fetcher: typeof fetch = fetch) {
  const url = validateModUrl(rawUrl); const controller = new AbortController(); const timer = globalThis.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetcher(url, { credentials: 'omit', redirect: 'error', cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Mod request failed with ${response.status}`);
    const declared = Number(response.headers.get('content-length') ?? 0); if (declared > MOD_BYTES_MAX) throw new Error('Remote mod exceeds 64 KiB');
    const text = await response.text(); if (new TextEncoder().encode(text).byteLength > MOD_BYTES_MAX) throw new Error('Remote mod exceeds 64 KiB'); return text;
  } finally { globalThis.clearTimeout(timer); }
}
