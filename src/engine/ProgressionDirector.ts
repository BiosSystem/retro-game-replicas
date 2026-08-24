import { arcadeModRuntime } from '../mods/ModRuntime';
import { playModAudioEvent } from '../audio/patches/ModAudioBridge';

export type EnemyBehavior = 'PATROL' | 'CHASE' | 'BARRAGE';

export interface ProgressionSnapshot {
  stage: number;
  multiplier: number;
  score: number;
  nextPowerUpAt: number;
}

export class ProgressionDirector {
  private stage = 1;
  private multiplier = 1;
  private score = 0;
  private comboExpiresAt = 0;
  private nextPowerUpAt = 500;

  addScore(base: number, nowMs: number) {
    if (nowMs <= this.comboExpiresAt) this.multiplier = Math.min(8, this.multiplier + 1);
    else this.multiplier = 1;
    this.comboExpiresAt = nowMs + 1800;
    const modScale = arcadeModRuntime.dispatch({ event: 'SCORE_UPDATE', stage: this.stage, score: this.score }).reduce((scale, dispatch) => dispatch.action.type === 'SCALE_SCORE' ? Math.min(4, scale * dispatch.action.factor) : scale, 1);
    const awarded = Math.max(0, Math.round(base * this.multiplier * modScale));
    this.score += awarded;
    return awarded;
  }

  advanceStage() {
    this.stage += 1;
    this.multiplier = Math.max(1, Math.min(8, this.multiplier + 1));
    playModAudioEvent('STAGE_CLEAR', this.stage);
    return this.stage;
  }

  consumePowerUp() {
    if (this.score < this.nextPowerUpAt) return false;
    while (this.nextPowerUpAt <= this.score) this.nextPowerUpAt += 500 + this.stage * 100;
    return true;
  }

  chooseBehavior(distanceToPlayer: number): EnemyBehavior {
    if (this.stage >= 4 && distanceToPlayer < 240) return 'BARRAGE';
    if (this.stage >= 2 && distanceToPlayer < 360) return 'CHASE';
    return 'PATROL';
  }

  snapshot(): ProgressionSnapshot {
    return { stage: this.stage, multiplier: this.multiplier, score: this.score, nextPowerUpAt: this.nextPowerUpAt };
  }
}
