import { describe, expect, it } from 'vitest';
import { GAUSSIAN_SPLAT_WGSL, generateProceduralSplatCloud, projectSplatCloud, splatChecksum } from './splatting';

describe('procedural Gaussian splatting', () => {
  it('generates a deterministic bounded structure-of-arrays payload', () => {
    const first = generateProceduralSplatCloud(71, 10_000);
    const second = generateProceduralSplatCloud(71, 10_000);
    expect(first.data).toEqual(second.data);
    expect(first.count).toBe(10_000);
    expect(splatChecksum(first)).toBe(splatChecksum(second));
  });

  it('projects visible splats in back-to-front order', () => {
    const cloud = generateProceduralSplatCloud(72, 4_096);
    const projected = projectSplatCloud(cloud, { x: 0, y: 4, z: -70, yaw: 0, pitch: 0, focalLength: 280, near: 0.5 }, 640, 480, 512);
    expect(projected.length).toBeGreaterThan(100);
    for (let index = 1; index < projected.length; index++) expect(projected[index - 1].depth).toBeGreaterThanOrEqual(projected[index].depth);
    expect(projected.every(splat => splat.opacity > 0 && splat.radiusX > 0 && splat.radiusY > 0)).toBe(true);
  });

  it('publishes instanced Gaussian alpha blending through WebGPU', () => {
    expect(GAUSSIAN_SPLAT_WGSL).toContain('@builtin(instance_index)');
    expect(GAUSSIAN_SPLAT_WGSL).toContain('exp(-2.0');
  });
});
