export const CHRONO_SCALE = 1000;
export interface ChronoState { x: number; y: number; vx: number; vy: number; chamber: number; gateOpen: boolean; gravity: 1 | -1; score: number; }
export interface ChronoChamber { index: number; seed: number; platforms: Array<{ x: number; y: number; width: number }>; lasers: Array<{ x: number; y: number; height: number }>; slowField: { x: number; radius: number }; gravityZone: { x: number; width: number }; switchX: number; gateX: number; }

export function generateChronoChamber(index: number, seed = 0x4348524f): ChronoChamber {
  let state = seed ^ Math.imul(index + 1, 0x9e3779b1);
  const next = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0; };
  const platforms = Array.from({ length: 3 + index % 3 }, (_, i) => ({ x: 100 + i * 110 + next() % 35, y: 360 - next() % 180, width: 55 + next() % 50 }));
  const lasers = Array.from({ length: 1 + Math.min(4, Math.floor(index / 2)) }, (_, i) => ({ x: 170 + i * 90 + next() % 30, y: 200 + next() % 180, height: 55 + next() % 100 }));
  return { index, seed, platforms, lasers, slowField: { x: 170 + next() % 280, radius: 55 + next() % 45 }, gravityZone: { x: 260 + next() % 170, width: 70 + next() % 60 }, switchX: 90 + next() % 180, gateX: 500 + next() % 70 };
}

export function initialChronoState(): ChronoState { return { x: 45, y: 410, vx: 0, vy: 0, chamber: 0, gateOpen: false, gravity: 1, score: 0 }; }

export function stepChrono(source: ChronoState, mask: number, chamber: ChronoChamber, dt: number, timeScale = 1): ChronoState {
  const state = { ...source };
  const seconds = Math.max(0, Math.min(0.05, dt)) * Math.max(0.15, Math.min(1, timeScale));
  const horizontal = Number(Boolean(mask & 8)) - Number(Boolean(mask & 4));
  state.vx += (horizontal * 620 - state.vx * 8) * seconds;
  const grounded = state.gravity > 0 ? state.y >= 410 : state.y <= 70;
  if (mask & 16 && grounded) state.vy = -state.gravity * 275;
  const inGravityZone = state.x >= chamber.gravityZone.x && state.x <= chamber.gravityZone.x + chamber.gravityZone.width;
  state.gravity = inGravityZone ? -1 : 1;
  state.vy += state.gravity * 680 * seconds;
  state.x += state.vx * seconds;
  state.y += state.vy * seconds;
  if (state.gravity > 0 && state.y > 410) { state.y = 410; state.vy = 0; }
  if (state.gravity < 0 && state.y < 70) { state.y = 70; state.vy = 0; }
  state.x = Math.max(12, Math.min(state.gateOpen ? 635 : chamber.gateX - 12, state.x));
  return state;
}

export function packChronoState(state: ChronoState) { return Int32Array.of(Math.round(state.x * CHRONO_SCALE), Math.round(state.y * CHRONO_SCALE), Math.round(state.vx * CHRONO_SCALE), Math.round(state.vy * CHRONO_SCALE), state.chamber, Number(state.gateOpen), state.gravity, state.score); }
export function unpackChronoState(values: Int32Array): ChronoState { return { x: values[0] / CHRONO_SCALE, y: values[1] / CHRONO_SCALE, vx: values[2] / CHRONO_SCALE, vy: values[3] / CHRONO_SCALE, chamber: values[4], gateOpen: Boolean(values[5]), gravity: values[6] < 0 ? -1 : 1, score: values[7] }; }
export function temporalPitch(timeScale: number, rewinding: boolean) { return Math.max(55, 440 * Math.max(0.125, Math.min(1, timeScale)) * (rewinding ? 0.5 : 1)); }
