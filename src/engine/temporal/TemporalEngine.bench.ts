import { bench, describe } from 'vitest';
import { runTemporalStress, TemporalRing } from './TemporalRing';

describe('temporal compression', () => {
  bench('run 10,000 allocation-free delta compressions and resimulations', () => { runTemporalStress(); });
  bench('compress and resimulate 10,000 compact states', () => {
    const ring = new TemporalRing(8);
    const state = new Int32Array(8);
    for (let frame = 0; frame < 10000; frame++) { state[frame & 7] = frame; ring.record(frame, state); ring.decode(frame); }
  });
});
