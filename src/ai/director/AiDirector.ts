import { DenseQNetwork } from '../neural/DenseQNetwork';
export type DirectorPattern = 'SPIRAL' | 'POLYGON' | 'HOMING' | 'MIXED';
export interface DirectorTelemetry { damageRate: number; accuracy: number; movementEntropy: number; nearMissRate: number; lives: number; stage: number; }
export interface DirectorDecision { density: number; speed: number; powerUpChance: number; pattern: DirectorPattern; pressure: number; }
export class AiDirector {
  private readonly network: DenseQNetwork; private lastDecisionAt = -Infinity; private decision: DirectorDecision = { density: .3, speed: .35, powerUpChance: .1, pattern: 'SPIRAL', pressure: .5 };
  constructor(random: () => number = Math.random) { this.network = new DenseQNetwork(6, 16, 4, random); }
  update(nowMs: number, telemetry: DirectorTelemetry) { if (nowMs - this.lastDecisionAt < 750) return this.decision; this.lastDecisionAt = nowMs; const input = normalize(telemetry); const output = this.network.forward(input).output; const stress = clamp(telemetry.damageRate * .35 + telemetry.nearMissRate * .25 + telemetry.accuracy * .2 + telemetry.movementEntropy * .2, 0, 1); const relief = clamp((stress - .55) * .45, -.2, .2); const patternIndex = maxIndex(output); this.decision = { density: clamp(sigmoid(output[0]) - relief + telemetry.stage * .005, .15, 1), speed: clamp(sigmoid(output[1]) - relief, .2, 1), powerUpChance: clamp(.08 + Math.max(0, stress - .55) * .32 + (telemetry.lives <= 1 ? .12 : 0), .03, .35), pattern: (['SPIRAL', 'POLYGON', 'HOMING', 'MIXED'] as DirectorPattern[])[patternIndex], pressure: stress }; const target = [stress < .45 ? .75 : .35, stress < .45 ? .7 : .4, stress > .7 ? .9 : .25, .5]; this.network.train(input, target, .003); return this.decision; }
}
function normalize(t: DirectorTelemetry) { return [clamp(t.damageRate, 0, 1), clamp(t.accuracy, 0, 1), clamp(t.movementEntropy, 0, 1), clamp(t.nearMissRate, 0, 1), clamp(t.lives / 5, 0, 1), clamp(t.stage / 100, 0, 1)]; }
function maxIndex(values: Float32Array) { let best = 0; for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i; return best; }
function sigmoid(value: number) { return 1 / (1 + Math.exp(-value)); }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0)); }
