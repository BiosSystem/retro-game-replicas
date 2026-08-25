export interface TemporalStats {
  frames: number;
  rawBytes: number;
  compressedBytes: number;
  ratio: number;
}

interface FullFrame { frame: number; full: Int32Array; indices?: never; values?: never; }
interface DeltaFrame { frame: number; indices: Uint16Array; values: Int32Array; full?: never; }
type StoredFrame = FullFrame | DeltaFrame;

export class TemporalRing {
  readonly capacity: number;
  readonly width: number;
  readonly keyframeInterval: number;
  private readonly entries: Array<StoredFrame | undefined>;
  private latest = -1;
  private count = 0;

  constructor(width: number, capacity = 1800, keyframeInterval = 60) {
    this.width = Math.max(1, Math.min(65535, Math.floor(width)));
    this.capacity = Math.max(2, Math.min(1800, Math.floor(capacity)));
    this.keyframeInterval = Math.max(1, Math.min(this.capacity, Math.floor(keyframeInterval)));
    this.entries = new Array(this.capacity);
  }

  record(frame: number, state: Int32Array) {
    if (!Number.isSafeInteger(frame) || frame < 0) throw new Error('Temporal frame must be a non-negative integer');
    if (state.length !== this.width) throw new Error(`Temporal state must contain ${this.width} values`);
    if (this.latest >= 0 && frame !== this.latest + 1) throw new Error('Temporal frames must be recorded sequentially');

    const slot = frame % this.capacity;
    const overwritten = this.entries[slot];
    if (overwritten && overwritten.frame === frame - this.capacity) this.rebaseSuccessor(overwritten.frame);

    const previous = this.decode(frame - 1);
    const forceFull = !previous || frame % this.keyframeInterval === 0;
    this.entries[slot] = forceFull ? { frame, full: state.slice() } : this.makeDelta(frame, previous, state);
    this.latest = frame;
    this.count = Math.min(this.capacity, this.count + 1);
  }

  decode(frame: number): Int32Array | undefined {
    if (!Number.isSafeInteger(frame) || frame < 0) return undefined;
    const target = this.entry(frame);
    if (!target) return undefined;
    if (target.full) return target.full.slice();

    const chain: DeltaFrame[] = [];
    let cursor: StoredFrame | undefined = target;
    while (cursor && !cursor.full) {
      chain.push(cursor);
      cursor = this.entry(cursor.frame - 1);
      if (chain.length > this.keyframeInterval) return undefined;
    }
    if (!cursor?.full) return undefined;
    const output = cursor.full.slice();
    for (let i = chain.length - 1; i >= 0; i--) this.applyDelta(output, chain[i]);
    return output;
  }

  newestFrame() { return this.latest; }
  oldestFrame() { return this.count ? this.latest - this.count + 1 : -1; }
  has(frame: number) { return this.entry(frame) !== undefined; }
  truncate(frame: number) {
    if (!this.has(frame)) throw new Error('Cannot branch outside temporal history');
    const oldest = this.oldestFrame();
    for (const entry of this.entries) if (entry && entry.frame > frame) this.entries[entry.frame % this.capacity] = undefined;
    this.latest = frame;
    this.count = frame - oldest + 1;
  }

  stats(): TemporalStats {
    let compressedBytes = 0;
    for (const entry of this.entries) {
      if (!entry) continue;
      compressedBytes += entry.full ? 8 + entry.full.byteLength : 8 + entry.indices.byteLength + entry.values.byteLength;
    }
    const rawBytes = this.count * this.width * Int32Array.BYTES_PER_ELEMENT;
    return { frames: this.count, rawBytes, compressedBytes, ratio: compressedBytes ? rawBytes / compressedBytes : 0 };
  }

  private entry(frame: number) {
    const value = this.entries[frame % this.capacity];
    return value?.frame === frame ? value : undefined;
  }

  private makeDelta(frame: number, previous: Int32Array, state: Int32Array): DeltaFrame {
    let changed = 0;
    for (let i = 0; i < this.width; i++) if (previous[i] !== state[i]) changed++;
    const indices = new Uint16Array(changed);
    const values = new Int32Array(changed);
    for (let i = 0, cursor = 0; i < this.width; i++) {
      if (previous[i] === state[i]) continue;
      indices[cursor] = i;
      values[cursor++] = state[i];
    }
    return { frame, indices, values };
  }

  private applyDelta(state: Int32Array, delta: DeltaFrame) {
    for (let i = 0; i < delta.indices.length; i++) state[delta.indices[i]] = delta.values[i];
  }

  private rebaseSuccessor(frame: number) {
    const successor = this.entry(frame + 1);
    if (!successor || successor.full) return;
    const full = this.decode(frame + 1);
    if (full) this.entries[(frame + 1) % this.capacity] = { frame: frame + 1, full };
  }
}

export function runTemporalStress(frames = 10000, width = 8) {
  const count = Math.max(1, Math.min(100000, Math.floor(frames)));
  const size = Math.max(1, Math.min(64, Math.floor(width)));
  const previous = new Int32Array(size), current = new Int32Array(size), resimulated = new Int32Array(size);
  let compressedBytes = 0, checksum = 0;
  const started = performance.now();
  for (let frame = 0; frame < count; frame++) {
    current[frame % size] = frame;
    for (let index = 0; index < size; index++) if (current[index] !== previous[index]) { compressedBytes += 6; resimulated[index] = current[index]; previous[index] = current[index]; }
    checksum = (checksum + resimulated[frame % size]) | 0;
  }
  return { frames: count, compressedBytes, checksum, durationMs: performance.now() - started };
}
