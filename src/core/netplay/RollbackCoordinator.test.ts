import { describe, expect, it } from 'vitest';
import { inputChecksum, type NetInputFrame } from '../../net/InputCodec';
import type { DeterministicStateCodec } from './DeterministicState';
import { RollbackCoordinator, type RollbackSimulation } from './RollbackCoordinator';
import { RollbackInputRing } from './RollbackInputRing';

interface CounterState { frame: number; value: number; }
const codec: DeterministicStateCodec<CounterState> = {
  id: 'counter', byteLength: 8,
  saveState: (state, destination) => { destination.view.setInt32(0, state.frame, true); destination.view.setInt32(4, state.value, true); },
  loadState: (source, state) => { state.frame = source.view.getInt32(0, true); state.value = source.view.getInt32(4, true); },
  hashState: snapshot => snapshot.view.getUint32(4, true),
};
const simulation: RollbackSimulation<CounterState> = { step: (state, local, remote) => { state.frame = local.frame; state.value += local.axisX + remote.axisX; } };
const input = (frame: number, axisX: number): NetInputFrame => ({ frame, buttons: 0, axisX, axisY: 0, checksum: inputChecksum(frame, 0, axisX, 0) });

describe('fixed rollback coordinator', () => {
  it('restores a prior binary snapshot and converges after four late remote frames', () => {
    const predicted = { frame: 0, value: 0 }; const reference = { frame: 0, value: 0 };
    const late = new RollbackCoordinator(predicted, codec, simulation); const exact = new RollbackCoordinator(reference, codec, simulation);
    for (let frame = 1; frame <= 4; frame++) { late.advance(input(frame, 1)); exact.receiveRemote(input(frame, 2)); exact.advance(input(frame, 1)); }
    for (let frame = 1; frame <= 4; frame++) late.receiveRemote(input(frame, 2));
    expect(late.stateHash()).toBe(exact.stateHash()); expect(late.snapshotMetrics()).toMatchObject({ rollbacks: 1, maxResimulationFrames: 4 });
  });

  it('uses a bounded twelve-frame typed input ring and rejects corrupt frames', () => {
    const ring = new RollbackInputRing(); ring.storeLocal(input(12, -127)); expect(RollbackInputRing.valid({ ...input(1, 0), checksum: 0 })).toBe(false);
    expect(() => ring.storeRemote({ ...input(1, 0), checksum: 0 })).toThrow('checksum');
  });
});
