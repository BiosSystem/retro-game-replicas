export type CabinetDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';

export interface WaveSpec {
  count: number;
  speed: number;
  intervalMs: number;
  integrity: number;
}

const DIFFICULTY_SCALE: Record<CabinetDifficulty, number> = { EASY: 0.78, NORMAL: 1, HARD: 1.24, EXPERT: 1.52 };

export function relayWave(stage: number, difficulty: CabinetDifficulty): WaveSpec {
  const scale = DIFFICULTY_SCALE[difficulty];
  return { count: Math.min(34, 6 + stage * 2), speed: (42 + stage * 7) * scale, intervalMs: Math.max(175, 720 - stage * 32), integrity: Math.max(1, 6 - Math.floor(stage / 5)) };
}

export function spiralWave(stage: number, difficulty: CabinetDifficulty): WaveSpec {
  const scale = DIFFICULTY_SCALE[difficulty];
  return { count: Math.min(42, 7 + stage * 3), speed: (28 + stage * 5) * scale, intervalMs: Math.max(125, 620 - stage * 28), integrity: Math.max(1, 5 - Math.floor(stage / 6)) };
}

export function deterministicLane(stage: number, ordinal: number, laneCount = 5) {
  const mixed = Math.imul(stage + 0x9e3779b9, ordinal + 0x85ebca6b) >>> 0;
  return mixed % Math.max(1, laneCount);
}

export function deterministicAngle(stage: number, ordinal: number) {
  const mixed = Math.imul(stage + 0x27d4eb2d, ordinal + 0x165667b1) >>> 0;
  return (mixed % 3600) / 3600 * Math.PI * 2;
}

export function shortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function isNear(firstX: number, firstY: number, secondX: number, secondY: number, radius: number) {
  const dx = firstX - secondX;
  const dy = firstY - secondY;
  return dx * dx + dy * dy <= radius * radius;
}
