import { bench, describe } from 'vitest';
import { buildAabbStressBatch, countAabbOverlaps } from './AabbKernel';
const batch = buildAabbStressBatch(100000, 77);
describe('compute broad phase stress', () => { bench('calculate 100000 packed AABB pairs', () => { countAabbOverlaps(batch); }, { time: 500 }); });
