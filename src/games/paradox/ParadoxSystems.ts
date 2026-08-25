import type { Portal, Vec3 } from '../../engine/portals/PortalPhysics';
import type { TraceBox } from '../../graphics/raytracing/BvhTracer';
export interface ParadoxPlayer { x: number; z: number; angle: number; vx: number; vz: number; room: number; loot: number; detected: number; }
export interface ParadoxGuard { id: number; x: number; z: number; angle: number; alert: number; }
export interface ParadoxLevel { seed: number; room: number; boxes: TraceBox[]; guards: ParadoxGuard[]; objective: Vec3; tesseract: Vec3[]; }

const wall = { albedo: { x: .15, y: .35, z: .55 }, emission: { x: .005, y: .02, z: .04 }, roughness: .35, metallic: .65 };
const floor = { albedo: { x: .12, y: .12, z: .16 }, emission: { x: 0, y: 0, z: 0 }, roughness: .7, metallic: .15 };

export function generateParadoxLevel(room: number, seed = 0x50454e52): ParadoxLevel {
  let state = seed ^ Math.imul(room + 1, 0x9e3779b1); const next = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0; };
  const boxes: TraceBox[] = [
    { id: 0, minimum: { x: -14, y: -.5, z: -14 }, maximum: { x: 14, y: 0, z: 14 }, material: floor },
    { id: 1, minimum: { x: -14, y: 0, z: -14 }, maximum: { x: -13.5, y: 5, z: 14 }, material: wall },
    { id: 2, minimum: { x: 13.5, y: 0, z: -14 }, maximum: { x: 14, y: 5, z: 14 }, material: wall },
  ];
  for (let i = 0; i < 12; i++) { const x = -10 + next() % 21, z = -10 + next() % 21, height = 1.5 + next() % 30 / 10; boxes.push({ id: 3 + i, minimum: { x, y: 0, z }, maximum: { x: x + .5 + next() % 20 / 10, y: height, z: z + .5 + next() % 20 / 10 }, material: i % 4 === 0 ? { ...wall, emission: { x: .08, y: .01, z: .08 } } : wall }); }
  const guards = Array.from({ length: 2 + Math.min(5, room) }, (_, id) => ({ id, x: -8 + next() % 17, z: -8 + next() % 17, angle: next() / 0xffffffff * Math.PI * 2, alert: 0 }));
  const tesseract: Vec3[] = []; for (let layer = 0; layer < 2; layer++) for (let corner = 0; corner < 8; corner++) tesseract.push({ x: (corner & 1 ? 1 : -1) * (2 + layer), y: (corner & 2 ? 1 : -1) * (2 + layer), z: (corner & 4 ? 1 : -1) * (2 + layer) });
  return { seed, room, boxes, guards, objective: { x: 8 - next() % 16, y: .4, z: 8 - next() % 16 }, tesseract };
}

export function initialParadoxPlayer(): ParadoxPlayer { return { x: 0, z: 8, angle: -Math.PI / 2, vx: 0, vz: 0, room: 0, loot: 0, detected: 0 }; }
export function stepParadox(source: ParadoxPlayer, input: { forward: number; strafe: number; turn: number }, dt: number) { const state = { ...source }, seconds = Math.max(0, Math.min(.05, dt)); state.angle += Math.max(-1, Math.min(1, input.turn)) * 2.2 * seconds; const fx = Math.cos(state.angle), fz = Math.sin(state.angle), rx = -fz, rz = fx; const targetX = (fx * input.forward + rx * input.strafe) * 4.2, targetZ = (fz * input.forward + rz * input.strafe) * 4.2; state.vx += (targetX - state.vx) * Math.min(1, seconds * 9); state.vz += (targetZ - state.vz) * Math.min(1, seconds * 9); state.x = Math.max(-13.2, Math.min(13.2, state.x + state.vx * seconds)); state.z = Math.max(-13.2, Math.min(13.2, state.z + state.vz * seconds)); return state; }
export function updateGuards(source: readonly ParadoxGuard[], player: ParadoxPlayer, shadow: number, dt: number) { return source.map(guard => { const next = { ...guard }, dx = player.x - guard.x, dz = player.z - guard.z, distance = Math.hypot(dx, dz), visible = shadow > .12 && distance < 7; next.alert = Math.max(0, Math.min(1, next.alert + (visible ? dt * .9 : -dt * .3))); if (next.alert > .35) { next.angle = Math.atan2(dz, dx); next.x += Math.cos(next.angle) * dt * (1 + next.alert); next.z += Math.sin(next.angle) * dt * (1 + next.alert); } else next.angle += dt * .35; return next; }); }
export function makeAnchor(id: number, linkedId: number, position: Vec3, angle: number): Portal { return { id, linkedId, position, normal: { x: -Math.cos(angle), y: 0, z: -Math.sin(angle) }, up: { x: 0, y: 1, z: 0 }, halfWidth: 1.15, halfHeight: 2 }; }
