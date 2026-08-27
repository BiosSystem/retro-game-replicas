import { MOTION_FEATURES, MOTION_JOINTS, MotionDatabase, queryVector, type MotionQuery } from './MotionDatabase';

export interface MotionMatch { index: number; score: number; pose: Float32Array; }

export class NeuralMotionMatcher {
  readonly database: MotionDatabase;
  private readonly projection = new Float32Array(6 * MOTION_FEATURES);
  private readonly embeddings: Float32Array;
  private blended = new Float32Array(MOTION_JOINTS);
  constructor(database: MotionDatabase, seed = 0x4d4f544e) {
    this.database = database;
    let state = seed >>> 0;
    for (let i = 0; i < this.projection.length; i++) { state = Math.imul(state ^ (state >>> 15), 2246822519); this.projection[i] = ((state >>> 0) / 0xffffffff - .5) * .9; }
    this.embeddings = new Float32Array(database.count * 6);
    for (let index = 0; index < database.count; index++) this.project(database.feature(index), this.embeddings, index * 6);
  }
  match(query: MotionQuery, deltaSeconds = 1 / 60): MotionMatch {
    const vector = queryVector(query), embedded = new Float32Array(6); this.project(vector, embedded, 0);
    const candidates: Array<{ index: number; distance: number }> = [];
    for (let index = 0; index < this.database.count; index++) {
      let distance = 0; const offset = index * 6;
      for (let axis = 0; axis < 6; axis++) { const difference = embedded[axis] - this.embeddings[offset + axis]; distance += difference * difference; }
      if (candidates.length < 16) candidates.push({ index, distance });
      else { let worst = 0; for (let i = 1; i < 16; i++) if (candidates[i].distance > candidates[worst].distance) worst = i; if (distance < candidates[worst].distance) candidates[worst] = { index, distance }; }
    }
    let best = candidates[0]?.index ?? 0, score = Infinity;
    for (const candidate of candidates) { let exact = 0; const feature = this.database.feature(candidate.index); for (let axis = 0; axis < MOTION_FEATURES; axis++) { const difference = vector[axis] - feature[axis]; const weight = axis < 2 ? 1.5 : axis < 5 ? 1.1 : .8; exact += difference * difference * weight; } if (exact < score || exact === score && candidate.index < best) { score = exact; best = candidate.index; } }
    const target = this.database.pose(best), blend = 1 - Math.exp(-12 * Math.max(0, Math.min(.1, deltaSeconds)));
    for (let joint = 0; joint < MOTION_JOINTS; joint++) this.blended[joint] += (target[joint] - this.blended[joint]) * blend;
    return { index: best, score, pose: this.blended.slice() };
  }
  reset() { this.blended.fill(0); }
  private project(input: ArrayLike<number>, output: Float32Array, offset: number) { for (let row = 0; row < 6; row++) { let sum = 0; for (let column = 0; column < MOTION_FEATURES; column++) sum += input[column] * this.projection[row * MOTION_FEATURES + column]; output[offset + row] = Math.tanh(sum); } }
}
