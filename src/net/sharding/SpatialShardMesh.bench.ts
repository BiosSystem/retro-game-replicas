import { bench, describe } from 'vitest';
import { SpatialShardMesh } from './SpatialShardMesh';
const mesh = new SpatialShardMesh(16); for (let index = 0; index < 8; index++) mesh.upsertPeer({ id: `peer-${index}`, capacity: 1 + index % 3 });
describe('spatial sharding convergence', () => { bench('assign one million virtual chunks over eight peers', () => { mesh.convergenceDigest(1_000_000, 2); }); });
