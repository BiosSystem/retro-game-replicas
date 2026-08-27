export type CabinetTheme = 'NEON' | 'CLASSIC' | 'CYBER' | 'AMBER';
export type ControlAction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE';

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ArcadePreferences {
  theme: CabinetTheme;
  bindings: Record<ControlAction, string[]>;
}

const DEFAULTS: ArcadePreferences = {
  theme: 'NEON',
  bindings: { UP: ['KeyW'], DOWN: ['KeyS'], LEFT: ['KeyA'], RIGHT: ['KeyD'], FIRE: ['Space'] },
};

export class PreferenceStore {
  private readonly key = 'bios_arcade_preferences_v1';
  private readonly storage: StoragePort;

  constructor(storage: StoragePort) { this.storage = storage; }

  load(): ArcadePreferences {
    try {
      const parsed = JSON.parse(this.storage.getItem(this.key) ?? '{}') as Partial<ArcadePreferences>;
      const theme = parsed.theme === 'CLASSIC' || parsed.theme === 'CYBER' || parsed.theme === 'AMBER' ? parsed.theme : 'NEON';
      return { theme, bindings: this.sanitizeBindings(parsed.bindings) };
    } catch {
      return structuredClone(DEFAULTS);
    }
  }

  setTheme(theme: CabinetTheme) {
    const current = this.load();
    current.theme = theme;
    this.storage.setItem(this.key, JSON.stringify(current));
  }

  setBinding(action: ControlAction, codes: string[]) {
    const safe = [...new Set(codes.filter(code => /^[A-Za-z0-9]{1,24}$/.test(code)))].slice(0, 3);
    if (safe.length === 0) throw new Error('At least one valid key code is required');
    const current = this.load();
    current.bindings[action] = safe;
    this.storage.setItem(this.key, JSON.stringify(current));
  }

  private sanitizeBindings(bindings: Partial<Record<ControlAction, string[]>> | undefined) {
    const safe = structuredClone(DEFAULTS.bindings);
    for (const action of Object.keys(safe) as ControlAction[]) {
      const candidate = bindings?.[action]?.filter(code => /^[A-Za-z0-9]{1,24}$/.test(code)).slice(0, 3);
      if (candidate?.length) safe[action] = [...new Set(candidate)];
    }
    return safe;
  }
}
