import type { NetInputFrame } from './InputCodec';

export interface RollbackAdapter<State> { clone(state: State): State; step(state: State, local: NetInputFrame, remote: NetInputFrame): State; checksum(state: State): number; }

export class RollbackSession<State> {
  private readonly history = new Map<number, State>(); private readonly local = new Map<number, NetInputFrame>(); private readonly remote = new Map<number, NetInputFrame>();
  private predictedRemote: NetInputFrame = { frame: 0, buttons: 0, axisX: 0, axisY: 0, checksum: 0 }; private currentFrame = 0; private rollbacks = 0; private state: State; private readonly adapter: RollbackAdapter<State>; private readonly maxHistory: number;
  constructor(state: State, adapter: RollbackAdapter<State>, maxHistory = 120) { this.state = state; this.adapter = adapter; this.maxHistory = maxHistory; this.history.set(0, adapter.clone(state)); }

  advance(local: NetInputFrame) {
    if (local.frame !== this.currentFrame + 1) throw new Error('Local frames must advance sequentially');
    this.local.set(local.frame, local); const remote = this.remote.get(local.frame) ?? { ...this.predictedRemote, frame: local.frame };
    if (this.remote.has(local.frame)) this.predictedRemote = remote;
    this.state = this.adapter.step(this.state, local, remote); this.currentFrame = local.frame; this.history.set(this.currentFrame, this.adapter.clone(this.state)); this.prune(); return this.adapter.clone(this.state);
  }

  receiveRemote(input: NetInputFrame) {
    if (input.frame < Math.max(1, this.currentFrame - this.maxHistory)) return false;
    const previous = this.remote.get(input.frame); this.remote.set(input.frame, input);
    if (input.frame > this.currentFrame || sameInput(previous, input)) return false;
    const before = this.history.get(input.frame - 1); if (!before) return false;
    this.state = this.adapter.clone(before); let predicted = this.remote.get(input.frame - 1) ?? this.predictedRemote;
    for (let frame = input.frame; frame <= this.currentFrame; frame++) { const local = this.local.get(frame); if (!local) break; const remote = this.remote.get(frame) ?? { ...predicted, frame }; if (this.remote.has(frame)) predicted = remote; this.state = this.adapter.step(this.state, local, remote); this.history.set(frame, this.adapter.clone(this.state)); }
    this.predictedRemote = predicted; this.rollbacks++; return true;
  }

  snapshot() { return { frame: this.currentFrame, state: this.adapter.clone(this.state), checksum: this.adapter.checksum(this.state), rollbacks: this.rollbacks }; }
  private prune() { const cutoff = this.currentFrame - this.maxHistory; for (const map of [this.history, this.local, this.remote]) for (const key of map.keys()) if (key < cutoff) map.delete(key); }
}

function sameInput(a: NetInputFrame | undefined, b: NetInputFrame) { return Boolean(a && a.buttons === b.buttons && a.axisX === b.axisX && a.axisY === b.axisY && a.checksum === b.checksum); }
