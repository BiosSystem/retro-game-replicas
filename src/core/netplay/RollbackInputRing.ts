import { inputChecksum, type NetInputFrame } from '../../net/InputCodec';

export const MAX_ROLLBACK_INPUT_FRAMES = 12;

export interface MutableNetInputFrame extends NetInputFrame { frame: number; buttons: number; axisX: number; axisY: number; checksum: number; }

export class RollbackInputRing {
  private readonly localFrames: Int32Array;
  private readonly remoteFrames: Int32Array;
  private readonly usedFrames: Int32Array;
  private readonly local = new PackedInputStore();
  private readonly remote = new PackedInputStore();
  private readonly used = new PackedInputStore();
  readonly maxFrames: number;

  constructor(maxFrames = MAX_ROLLBACK_INPUT_FRAMES) {
    if (!Number.isInteger(maxFrames) || maxFrames < 1 || maxFrames > MAX_ROLLBACK_INPUT_FRAMES) throw new Error(`Rollback input window must be between 1 and ${MAX_ROLLBACK_INPUT_FRAMES} frames`);
    this.maxFrames = maxFrames;
    const capacity = maxFrames + 1;
    this.localFrames = new Int32Array(capacity); this.remoteFrames = new Int32Array(capacity); this.usedFrames = new Int32Array(capacity);
    this.localFrames.fill(-1); this.remoteFrames.fill(-1); this.usedFrames.fill(-1);
    this.local.allocate(capacity); this.remote.allocate(capacity); this.used.allocate(capacity);
  }

  storeLocal(input: NetInputFrame): void { this.store(this.localFrames, this.local, input); }
  storeRemote(input: NetInputFrame): void { this.store(this.remoteFrames, this.remote, input); }
  storeUsedRemote(input: NetInputFrame): void { this.store(this.usedFrames, this.used, input); }
  loadLocal(frame: number, destination: MutableNetInputFrame): boolean { return this.load(this.localFrames, this.local, frame, destination); }
  loadRemote(frame: number, destination: MutableNetInputFrame): boolean { return this.load(this.remoteFrames, this.remote, frame, destination); }
  loadUsedRemote(frame: number, destination: MutableNetInputFrame): boolean { return this.load(this.usedFrames, this.used, frame, destination); }

  predictRemote(frame: number, destination: MutableNetInputFrame): void {
    for (let previous = frame - 1; previous >= Math.max(0, frame - this.maxFrames); previous--) if (this.loadRemote(previous, destination)) { setFrame(destination, frame); return; }
    setInput(destination, frame, 0, 0, 0);
  }

  static valid(input: NetInputFrame): boolean {
    return Number.isInteger(input.frame) && input.frame >= 0 && input.frame <= 0x7fffffff && Number.isInteger(input.buttons) && input.buttons >= 0 && input.buttons <= 0xffff && Number.isInteger(input.axisX) && input.axisX >= -127 && input.axisX <= 127 && Number.isInteger(input.axisY) && input.axisY >= -127 && input.axisY <= 127 && input.checksum === inputChecksum(input.frame, input.buttons, input.axisX, input.axisY);
  }

  private store(frames: Int32Array, store: PackedInputStore, input: NetInputFrame): void {
    if (!RollbackInputRing.valid(input)) throw new Error('Rollback input checksum or bounds are invalid');
    const slot = modulo(input.frame, frames.length); frames[slot] = input.frame; store.set(slot, input);
  }
  private load(frames: Int32Array, store: PackedInputStore, frame: number, destination: MutableNetInputFrame): boolean {
    const slot = modulo(frame, frames.length); if (frames[slot] !== frame) return false; destination.frame = frame; store.get(slot, destination); return true;
  }
}

export function inputsEqual(a: NetInputFrame, b: NetInputFrame): boolean { return a.buttons === b.buttons && a.axisX === b.axisX && a.axisY === b.axisY; }
export function createMutableInput(): MutableNetInputFrame { return { frame: 0, buttons: 0, axisX: 0, axisY: 0, checksum: inputChecksum(0, 0, 0, 0) }; }

class PackedInputStore {
  private buttons = new Uint16Array(0); private axisX = new Int8Array(0); private axisY = new Int8Array(0); private checksums = new Uint32Array(0);
  allocate(capacity: number): void { this.buttons = new Uint16Array(capacity); this.axisX = new Int8Array(capacity); this.axisY = new Int8Array(capacity); this.checksums = new Uint32Array(capacity); }
  set(slot: number, input: NetInputFrame): void { this.buttons[slot] = input.buttons; this.axisX[slot] = input.axisX; this.axisY[slot] = input.axisY; this.checksums[slot] = input.checksum; }
  get(slot: number, destination: MutableNetInputFrame): void { destination.buttons = this.buttons[slot]; destination.axisX = this.axisX[slot]; destination.axisY = this.axisY[slot]; destination.checksum = this.checksums[slot]; }
}

function setFrame(input: MutableNetInputFrame, frame: number): void { input.frame = frame; input.checksum = inputChecksum(frame, input.buttons, input.axisX, input.axisY); }
function setInput(input: MutableNetInputFrame, frame: number, buttons: number, axisX: number, axisY: number): void { input.frame = frame; input.buttons = buttons; input.axisX = axisX; input.axisY = axisY; input.checksum = inputChecksum(frame, buttons, axisX, axisY); }
function modulo(value: number, divisor: number): number { return ((value % divisor) + divisor) % divisor; }
