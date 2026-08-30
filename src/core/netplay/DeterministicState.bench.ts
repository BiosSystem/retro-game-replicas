import { bench, describe } from 'vitest';
import { createNeonVectorRollbackState, neonVectorStateCodec } from './ArcadeStateCodecs';
import { StateSnapshot } from './DeterministicState';

describe('deterministic snapshot budget', () => {
  const state = createNeonVectorRollbackState();
  const snapshot = new StateSnapshot(neonVectorStateCodec.byteLength);
  state.bulletActive.fill(1); state.bullets.fill(12.5);
  bench('serialize a fixed Neon Vector rollback state', () => { neonVectorStateCodec.saveState(state, snapshot); });
});
