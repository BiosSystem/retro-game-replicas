import { describe, expect, it } from 'vitest';
import { MotionDatabase } from './MotionDatabase';
import { NeuralMotionMatcher } from './NeuralMotionMatcher';

const query = { velocityX: 2, velocityZ: .5, turn: .2, slopeX: .1, slopeZ: -.1, intentX: 1, intentZ: 0, phase: .25 };
describe('procedural motion matching', () => {
  it('generates thousands of deterministic locomotion vectors', () => { const a = new MotionDatabase(4096, 7), b = new MotionDatabase(4096, 7); expect(a.count).toBe(4096); expect([...a.feature(311)]).toEqual([...b.feature(311)]); });
  it('selects deterministic terrain and intent aware poses', () => { const database = new MotionDatabase(1024, 9); const a = new NeuralMotionMatcher(database, 4).match(query), b = new NeuralMotionMatcher(database, 4).match(query); expect(a.index).toBe(b.index); expect(a.score).toBeCloseTo(b.score, 8); });
  it('blends pose transitions instead of snapping', () => { const matcher = new NeuralMotionMatcher(new MotionDatabase(256)); const first = matcher.match(query, 1 / 60), second = matcher.match({ ...query, velocityX: -4, intentX: -1 }, 1 / 60); expect(second.pose.some((value, index) => Math.abs(value - first.pose[index]) > 0)).toBe(true); expect(Math.max(...second.pose.map(Math.abs))).toBeLessThan(1); });
});
