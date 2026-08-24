import type { PlayerId } from './MultiInput';

export type ArcadeMode = 'SOLO' | 'COOP' | 'VERSUS';

export class CoopSession {
  private readonly mode: ArcadeMode;
  private scores: Record<PlayerId, number> = { 1: 0, 2: 0 };
  private lives: Record<PlayerId, number> = { 1: 3, 2: 3 };
  private multiplier = 1;
  private lastScorer: PlayerId | 0 = 0;
  private comboUntil = 0;

  constructor(mode: ArcadeMode) { this.mode = mode; }

  score(player: PlayerId, base: number, now: number) {
    if (this.mode === 'COOP' && this.lastScorer !== 0 && this.lastScorer !== player && now <= this.comboUntil) this.multiplier = Math.min(6, this.multiplier + 1);
    else if (now > this.comboUntil) this.multiplier = 1;
    const value = Math.max(0, Math.round(base * this.multiplier));
    this.scores[player] += value; this.lastScorer = player; this.comboUntil = now + 1600;
    return value;
  }

  loseLife(player: PlayerId) { this.lives[player] = Math.max(0, this.lives[player] - 1); return this.lives[player]; }
  totalScore() { return this.scores[1] + this.scores[2]; }
  snapshot() { return { mode: this.mode, scores: { ...this.scores }, lives: { ...this.lives }, multiplier: this.multiplier }; }
}
