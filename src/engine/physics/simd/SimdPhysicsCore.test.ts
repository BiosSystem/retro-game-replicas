import { describe, expect, it } from 'vitest';
import { SCALAR_PHYSICS_WASM, SIMD_PHYSICS_WASM, ScalarWasmPhysicsCore, SimdPhysicsCore, batchCollisionScalar, supportsWasmSimd } from './SimdPhysicsCore';

function inputs(count: number) {
  const ax = Float32Array.from({ length: count }, (_, index) => Math.sin(index) * 20);
  const ay = Float32Array.from({ length: count }, (_, index) => Math.cos(index * 0.7) * 15);
  const bx = Float32Array.from({ length: count }, (_, index) => index % 7);
  const by = Float32Array.from({ length: count }, (_, index) => -(index % 5));
  const radii = Float32Array.from({ length: count }, (_, index) => 1 + index % 3);
  return { ax, ay, bx, by, radii };
}

describe('WebAssembly 128-bit SIMD physics', () => {
  it('emits a valid import-free SIMD module', () => {
    expect(supportsWasmSimd()).toBe(true);
    const module = new WebAssembly.Module(SIMD_PHYSICS_WASM);
    expect(WebAssembly.Module.imports(module)).toEqual([]);
    expect([...SIMD_PHYSICS_WASM].filter(byte => byte === 0xfd).length).toBeGreaterThan(8);
  });

  it('matches the deterministic scalar collision reference', async () => {
    const core = await SimdPhysicsCore.create();
    const scalarWasm = await ScalarWasmPhysicsCore.create();
    expect(core).not.toBeNull();
    const values = inputs(4_099);
    const scalar = batchCollisionScalar(values.ax, values.ay, values.bx, values.by, values.radii);
    const simd = core!.collisionSeparation(values.ax, values.ay, values.bx, values.by, values.radii);
    expect(simd).toEqual(scalar);
    expect(scalarWasm.collisionSeparation(values.ax, values.ay, values.bx, values.by, values.radii)).toEqual(scalar);
    expect(WebAssembly.validate(SCALAR_PHYSICS_WASM)).toBe(true);
  });

  it('batches finite gravity vectors and relativistic time factors', async () => {
    const core = await SimdPhysicsCore.create();
    const values = inputs(8_192);
    const gravity = core!.gravityVectors(values.ax, values.ay, 50, -20, 18);
    const time = core!.timeDilation(values.bx, values.by, 340);
    expect(gravity.x).toHaveLength(8_192);
    expect([...gravity.x, ...gravity.y, ...time].every(Number.isFinite)).toBe(true);
    expect(time.every(value => value > 0 && value <= 1)).toBe(true);
  });

  it('rejects mismatched or oversized batches', async () => {
    const core = await SimdPhysicsCore.create();
    expect(() => core!.collisionSeparation(new Float32Array(4), new Float32Array(5), new Float32Array(4), new Float32Array(4), new Float32Array(4))).toThrow();
  });
});
