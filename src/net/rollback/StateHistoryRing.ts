export class StateHistoryRing<State> {
  readonly capacity: number; private readonly frames: Int32Array; private readonly states: Array<State | undefined>; private readonly clone: (state: State) => State;
  constructor(capacity: number, clone: (state: State) => State) { this.capacity = Math.max(2, Math.min(600, Math.floor(capacity))); this.frames = new Int32Array(this.capacity); this.frames.fill(-1); this.states = new Array(this.capacity); this.clone = clone; }
  set(frame: number, state: State) { const slot = modulo(frame, this.capacity); this.frames[slot] = frame; this.states[slot] = this.clone(state); }
  get(frame: number) { const slot = modulo(frame, this.capacity); const state = this.frames[slot] === frame ? this.states[slot] : undefined; return state === undefined ? undefined : this.clone(state); }
  has(frame: number) { return this.frames[modulo(frame, this.capacity)] === frame; }
}
function modulo(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }
