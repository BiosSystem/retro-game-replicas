import type { NetInputFrame } from '../../net/InputCodec';
import { StateSnapshotRing, type DeterministicStateCodec } from './DeterministicState';
import { createMutableInput, inputsEqual, MAX_ROLLBACK_INPUT_FRAMES, RollbackInputRing, type MutableNetInputFrame } from './RollbackInputRing';

export interface RollbackSimulation<State> { step(state: State, local: Readonly<NetInputFrame>, remote: Readonly<NetInputFrame>): void; }
export interface RollbackMetrics { rollbacks: number; resimulatedFrames: number; maxResimulationFrames: number; lastResimulationMs: number; }

export class RollbackCoordinator<State> {
  private readonly snapshots: StateSnapshotRing<State>;
  private readonly inputs: RollbackInputRing;
  private readonly local = createMutableInput();
  private readonly remote = createMutableInput();
  private readonly usedRemote = createMutableInput();
  private frame = 0;
  private metrics: RollbackMetrics = { rollbacks: 0, resimulatedFrames: 0, maxResimulationFrames: 0, lastResimulationMs: 0 };
  private readonly state: State;
  private readonly simulation: RollbackSimulation<State>;

  constructor(state: State, codec: DeterministicStateCodec<State>, simulation: RollbackSimulation<State>, maxRollbackFrames = MAX_ROLLBACK_INPUT_FRAMES) {
    this.state = state;
    this.simulation = simulation;
    this.inputs = new RollbackInputRing(maxRollbackFrames);
    this.snapshots = new StateSnapshotRing(codec, maxRollbackFrames + 1);
    this.snapshots.record(0, state);
  }

  advance(local: NetInputFrame): void {
    if (!RollbackInputRing.valid(local) || local.frame !== this.frame + 1) throw new Error('Local rollback inputs must be valid and sequential');
    this.inputs.storeLocal(local);
    this.resolveRemote(local.frame, this.remote);
    this.inputs.storeUsedRemote(this.remote);
    this.simulation.step(this.state, local, this.remote);
    this.frame = local.frame;
    this.snapshots.record(this.frame, this.state);
  }

  receiveRemote(remote: NetInputFrame): boolean {
    if (!RollbackInputRing.valid(remote)) throw new Error('Remote rollback input checksum or bounds are invalid');
    if (remote.frame < Math.max(1, this.frame - this.inputs.maxFrames) || remote.frame > this.frame + this.inputs.maxFrames) return false;
    this.inputs.storeRemote(remote);
    if (remote.frame > this.frame || !this.inputs.loadUsedRemote(remote.frame, this.usedRemote) || inputsEqual(remote, this.usedRemote)) return false;
    if (!this.snapshots.restore(remote.frame - 1, this.state)) return false;
    const started = performance.now(); let count = 0;
    for (let frame = remote.frame; frame <= this.frame; frame++) {
      if (!this.inputs.loadLocal(frame, this.local)) throw new Error('Rollback local input history is incomplete');
      this.resolveRemote(frame, this.remote); this.inputs.storeUsedRemote(this.remote);
      this.simulation.step(this.state, this.local, this.remote); this.snapshots.record(frame, this.state); count++;
    }
    this.metrics.rollbacks++; this.metrics.resimulatedFrames += count; this.metrics.maxResimulationFrames = Math.max(this.metrics.maxResimulationFrames, count); this.metrics.lastResimulationMs = performance.now() - started;
    return true;
  }

  currentFrame(): number { return this.frame; }
  stateHash(): number { return this.snapshots.hashAt(this.frame) ?? 0; }
  snapshotMetrics(): RollbackMetrics { return { ...this.metrics }; }

  private resolveRemote(frame: number, destination: MutableNetInputFrame): void { if (!this.inputs.loadRemote(frame, destination)) this.inputs.predictRemote(frame, destination); }
}
