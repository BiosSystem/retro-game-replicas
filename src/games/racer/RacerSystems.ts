export interface RoadSample { index: number; curve: number; elevation: number; lane: number; roadside: 'TREE' | 'SIGN' | 'LAMP'; }
export interface RoadProjection { y: number; center: number; halfWidth: number; scale: number; }
export interface HorizonBackdrop { top: number; bottom: number; sun: number; city: readonly { x: number; width: number; height: number; color: number }[]; }

export const RACER_TICK_SECONDS = 1 / 60;

export function generateRoadSample(index: number, seed = 0x52414345): RoadSample {
  const safe = Math.max(0, Math.floor(index)); const phase = (safe + seed % 997) * 0.071; const curve = Math.sin(phase) * 0.72 + Math.sin(phase * 0.37) * 0.28; const elevation = Math.sin(phase * 0.61) * 0.35; const roadside = safe % 11 === 0 ? 'SIGN' : safe % 5 === 0 ? 'LAMP' : 'TREE'; return { index: safe, curve, elevation, lane: ((Math.imul(safe + seed, 1103515245) >>> 16) % 3) - 1, roadside };
}

export function projectRoadScanline(y: number, horizon: number, viewportWidth: number, curve: number): RoadProjection {
  const depth = clamp((y - horizon) / Math.max(1, 480 - horizon), 0, 1); const scale = depth * depth; return { y, center: viewportWidth / 2 + curve * 170 * scale, halfWidth: 18 + scale * viewportWidth * 0.47, scale };
}

export function generateHorizonBackdrop(segment: number, seed = 0x43595459): HorizonBackdrop {
  const safe = Math.max(0, Math.floor(segment)); const phase = (safe + seed % 4093) * 0.019;
  const top = hslToRgb((280 + Math.floor(Math.sin(phase) * 42) + 360) % 360, 0.62, 0.13);
  const bottom = hslToRgb((326 + Math.floor(Math.cos(phase * 0.7) * 28) + 360) % 360, 0.88, 0.29);
  const sun = hslToRgb((330 + Math.floor(Math.sin(phase * 0.31) * 20) + 360) % 360, 0.95, 0.67);
  const city = Array.from({ length: 18 }, (_, index) => {
    const hash = mix32(safe * 31 + index * 977 + seed); const width = 14 + hash % 23; const height = 16 + (hash >>> 8) % 58;
    return { x: (index * 43 + (hash >>> 16) % 18) % 660 - 10, width, height, color: hslToRgb((190 + (hash >>> 24) % 100) % 360, 0.7, 0.24) };
  });
  return { top, bottom, sun, city };
}

export function advanceRacer(speed: number, throttle: number, brake: boolean, gear: number, dt: number) {
  const max = 80 + gear * 55; const acceleration = throttle * (62 - gear * 5); const drag = 9 + speed * 0.035; const next = clamp(speed + (acceleration - drag - (brake ? 95 : 0)) * dt, 0, max); return next;
}

export function shiftGear(gear: number, direction: -1 | 1) { return clamp(Math.trunc(gear + direction), 1, 5); }
export function collisionSeverity(playerLane: number, obstacleLane: number, depth: number) { if (depth < 0.82 || Math.abs(playerLane - obstacleLane) > 0.38) return 0; return clamp((depth - 0.82) / 0.18, 0, 1); }
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, value)); }
function mix32(value: number) { let hash = value | 0; hash = Math.imul(hash ^ hash >>> 16, 0x45d9f3b); hash = Math.imul(hash ^ hash >>> 16, 0x45d9f3b); return (hash ^ hash >>> 16) >>> 0; }
function hslToRgb(h: number, s: number, l: number) { const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(h / 60 % 2 - 1)); const m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255); }
