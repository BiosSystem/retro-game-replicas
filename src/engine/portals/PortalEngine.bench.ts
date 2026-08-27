import { bench, describe } from 'vitest';
import { buildPortalViews } from './PortalStencilPipeline';
import type { Portal } from './PortalPhysics';
const portals: Portal[] = [{ id: 1, linkedId: 2, position: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 1 }, up: { x: 0, y: 1, z: 0 }, halfWidth: 2, halfHeight: 3 }, { id: 2, linkedId: 1, position: { x: 8, y: 0, z: 0 }, normal: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 }, halfWidth: 2, halfHeight: 3 }];
describe('recursive portal planning', () => { bench('plan 1,000 four-level portal frames', () => { for (let i = 0; i < 1000; i++) buildPortalViews({ position: { x: 0, y: 1, z: 4 }, forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } }, portals, 4); }); });
