import { DEFAULT_CONTROLLER_PROFILE, fingerprintController, sanitizeControllerProfile, type ArcadeInputAction, type ControllerProfile } from './ControllerProfile';

export interface InputStoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void; }

const STORE_KEY = 'bios_arcade_controller_profiles_v1';

export class InputProfileStore {
  private readonly storage: InputStoragePort;

  constructor(storage: InputStoragePort) { this.storage = storage; }

  load(id: string) {
    const all = this.readAll();
    return sanitizeControllerProfile(all[fingerprintController(id).id]);
  }

  save(id: string, profile: Partial<ControllerProfile>) {
    const all = this.readAll();
    all[fingerprintController(id).id] = sanitizeControllerProfile(profile);
    this.writeAll(all);
    return all[fingerprintController(id).id];
  }

  bind(id: string, action: ArcadeInputAction, buttons: number[]) {
    const current = this.load(id);
    const safe = buttons.filter(button => Number.isInteger(button) && button >= 0 && button <= 16).filter((button, index, all) => all.indexOf(button) === index).slice(0, 4);
    if (!safe.length) throw new Error('Bind at least one valid controller button');
    for (const target of Object.keys(current.bindings) as ArcadeInputAction[]) if (target !== action) current.bindings[target] = current.bindings[target].filter(button => !safe.includes(button));
    current.bindings[action] = safe;
    return this.save(id, current);
  }

  reset(id: string) {
    const all = this.readAll();
    delete all[fingerprintController(id).id];
    this.writeAll(all);
    return structuredClone(DEFAULT_CONTROLLER_PROFILE);
  }

  private readAll() {
    try {
      const parsed = JSON.parse(this.storage.getItem(STORE_KEY) ?? '{}') as Record<string, Partial<ControllerProfile>>;
      return Object.fromEntries(Object.entries(parsed).slice(0, 32).map(([key, value]) => [key, sanitizeControllerProfile(value)]));
    } catch { return {} as Record<string, ControllerProfile>; }
  }

  private writeAll(profiles: Record<string, ControllerProfile>) {
    this.storage.setItem(STORE_KEY, JSON.stringify(profiles));
  }
}
