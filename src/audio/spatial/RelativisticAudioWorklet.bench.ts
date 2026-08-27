import { bench, describe } from 'vitest';
import { PropagationDelayLine } from './RelativisticAudioWorklet';

const input = Float32Array.from({ length: 128 }, (_, index) => Math.sin(index * 0.08));
const output = new Float32Array(128);
const line = new PropagationDelayLine(48_000);

describe('spatial audio block throughput', () => {
  bench('render 128 delayed and pitch-shifted samples', () => { line.process(input, output, 4_800, 1.07); }, { time: 500 });
});
