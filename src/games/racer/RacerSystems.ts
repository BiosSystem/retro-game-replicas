export interface RoadSample { index: number; curve: number; elevation: number; lane: number; roadside: 'TREE' | 'SIGN' | 'LAMP'; }
export interface RoadProjection { y: number; center: number; halfWidth: number; scale: number; }

export function generateRoadSample(index: number, seed = 0x52414345): RoadSample {
  const safe = Math.max(0, Math.floor(index)); const phase = (safe + seed % 997) * 0.071; const curve = Math.sin(phase) * 0.72 + Math.sin(phase * 0.37) * 0.28; const elevation = Math.sin(phase * 0.61) * 0.35; const roadside = safe % 11 === 0 ? 'SIGN' : safe % 5 === 0 ? 'LAMP' : 'TREE'; return { index: safe, curve, elevation, lane: ((Math.imul(safe + seed, 1103515245) >>> 16) % 3) - 1, roadside };
}

export function projectRoadScanline(y: number, horizon: number, viewportWidth: number, curve: number): RoadProjection {
  const depth = clamp((y - horizon) / Math.max(1, 480 - horizon), 0, 1); const scale = depth * depth; return { y, center: viewportWidth / 2 + curve * 170 * scale, halfWidth: 18 + scale * viewportWidth * 0.47, scale };
}

export function advanceRacer(speed: number, throttle: number, brake: boolean, gear: number, dt: number) {
  const max = 80 + gear * 55; const acceleration = throttle * (62 - gear * 5); const drag = 9 + speed * 0.035; const next = clamp(speed + (acceleration - drag - (brake ? 95 : 0)) * dt, 0, max); return next;
}

export function shiftGear(gear: number, direction: -1 | 1) { return clamp(Math.trunc(gear + direction), 1, 5); }
export function collisionSeverity(playerLane: number, obstacleLane: number, depth: number) { if (depth < 0.82 || Math.abs(playerLane - obstacleLane) > 0.38) return 0; return clamp((depth - 0.82) / 0.18, 0, 1); }
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, value)); }
