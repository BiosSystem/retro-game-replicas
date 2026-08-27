import { bench, describe } from 'vitest';
import { buildBvh, traceGlobalIllumination, type TraceBox } from './BvhTracer';
const material = { albedo: { x: .7, y: .6, z: .5 }, emission: { x: 0, y: 0, z: 0 }, roughness: .4, metallic: .3 };
const boxes: TraceBox[] = Array.from({ length: 256 }, (_, i) => ({ id: i, minimum: { x: i % 16 - 8, y: Math.floor(i / 16) - 8, z: 4 + i % 7 }, maximum: { x: i % 16 - 7.2, y: Math.floor(i / 16) - 7.2, z: 4.7 + i % 7 }, material }));
const bvh = buildBvh(boxes);
describe('BVH GI', () => { bench('trace 10,000 two-bounce GI rays', () => { let sum = 0; for (let i = 0; i < 10000; i++) sum += traceGlobalIllumination(bvh, { x: 0, y: 0, z: 0 }, { x: (i % 100) / 50 - 1, y: (i % 77) / 38.5 - 1, z: 1 }, { x: 4, y: 8, z: 0 }, 2, i).x; if (sum < 0) throw new Error('Unreachable'); }); });
