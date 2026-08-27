import { describe, expect, it } from 'vitest';
import { buildPortalViews, buildStencilPasses, PORTAL_STENCIL_STATE } from './PortalStencilPipeline';
import { magnitude, transitionBody, transitionProjectileBuffer, type Portal } from './PortalPhysics';

const portals: Portal[] = [
  { id: 1, linkedId: 2, position: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 1 }, up: { x: 0, y: 1, z: 0 }, halfWidth: 2, halfHeight: 3 },
  { id: 2, linkedId: 1, position: { x: 10, y: 2, z: 4 }, normal: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 }, halfWidth: 2, halfHeight: 3 },
];

describe('portal engine', () => {
  it('preserves momentum magnitude and rotates gravity across portal frames', () => {
    const source = { id: 1, previousPosition: { x: 0, y: 0, z: 1 }, position: { x: 0, y: 0, z: -.1 }, velocity: { x: 0, y: 0, z: -8 }, gravity: { x: 0, y: -9.8, z: 0 }, portalCooldown: 0 };
    const result = transitionBody(source, portals, 1 / 60);
    expect(result.portalId).toBe(1);
    expect(magnitude(result.body.velocity)).toBeCloseTo(8, 6);
    expect(magnitude(result.body.gravity)).toBeCloseTo(9.8, 6);
    expect(result.body.position.x).toBeGreaterThan(9);
  });
  it('transitions packed ECS projectile records without allocation leaks into inputs', () => {
    const input = Float32Array.of(0, 0, 1, 0, 0, -.1, 0, 0, -4);
    const output = transitionProjectileBuffer(input, portals);
    expect(output).not.toBe(input); expect(output[3]).toBeGreaterThan(9); expect(Math.hypot(output[6], output[7], output[8])).toBeCloseTo(4, 5);
  });
  it('bounds recursive stencil views at four levels', () => {
    const views = buildPortalViews({ position: { x: 0, y: 1, z: 4 }, forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } }, portals, 99);
    expect(Math.max(...views.map(view => view.depth))).toBe(4);
    expect(buildStencilPasses(views)).toHaveLength(views.length * 3);
    expect(PORTAL_STENCIL_STATE.maximumDepth).toBe(4);
  });
});
