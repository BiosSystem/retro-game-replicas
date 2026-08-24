import { DEFAULT_PATCH, validateSoundPatch, type SoundPatch } from './SoundPatch';

const STORAGE_KEY = 'retro_sound_patches_v1';
const ASSIGNMENT_KEY = 'retro_sound_patch_assignments_v1';
export type PatchSlot = 'LASER' | 'EXPLOSION' | 'COIN' | 'POWER_UP' | 'STAGE_CLEAR';

export class SoundPatchStore {
  constructor(privateStorage: Pick<Storage, 'getItem' | 'setItem'>) { this.storage = privateStorage; }
  private readonly storage: Pick<Storage, 'getItem' | 'setItem'>;

  load(): SoundPatch[] {
    try {
      const value: unknown = JSON.parse(this.storage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(value)) return [DEFAULT_PATCH];
      const patches = value.slice(0, 32).map(validateSoundPatch).flatMap(result => result.patch ? [result.patch] : []);
      return patches.length ? patches : [DEFAULT_PATCH];
    } catch { return [DEFAULT_PATCH]; }
  }

  save(patch: SoundPatch) {
    const result = validateSoundPatch(patch); if (!result.valid || !result.patch) throw new Error(result.errors.join('; '));
    const patches = this.load().filter(candidate => candidate.id !== patch.id); patches.push(result.patch);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(patches.slice(-32)));
    return result.patch;
  }

  remove(id: string) { const patches = this.load().filter(candidate => candidate.id !== id); this.storage.setItem(STORAGE_KEY, JSON.stringify(patches)); }
  serialize(patch: SoundPatch) { const result = validateSoundPatch(patch); if (!result.valid || !result.patch) throw new Error(result.errors.join('; ')); return JSON.stringify(result.patch); }
  assign(slot: PatchSlot, id: string) { if (!this.load().some(patch => patch.id === id)) throw new Error('Patch id is not saved'); const assignments = this.assignments(); assignments[slot] = id; this.storage.setItem(ASSIGNMENT_KEY, JSON.stringify(assignments)); }
  assigned(slot: PatchSlot) { const id = this.assignments()[slot]; return id ? this.load().find(patch => patch.id === id) : undefined; }
  private assignments(): Partial<Record<PatchSlot, string>> { try { const value: unknown = JSON.parse(this.storage.getItem(ASSIGNMENT_KEY) ?? '{}'); return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Partial<Record<PatchSlot, string>> : {}; } catch { return {}; } }
}
