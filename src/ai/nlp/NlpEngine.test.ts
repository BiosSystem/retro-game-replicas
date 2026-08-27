import { describe, expect, it } from 'vitest';
import { LocalDialogueEngine } from './DialogueEngine';
import { Int4Matrix } from './Int4Tensor';
import { TinyInt4Transformer } from './TinyTransformer';
import { INT4_INFERENCE_WGSL, int4Dispatch } from './WebGpuInt4';
describe('local INT4 dialogue engine', () => {
  it('packs signed four-bit weights and projects deterministically', () => { const matrix = Int4Matrix.generated(4, 8, 42); expect(matrix.packed).toHaveLength(16); expect(matrix.project(Float32Array.from({ length: 8 }, () => 1))).toEqual(matrix.project(Float32Array.from({ length: 8 }, () => 1))); });
  it('generates bounded text from code-owned weights', () => { const model = new TinyInt4Transformer(9); const first = model.generate('shadow portal vault', 10, 7); expect(first).toBe(model.generate('shadow portal vault', 10, 7)); expect(first.split(' ').length).toBeLessThanOrEqual(10); expect(model.parameterBytes()).toBeLessThan(100_000); });
  it('conditions sanitized NPC dialogue on local gameplay context', () => { const engine = new LocalDialogueEngine(4); const line = engine.speak({ npc: '<guard>', player: 'bios', avatarTier: 4, victories: 8, stealth: .9, room: 3, objective: 'steal key' }); expect(line).toMatch(/^GUARD:/); expect(line).not.toContain('<'); });
  it('defines bounded WebGPU INT4 projection dispatch', () => { expect(INT4_INFERENCE_WGSL).toContain('@compute @workgroup_size(64)'); expect(int4Dispatch(1000)).toBe(16); });
});
