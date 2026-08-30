export type ShaderWorkshopPreset = 'CLEAN_ARCADE' | 'VECTOR_TUBE_1983' | 'WORN_CYBERPUNK' | 'OVERDRIVE_NEON_LAB' | 'FLAT_DIGITAL_STUDIO';

export interface ShaderWorkshopSettings {
  curvature: number; scanlineIntensity: number; bloomIntensity: number; shadowMaskIntensity: number; persistenceMs: number; aberrationPixels: number; vignetteIntensity: number;
}

export const SHADER_WORKSHOP_PRESETS: Readonly<Record<ShaderWorkshopPreset, ShaderWorkshopSettings>> = {
  CLEAN_ARCADE: { curvature: 0.015, scanlineIntensity: 0.08, bloomIntensity: 0.06, shadowMaskIntensity: 0.08, persistenceMs: 0, aberrationPixels: 0.15, vignetteIntensity: 0.12 },
  VECTOR_TUBE_1983: { curvature: 0.11, scanlineIntensity: 0.34, bloomIntensity: 0.22, shadowMaskIntensity: 0.16, persistenceMs: 72, aberrationPixels: 0.7, vignetteIntensity: 0.56 },
  WORN_CYBERPUNK: { curvature: 0.08, scanlineIntensity: 0.42, bloomIntensity: 0.28, shadowMaskIntensity: 0.42, persistenceMs: 96, aberrationPixels: 1.4, vignetteIntensity: 0.66 },
  OVERDRIVE_NEON_LAB: { curvature: 0.045, scanlineIntensity: 0.2, bloomIntensity: 0.34, shadowMaskIntensity: 0.28, persistenceMs: 42, aberrationPixels: 1.1, vignetteIntensity: 0.32 },
  FLAT_DIGITAL_STUDIO: { curvature: 0, scanlineIntensity: 0, bloomIntensity: 0, shadowMaskIntensity: 0, persistenceMs: 0, aberrationPixels: 0, vignetteIntensity: 0 },
};

const STORAGE_KEY = 'arcade_shader_workshop_v1';
export function validateShaderWorkshopSettings(value: Partial<ShaderWorkshopSettings>): ShaderWorkshopSettings {
  const base = SHADER_WORKSHOP_PRESETS.CLEAN_ARCADE;
  return { curvature: clamp(value.curvature, 0, .14, base.curvature), scanlineIntensity: clamp(value.scanlineIntensity, 0, 1, base.scanlineIntensity), bloomIntensity: clamp(value.bloomIntensity, 0, 1, base.bloomIntensity), shadowMaskIntensity: clamp(value.shadowMaskIntensity, 0, 1, base.shadowMaskIntensity), persistenceMs: clamp(value.persistenceMs, 0, 120, base.persistenceMs), aberrationPixels: clamp(value.aberrationPixels, 0, 2, base.aberrationPixels), vignetteIntensity: clamp(value.vignetteIntensity, 0, 1, base.vignetteIntensity) };
}
export function readShaderWorkshopSettings(storage: Storage): ShaderWorkshopSettings { try { return validateShaderWorkshopSettings(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')); } catch { return { ...SHADER_WORKSHOP_PRESETS.CLEAN_ARCADE }; } }
export function writeShaderWorkshopSettings(storage: Storage, value: Partial<ShaderWorkshopSettings>): ShaderWorkshopSettings { const valid = validateShaderWorkshopSettings(value); storage.setItem(STORAGE_KEY, JSON.stringify(valid)); return valid; }
export function exportShaderWorkshopSettings(value: Partial<ShaderWorkshopSettings>): string { return JSON.stringify(validateShaderWorkshopSettings(value)); }
export function importShaderWorkshopSettings(value: string): ShaderWorkshopSettings | null { try { const parsed: unknown = JSON.parse(value); return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? validateShaderWorkshopSettings(parsed as Partial<ShaderWorkshopSettings>) : null; } catch { return null; } }
function clamp(value: unknown, minimum: number, maximum: number, fallback: number) { const number = Number(value); return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback; }
