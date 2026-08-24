export type BrickKind = 'NORMAL' | 'WALL' | 'BOSS';
export type BreakoutPowerUp = 'LASER' | 'MULTI' | 'STICKY' | 'SLOW';
export interface BrickSpec { column: number; row: number; hp: number; kind: BrickKind; color: number; drop?: BreakoutPowerUp; }
export interface ReflectionInput { ballX: number; paddleX: number; paddleWidth: number; paddleVelocity: number; speed: number; }

export function reflectFromPaddle(input: ReflectionInput) {
  const hit = clamp((input.ballX - input.paddleX) / Math.max(1, input.paddleWidth / 2), -1, 1);
  const spin = clamp(input.paddleVelocity / 500, -1, 1) * 0.32;
  const horizontal = clamp(hit * 0.82 + spin, -0.92, 0.92);
  const vertical = -Math.sqrt(Math.max(0.1536, 1 - horizontal * horizontal));
  return { vx: horizontal * input.speed, vy: vertical * input.speed, hit, spin };
}

export function generateBrickField(stage: number, campaignSeed = 0x42524b) {
  const safeStage = Math.max(1, Math.floor(stage)); const random = seeded(campaignSeed ^ Math.imul(safeStage, 0x9e3779b1));
  const rows = Math.min(9, 5 + Math.floor(safeStage / 3)); const columns = 9; const palette = generatePalette(safeStage);
  const bricks: BrickSpec[] = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const wall = safeStage >= 4 && (column + row * 3 + safeStage) % 13 === 0;
    const boss = safeStage % 5 === 0 && row === 0 && column === Math.floor(columns / 2);
    const hp = boss ? Math.min(12, 6 + safeStage) : wall ? 999 : Math.min(3, 1 + Math.floor((safeStage + row) / 5));
    const drops: BreakoutPowerUp[] = ['LASER', 'MULTI', 'STICKY', 'SLOW']; const drop = !wall && !boss && random() < Math.min(0.22, 0.08 + safeStage * 0.008) ? drops[Math.floor(random() * drops.length)] : undefined;
    bricks.push({ column, row, hp, kind: boss ? 'BOSS' : wall ? 'WALL' : 'NORMAL', color: boss ? 0xffffff : wall ? 0x334455 : palette[row % palette.length], ...(drop ? { drop } : {}) });
  }
  return { stage: safeStage, rows, columns, bricks, palette };
}

export function generatePalette(stage: number) {
  const base = (stage * 47) % 360; return [0, 42, 84, 126, 168].map(offset => hslToRgb((base + offset) % 360, 0.9, 0.58));
}

function seeded(seed: number) { let state = seed | 0 || 1; return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; }
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, value)); }
function hslToRgb(h: number, s: number, l: number) { const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(h / 60 % 2 - 1)); const m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255); }
