import { describe, expect, it } from 'vitest';
import { createNeonVectorRollbackState, createTetrisPulseRollbackState, neonVectorStateCodec, tetrisPulseStateCodec } from './ArcadeStateCodecs';
import { StateSnapshot, StateSnapshotRing } from './DeterministicState';

describe('deterministic arcade state codecs', () => {
  it('round-trips Neon Vector state without changing its binary hash', () => {
    const source = createNeonVectorRollbackState(); source.frame = 144; source.seed = 0x4e454f4e; source.score = 12_500; source.stage = 4; source.minerals = 9; source.weapon = 2; source.shield = 1;
    source.players.set([320.5, 260.25, 42, -7, 1.2, 360, 260, 0, 0, 0]); source.bullets.set([22, 44, 120, -8]); source.bulletActive[0] = 1; source.bulletOwner[0] = 2;
    const snapshot = new StateSnapshot(neonVectorStateCodec.byteLength); neonVectorStateCodec.saveState(source, snapshot);
    const restored = createNeonVectorRollbackState(); neonVectorStateCodec.loadState(snapshot, restored);
    const replayed = new StateSnapshot(neonVectorStateCodec.byteLength); neonVectorStateCodec.saveState(restored, replayed);
    expect(neonVectorStateCodec.hashState(replayed)).toBe(neonVectorStateCodec.hashState(snapshot)); expect(restored.players).toEqual(source.players); expect(restored.bulletOwner[0]).toBe(2);
  });

  it('round-trips Tetris Pulse grids with fixed dimensions and state hashes', () => {
    const source = createTetrisPulseRollbackState(); source.frame = 60; source.seed = 12; source.score = 800; source.dropTicks = 34; source.timerTicks = 12; source.activeX = 4; source.activeY = 7; source.activeColor = 0x00ffff;
    source.activeCells.set([1, 1, 1, 1]); source.grid[13] = 0xff00aa; source.grid[199] = 0x00ffff;
    const ring = new StateSnapshotRing(tetrisPulseStateCodec); ring.record(60, source); const restored = createTetrisPulseRollbackState();
    expect(ring.restore(60, restored)).toBe(true); expect(ring.hashAt(60)).toBeDefined(); expect(restored.grid).toEqual(source.grid); expect(restored.activeCells).toEqual(source.activeCells);
  });
});
