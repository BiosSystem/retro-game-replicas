import { describe, expect, it } from 'vitest';
import { PathDenoiser } from './PathDenoiser';
import { detectPathTracingTier } from './PathTracingCompute';
import { renderPathFrame, singularityPathScene, tracePath } from './PathTracer';

describe('recursive path tracing', () => {
  it('traces bounded reflection and refraction paths deterministically', () => { const scene = singularityPathScene(31), a = tracePath(scene, { x: 0, y: 1.2, z: -7 }, { x: .15, y: -.05, z: 1 }, 9), b = tracePath(scene, { x: 0, y: 1.2, z: -7 }, { x: .15, y: -.05, z: 1 }, 9); expect(a).toEqual(b); expect(a.bounces).toBeLessThanOrEqual(6); expect(Object.values(a.color).every(Number.isFinite)).toBe(true); });
  it('stabilizes repeated frames with a spatial-temporal filter', () => { const tracer = singularityPathScene(47), denoiser = new PathDenoiser(), a = denoiser.resolve(renderPathFrame(tracer, 24, 16, 1, 1)), b = denoiser.resolve(renderPathFrame(tracer, 24, 16, 1, 2)); expect(a).toHaveLength(1152); expect(b.every(Number.isFinite)).toBe(true); });
  it('labels unstandardized ray tracing features as experimental', () => { expect(detectPathTracingTier(new Set())).toBe('WEBGPU_COMPUTE'); expect(detectPathTracingTier(new Set(['ray-tracing']))).toBe('EXPERIMENTAL_RAY_TRACING'); });
});
