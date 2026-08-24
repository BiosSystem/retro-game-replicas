import { validateModManifest, type ModAction, type ModEventName, type ModManifest, type StagePatch } from './ModSchema';

export interface ModEvent { event: ModEventName; stage: number; player?: 1 | 2; score?: number; }
export interface ModDispatch { pluginId: string; action: ModAction; }

export class ModRuntime {
  private readonly manifests = new Map<string, ModManifest>();

  register(input: string | unknown) {
    if (this.manifests.size >= 32) throw new Error('Mod capacity reached');
    let parsed: unknown = input;
    if (typeof input === 'string') {
      if (input.length > 65536) throw new Error('Mod JSON exceeds 64 KiB');
      try { parsed = JSON.parse(input); } catch { throw new Error('Mod JSON is invalid'); }
    }
    const result = validateModManifest(parsed);
    if (!result.valid || !result.manifest) throw new Error(result.errors.join('; '));
    if (this.manifests.has(result.manifest.id)) throw new Error(`Mod id already registered: ${result.manifest.id}`);
    this.manifests.set(result.manifest.id, result.manifest);
    return result.manifest.id;
  }

  unregister(id: string) { return this.manifests.delete(id); }
  list() { return [...this.manifests.values()].map(({ id, name, version }) => ({ id, name, version })); }
  stagePatches(): StagePatch[] { return [...this.manifests.values()].map(manifest => structuredClone(manifest.stage)); }

  dispatch(event: ModEvent): ModDispatch[] {
    const safeEvent = Object.freeze({ event: event.event, stage: clampInt(event.stage, 1, 1000000), player: event.player, score: event.score === undefined ? undefined : Math.max(0, Math.min(1000000000, event.score)) });
    const actions: ModDispatch[] = [];
    for (const manifest of this.manifests.values()) for (const hook of manifest.hooks) if (hook.event === safeEvent.event) for (const action of hook.actions) actions.push({ pluginId: manifest.id, action: structuredClone(action) });
    return actions;
  }
}

function clampInt(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, Math.floor(Number.isFinite(value) ? value : minimum))); }

export const arcadeModRuntime = new ModRuntime();

export interface ArcadeModApi { register(json: string): string; unregister(id: string): boolean; list(): Array<{ id: string; name: string; version: string }>; }
export function installModApi(target: Window) {
  if (target.arcadeMods) return target.arcadeMods;
  const api = Object.freeze({ register: (json: string) => arcadeModRuntime.register(json), unregister: (id: string) => arcadeModRuntime.unregister(id), list: () => arcadeModRuntime.list() });
  Object.defineProperty(target, 'arcadeMods', { value: api, configurable: false, writable: false });
  return api;
}

declare global { interface Window { arcadeMods?: ArcadeModApi; } }
