import { bench, describe } from 'vitest';
import { singularityPathScene, tracePath } from './PathTracer';
const scene = singularityPathScene(113);
describe('path tracing throughput', () => { bench('trace 100,000 recursive rays', () => { for (let index = 0; index < 100_000; index++) tracePath(scene, { x: 0, y: 1.2, z: -7 }, { x: (index % 251) / 125 - 1, y: ((index / 251) % 127) / 127 - .5, z: 1 }, index, 4); }); });
