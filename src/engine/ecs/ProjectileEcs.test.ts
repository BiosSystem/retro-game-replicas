import { describe, expect, it } from 'vitest';
import { MAX_PROJECTILES, ProjectileEcs } from './ProjectileEcs';
import { PROJECTILE_WGSL, projectileDispatchSize } from './ProjectileCompute';
describe('ProjectileEcs', () => {
  it('bounds capacity and reuses fixed storage', () => { const ecs = new ProjectileEcs(MAX_PROJECTILES + 1, false); expect(ecs.capacity).toBe(MAX_PROJECTILES); for (let i = 0; i < 10; i++) expect(ecs.spawn({ x: 10, y: 10, vx: 1, vy: 2 })).toBe(i); const x = ecs.x; ecs.update(1 / 60); expect(ecs.x).toBe(x); expect(ecs.activeCount).toBe(10); });
  it('steers homing bullets and expires them', () => { const ecs = new ProjectileEcs(2, false); const id = ecs.spawn({ x: 0, y: 0, vx: 100, vy: 0, life: .02, kind: 2 }); ecs.update(.01, 0, 100); expect(ecs.vy[id]).toBeGreaterThan(0); ecs.update(.02); expect(ecs.activeCount).toBe(0); });
  it('publishes a bounded WebGPU dispatch contract', () => { expect(projectileDispatchSize(100_000)).toBe(1563); expect(projectileDispatchSize(1e9)).toBe(1563); expect(PROJECTILE_WGSL).toContain('@workgroup_size(64)'); });
});
