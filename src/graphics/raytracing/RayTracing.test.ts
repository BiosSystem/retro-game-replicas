import { describe, expect, it } from 'vitest';
import { buildBvh, traceBvh, traceGlobalIllumination, type TraceBox } from './BvhTracer';
import { detectRayTracingTier, RAYTRACE_BVH_WGSL, raytraceDispatch } from './RayTracingCompute';
import { TemporalDenoiser } from './TemporalDenoiser';
const material = { albedo: { x: .8, y: .4, z: .2 }, emission: { x: 0, y: 0, z: 0 }, roughness: .5, metallic: .2 };
describe('compute BVH global illumination', () => {
  it('builds deterministic bounds and returns the closest surface', () => { const boxes: TraceBox[] = [{ id: 1, minimum: { x: -1, y: -1, z: 4 }, maximum: { x: 1, y: 1, z: 6 }, material }, { id: 2, minimum: { x: -1, y: -1, z: 9 }, maximum: { x: 1, y: 1, z: 11 }, material }]; const bvh = buildBvh(boxes, 1); expect(traceBvh(bvh, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 })?.box.id).toBe(1); expect(traceGlobalIllumination(bvh, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 4, y: 5, z: 0 }).x).toBeGreaterThanOrEqual(0); });
  it('denoises stable history and rejects disocclusion', () => { const denoiser = new TemporalDenoiser(); denoiser.resolve({ color: Float32Array.of(1, 0, 0), depth: Float32Array.of(1), motion: Float32Array.of(0, 0) }); const stable = denoiser.resolve({ color: Float32Array.of(.8, 0, 0), depth: Float32Array.of(1), motion: Float32Array.of(0, 0) }); expect(stable[0]).toBeGreaterThan(.8); const reset = denoiser.resolve({ color: Float32Array.of(.2, 0, 0), depth: Float32Array.of(2), motion: Float32Array.of(0, 0) }); expect(reset[0]).toBeCloseTo(.2); });
  it('uses the standard compute tier unless a future feature is explicit', () => { expect(detectRayTracingTier(new Set())).toBe('STANDARD_COMPUTE_BVH'); expect(detectRayTracingTier(new Set(['ray-tracing']))).toBe('EXPERIMENTAL_HARDWARE_RAY_TRACING'); expect(RAYTRACE_BVH_WGSL).toContain('@compute @workgroup_size(8, 8)'); expect(raytraceDispatch(640, 480)).toEqual({ x: 80, y: 60 }); });
});
