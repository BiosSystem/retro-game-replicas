import { transformPoint, transformVector, type Portal, type Vec3 } from './PortalPhysics';

export interface PortalCamera { position: Vec3; forward: Vec3; up: Vec3; }
export interface PortalView { depth: number; stencilReference: number; entryId: number; exitId: number; camera: PortalCamera; path: number[]; }
export interface PortalPass { kind: 'MASK' | 'VIEW' | 'DEPTH_RESTORE'; depth: number; stencilReference: number; portalId: number; }

export function buildPortalViews(camera: PortalCamera, portals: readonly Portal[], maximumDepth = 4) {
  const limit = Math.max(0, Math.min(4, Math.floor(maximumDepth)));
  const views: PortalView[] = [];
  const visit = (activeCamera: PortalCamera, depth: number, path: number[]) => {
    if (depth >= limit) return;
    for (const entry of portals) {
      const exit = portals.find(portal => portal.id === entry.linkedId);
      if (!exit) continue;
      const nextCamera = { position: transformPoint(activeCamera.position, entry, exit), forward: transformVector(activeCamera.forward, entry, exit), up: transformVector(activeCamera.up, entry, exit) };
      const nextPath = [...path, entry.id];
      views.push({ depth: depth + 1, stencilReference: depth + 1, entryId: entry.id, exitId: exit.id, camera: nextCamera, path: nextPath });
      visit(nextCamera, depth + 1, nextPath);
    }
  };
  visit(camera, 0, []);
  return views;
}

export function buildStencilPasses(views: readonly PortalView[]): PortalPass[] {
  const passes: PortalPass[] = [];
  for (const view of views) {
    passes.push({ kind: 'MASK', depth: view.depth, stencilReference: view.stencilReference, portalId: view.entryId });
    passes.push({ kind: 'VIEW', depth: view.depth, stencilReference: view.stencilReference, portalId: view.entryId });
    passes.push({ kind: 'DEPTH_RESTORE', depth: view.depth, stencilReference: view.stencilReference, portalId: view.entryId });
  }
  return passes;
}

export const PORTAL_STENCIL_STATE = Object.freeze({
  format: 'depth24plus-stencil8',
  mask: { compare: 'equal', failOp: 'keep', depthFailOp: 'keep', passOp: 'increment-clamp' },
  view: { compare: 'equal', failOp: 'keep', depthFailOp: 'keep', passOp: 'keep' },
  restore: { compare: 'equal', failOp: 'keep', depthFailOp: 'keep', passOp: 'decrement-clamp' },
  maximumDepth: 4,
});
