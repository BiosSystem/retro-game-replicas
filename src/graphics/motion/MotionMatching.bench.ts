import { bench, describe } from 'vitest';
import { MotionDatabase } from './MotionDatabase';
import { NeuralMotionMatcher } from './NeuralMotionMatcher';
const matcher = new NeuralMotionMatcher(new MotionDatabase(4096));
describe('motion matching', () => { bench('match 4,096 generated locomotion vectors', () => { matcher.match({ velocityX: 3, velocityZ: 1, turn: .2, slopeX: .1, slopeZ: .2, intentX: 1, intentZ: 0, phase: .5 }); }); });
