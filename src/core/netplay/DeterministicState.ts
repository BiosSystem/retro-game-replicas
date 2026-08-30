/** Fixed-capacity binary state contracts for rollback-safe arcade simulations. */
export interface DeterministicStateCodec<State> {
  readonly id: string;
  readonly byteLength: number;
  saveState(state: State, destination: StateSnapshot): void;
  loadState(source: StateSnapshot, destination: State): void;
  hashState(source: StateSnapshot): number;
}

export class StateSnapshot {
  readonly bytes: Uint8Array;
  readonly view: DataView;

  constructor(byteLength: number) {
    if (!Number.isInteger(byteLength) || byteLength < 1 || byteLength > 65_536) throw new Error('Snapshot size must be between 1 and 65,536 bytes');
    this.bytes = new Uint8Array(byteLength);
    this.view = new DataView(this.bytes.buffer);
  }
}

export class StateSnapshotRing<State> {
  private readonly frames: Int32Array;
  private readonly snapshots: StateSnapshot[];
  readonly codec: DeterministicStateCodec<State>;

  constructor(codec: DeterministicStateCodec<State>, capacity = 13) {
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 64) throw new Error('Snapshot ring capacity must be between 2 and 64');
    this.codec = codec;
    this.frames = new Int32Array(capacity);
    this.frames.fill(-1);
    this.snapshots = Array.from({ length: capacity }, () => new StateSnapshot(codec.byteLength));
  }

  record(frame: number, state: State): void {
    validateFrame(frame);
    const slot = modulo(frame, this.snapshots.length);
    this.codec.saveState(state, this.snapshots[slot]);
    this.frames[slot] = frame;
  }

  restore(frame: number, state: State): boolean {
    const snapshot = this.get(frame);
    if (!snapshot) return false;
    this.codec.loadState(snapshot, state);
    return true;
  }

  hashAt(frame: number): number | undefined {
    const snapshot = this.get(frame);
    return snapshot ? this.codec.hashState(snapshot) : undefined;
  }

  get(frame: number): StateSnapshot | undefined {
    const slot = modulo(frame, this.snapshots.length);
    return this.frames[slot] === frame ? this.snapshots[slot] : undefined;
  }
}

export function hashSnapshot(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < bytes.length; index++) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function validateFrame(frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame > 0x7fffffff) throw new Error('Snapshot frame must be a non-negative 31-bit integer');
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
