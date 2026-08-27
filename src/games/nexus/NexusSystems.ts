import { VoxelPlanet } from '../../engine/voxel/VoxelPlanet';

export const NEXUS_ARCADES = [
  'AsteroidsScene', 'BreakoutScene', 'CyberScene', 'RacerScene', 'RaycasterScene', 'TacticsScene', 'LabyrinthScene',
  'DanmakuScene', 'KombatScene', 'OdysseyScene', 'ChronoScene', 'ParadoxScene', 'MetaArcadeScene',
] as const;

export interface NexusCabinet { scene: typeof NEXUS_ARCADES[number]; x: number; z: number; hue: number; }
export function generateNexusCabinets(seed = 0x4e455855, rings = 3) {
  const cabinets: NexusCabinet[] = []; const count = Math.max(1, Math.min(13, rings * 5));
  for (let index = 0; index < count; index++) { const angle = index / count * Math.PI * 2 + seeded(seed, index) * .2, radius = 6 + index % Math.max(1, rings) * 4; cabinets.push({ scene: NEXUS_ARCADES[index], x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, hue: Math.floor(seeded(seed ^ 99, index) * 360) }); }
  return cabinets;
}
export function nexusTerrain(seed: number, x: number, z: number, craters: ReadonlyArray<{ x: number; z: number; radius: number }> = []) {
  const planet = new VoxelPlanet(seed, 96); for (const crater of craters) planet.carve({ x: crater.x, y: 95, z: crater.z }, crater.radius, crater.radius * 1.4);
  return planet.density(x, 95, z);
}
export function nearestCabinet(cabinets: readonly NexusCabinet[], x: number, z: number) { return [...cabinets].sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0]; }
function seeded(seed: number, index: number) { let value = Math.imul(seed ^ index, 0x45d9f3b); value = Math.imul(value ^ value >>> 16, 0x45d9f3b); return ((value ^ value >>> 16) >>> 0) / 0xffffffff; }
