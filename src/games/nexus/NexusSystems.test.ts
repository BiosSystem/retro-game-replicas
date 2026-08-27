import { describe, expect, it } from 'vitest';
import { NEXUS_ARCADES, generateNexusCabinets, nearestCabinet, nexusTerrain } from './NexusSystems';
describe('Neon Nexus world', () => {
  it('spawns all thirteen prior flagship arcades without assets', () => { const cabinets = generateNexusCabinets(7, 3); expect(cabinets).toHaveLength(13); expect(cabinets.map(item => item.scene)).toEqual([...NEXUS_ARCADES]); expect(generateNexusCabinets(7, 3)).toEqual(cabinets); });
  it('deforms deterministic procedural terrain', () => { const base = nexusTerrain(8, 1, 2), carved = nexusTerrain(8, 1, 2, [{ x: 1, z: 2, radius: 4 }]); expect(carved).toBeLessThan(base); });
  it('selects the nearest playable cabinet', () => { const cabinets = generateNexusCabinets(4, 3), cabinet = cabinets[4]; expect(nearestCabinet(cabinets, cabinet.x, cabinet.z)).toEqual(cabinet); });
});
