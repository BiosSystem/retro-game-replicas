export interface WarpStar {
  x: number;
  y: number;
  depth: number;
}

export interface ShieldRipple {
  x: number;
  y: number;
  ageMs: number;
  durationMs: number;
  color: number;
}

export function warpStretchForSpeed(speed: number, maxSpeed = 320) {
  const normalized = Math.max(0, Math.min(1, speed / Math.max(1, maxSpeed)));
  return 1 + normalized * normalized * 8;
}

export function createWarpStars(count = 72): WarpStar[] {
  return Array.from({ length: count }, (_, index) => ({ x: (index * 83) % 640, y: (index * 47) % 480, depth: .25 + ((index * 29) % 75) / 100 }));
}

export function advanceShieldRipples(ripples: ShieldRipple[], deltaMs: number) {
  for (const ripple of ripples) ripple.ageMs += Math.max(0, deltaMs);
  return ripples.filter(ripple => ripple.ageMs < ripple.durationMs);
}
