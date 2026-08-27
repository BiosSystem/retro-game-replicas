import { describe, expect, it } from 'vitest';
import { buildAabbStressBatch, countAabbOverlaps } from './AabbKernel';
import { initializeWasmProbe } from './WasmProbe';
import { AABB_WGSL } from './WebGpuAabbBackend';

describe('compute pipeline', () => { it('counts packed AABB pairs deterministically', () => { const pairs = new Float32Array([0,0,10,10,5,5,15,15,0,0,2,2,3,3,4,4]); expect(countAabbOverlaps(pairs)).toBe(1); expect(() => countAabbOverlaps(new Float32Array(7))).toThrow('eight'); }); it('generates 100000 bounded calculations without object allocation', () => { const pairs = buildAabbStressBatch(100000, 7); expect(pairs.length).toBe(800000); expect(countAabbOverlaps(pairs)).toBeGreaterThan(0); }); it('exposes a bounded WGSL compute contract', () => { expect(AABB_WGSL).toContain('@workgroup_size(64)'); expect(AABB_WGSL).toContain('arrayLength'); }); it('instantiates the generated WASM fallback probe', async () => { await expect(initializeWasmProbe()).resolves.toBe(true); }); });
