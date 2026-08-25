export const MOTION_FEATURES = 8;
export const MOTION_JOINTS = 12;

export interface MotionQuery {
  velocityX: number; velocityZ: number; turn: number; slopeX: number; slopeZ: number; intentX: number; intentZ: number; phase: number;
}

export class MotionDatabase {
  readonly features: Float32Array;
  readonly poses: Float32Array;
  readonly count: number;
  constructor(count = 4096, seed = 0x4e45584e) {
    this.count = Math.max(64, Math.min(8192, Math.floor(count)));
    this.features = new Float32Array(this.count * MOTION_FEATURES);
    this.poses = new Float32Array(this.count * MOTION_JOINTS);
    let state = seed >>> 0;
    const random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0xffffffff; };
    for (let index = 0; index < this.count; index++) {
      const angle = random() * Math.PI * 2, speed = random() * 5, turn = random() * 2 - 1;
      const slopeX = random() * 1.2 - .6, slopeZ = random() * 1.2 - .6, phase = random();
      const offset = index * MOTION_FEATURES;
      this.features.set([Math.cos(angle) * speed, Math.sin(angle) * speed, turn, slopeX, slopeZ, Math.cos(angle), Math.sin(angle), phase], offset);
      const pose = index * MOTION_JOINTS, stride = phase * Math.PI * 2;
      for (let joint = 0; joint < MOTION_JOINTS; joint++) {
        const side = joint % 2 ? -1 : 1;
        this.poses[pose + joint] = Math.sin(stride + joint * .47) * (.12 + speed * .045) * side + slopeZ * .08 + turn * (joint < 4 ? .1 : .025);
      }
    }
  }
  feature(index: number) { return this.features.subarray(index * MOTION_FEATURES, index * MOTION_FEATURES + MOTION_FEATURES); }
  pose(index: number) { return this.poses.subarray(index * MOTION_JOINTS, index * MOTION_JOINTS + MOTION_JOINTS); }
}

export function queryVector(query: MotionQuery) {
  const values = [query.velocityX, query.velocityZ, query.turn, query.slopeX, query.slopeZ, query.intentX, query.intentZ, query.phase];
  if (values.some(value => !Number.isFinite(value))) throw new Error('Motion query contains a non-finite value');
  return Float32Array.from(values.map((value, index) => index < 2 ? clamp(value, -8, 8) : clamp(value, -1, 1)));
}
function clamp(value: number, low: number, high: number) { return Math.max(low, Math.min(high, value)); }
