import { describe, expect, it } from 'vitest';
import { exportShaderWorkshopSettings, importShaderWorkshopSettings, SHADER_WORKSHOP_PRESETS, validateShaderWorkshopSettings } from './ShaderWorkshop';

describe('shader workshop presets', () => {
  it('ships five bounded factory profiles', () => expect(Object.keys(SHADER_WORKSHOP_PRESETS)).toHaveLength(5));
  it('clamps imported uniforms and rejects malformed payloads', () => { expect(validateShaderWorkshopSettings({ curvature: 9, persistenceMs: -3 }).curvature).toBe(.14); expect(importShaderWorkshopSettings('{')).toBeNull(); expect(importShaderWorkshopSettings(exportShaderWorkshopSettings({ bloomIntensity: .5 }))?.bloomIntensity).toBe(.5); });
});
