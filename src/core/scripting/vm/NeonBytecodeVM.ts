export const NEON_OPCODE = {
  PUSH: 0x01, POP: 0x02, DUP: 0x03, SWAP: 0x04, LOAD_I32: 0x05, STORE_I32: 0x06,
  ADD: 0x10, SUB: 0x11, MUL: 0x12, DIV: 0x13, MOD: 0x14, BIT_AND: 0x15, BIT_OR: 0x16, BIT_XOR: 0x17, NOT: 0x18,
  JUMP: 0x20, JUMP_IF: 0x21, CALL: 0x22, RET: 0x23, HALT: 0x24,
  HOST_DRAW: 0x30, HOST_AUDIO: 0x31, HOST_INPUT: 0x32, HOST_TIME: 0x33,
} as const;

export type NeonOpcode = (typeof NEON_OPCODE)[keyof typeof NEON_OPCODE];

export interface NeonVmHost {
  drawVectorPath(pathId: number, x: number, y: number, scale: number, color: number): void;
  playSynthNote(channel: number, patchId: number, note: number, volume: number): void;
  readInputBitmask(playerIndex: number): number;
  readTime(): number;
}

export interface NeonVmOptions { heapBytes?: number; stackCapacity?: number; callCapacity?: number; }
export interface NeonVmStep { executed: number; halted: boolean; }
export class NeonVmError extends Error {}
export class NeonVmQuotaError extends NeonVmError {}

const MAX_HEAP_BYTES = 1024 * 1024;
const MAX_INSTRUCTIONS = 100_000;

export class NeonBytecodeVM {
  readonly heap: Uint8Array;
  readonly registers = new Int32Array(8);
  private readonly code: Uint8Array;
  private readonly view: DataView;
  private readonly stack: Int32Array;
  private readonly calls: Uint32Array;
  private stackSize = 0;
  private callSize = 0;
  private pc = 0;
  private halted = false;
  private readonly host: NeonVmHost;

  constructor(bytecode: Uint8Array, host: NeonVmHost, options: NeonVmOptions = {}) {
    const heapBytes = options.heapBytes ?? MAX_HEAP_BYTES;
    if (!Number.isInteger(heapBytes) || heapBytes < 1 || heapBytes > MAX_HEAP_BYTES) throw new NeonVmError('Invalid heap size');
    const stackCapacity = options.stackCapacity ?? 4096;
    const callCapacity = options.callCapacity ?? 256;
    if (!Number.isInteger(stackCapacity) || stackCapacity < 1 || !Number.isInteger(callCapacity) || callCapacity < 1) throw new NeonVmError('Invalid stack capacity');
    this.code = bytecode;
    this.host = host;
    this.view = new DataView(bytecode.buffer, bytecode.byteOffset, bytecode.byteLength);
    this.heap = new Uint8Array(heapBytes);
    this.stack = new Int32Array(stackCapacity);
    this.calls = new Uint32Array(callCapacity);
  }

  get programCounter() { return this.pc; }
  get isHalted() { return this.halted; }
  get depth() { return this.stackSize; }
  peek() { if (!this.stackSize) throw new NeonVmError('Stack underflow'); return this.stack[this.stackSize - 1]; }

  reset() { this.pc = 0; this.stackSize = 0; this.callSize = 0; this.halted = false; this.registers.fill(0); this.heap.fill(0); }
  rewind() { this.pc = 0; this.stackSize = 0; this.callSize = 0; this.halted = false; }

  step(limit = MAX_INSTRUCTIONS): NeonVmStep {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_INSTRUCTIONS) throw new NeonVmError('Invalid instruction quota');
    let executed = 0;
    while (!this.halted && executed < limit) { this.execute(this.readByte()); executed += 1; }
    if (!this.halted && executed === limit) throw new NeonVmQuotaError('Instruction quota exceeded');
    return { executed, halted: this.halted };
  }

  readHeapInt32(offset: number) { this.requireHeap(offset, 4); return new DataView(this.heap.buffer).getInt32(offset, true); }
  writeHeapInt32(offset: number, value: number) { this.requireHeap(offset, 4); new DataView(this.heap.buffer).setInt32(offset, value | 0, true); }

  private execute(opcode: number) {
    switch (opcode) {
      case NEON_OPCODE.PUSH: this.push(this.readInt32()); break;
      case NEON_OPCODE.POP: this.pop(); break;
      case NEON_OPCODE.DUP: this.push(this.peek()); break;
      case NEON_OPCODE.SWAP: { const right = this.pop(); const left = this.pop(); this.push(right); this.push(left); break; }
      case NEON_OPCODE.LOAD_I32: this.push(this.readHeapInt32(this.pop())); break;
      case NEON_OPCODE.STORE_I32: { const value = this.pop(); this.writeHeapInt32(this.pop(), value); break; }
      case NEON_OPCODE.ADD: this.binary((left, right) => (left + right) | 0); break;
      case NEON_OPCODE.SUB: this.binary((left, right) => (left - right) | 0); break;
      case NEON_OPCODE.MUL: this.binary((left, right) => Math.imul(left, right)); break;
      case NEON_OPCODE.DIV: this.binary((left, right) => right === 0 ? 0 : (left / right) | 0); break;
      case NEON_OPCODE.MOD: this.binary((left, right) => right === 0 ? 0 : (left % right) | 0); break;
      case NEON_OPCODE.BIT_AND: this.binary((left, right) => left & right); break;
      case NEON_OPCODE.BIT_OR: this.binary((left, right) => left | right); break;
      case NEON_OPCODE.BIT_XOR: this.binary((left, right) => left ^ right); break;
      case NEON_OPCODE.NOT: this.push(~this.pop()); break;
      case NEON_OPCODE.JUMP: this.jump(this.readUint32()); break;
      case NEON_OPCODE.JUMP_IF: { const target = this.readUint32(); if (this.pop() !== 0) this.jump(target); break; }
      case NEON_OPCODE.CALL: { const target = this.readUint32(); if (this.callSize === this.calls.length) throw new NeonVmError('Call stack overflow'); this.calls[this.callSize++] = this.pc; this.jump(target); break; }
      case NEON_OPCODE.RET: { if (!this.callSize) throw new NeonVmError('Call stack underflow'); this.pc = this.calls[--this.callSize]; break; }
      case NEON_OPCODE.HALT: this.halted = true; break;
      case NEON_OPCODE.HOST_DRAW: { const color = this.pop(); const scale = this.pop(); const y = this.pop(); const x = this.pop(); this.host.drawVectorPath(this.pop(), x, y, scale, color); break; }
      case NEON_OPCODE.HOST_AUDIO: { const volume = this.pop(); const note = this.pop(); const patchId = this.pop(); this.host.playSynthNote(this.pop(), patchId, note, volume); break; }
      case NEON_OPCODE.HOST_INPUT: this.push(this.host.readInputBitmask(this.pop())); break;
      case NEON_OPCODE.HOST_TIME: this.push(this.host.readTime()); break;
      default: throw new NeonVmError('Unknown opcode');
    }
  }

  private binary(operation: (left: number, right: number) => number) { const right = this.pop(); this.push(operation(this.pop(), right)); }
  private push(value: number) { if (this.stackSize === this.stack.length) throw new NeonVmError('Stack overflow'); this.stack[this.stackSize++] = value | 0; }
  private pop() { if (!this.stackSize) throw new NeonVmError('Stack underflow'); return this.stack[--this.stackSize]; }
  private readByte() { if (this.pc >= this.code.length) throw new NeonVmError('Program counter out of bounds'); return this.code[this.pc++]; }
  private readUint32() { if (this.pc + 4 > this.code.length) throw new NeonVmError('Truncated operand'); const value = this.view.getUint32(this.pc, true); this.pc += 4; return value; }
  private readInt32() { if (this.pc + 4 > this.code.length) throw new NeonVmError('Truncated operand'); const value = this.view.getInt32(this.pc, true); this.pc += 4; return value; }
  private jump(target: number) { if (target >= this.code.length) throw new NeonVmError('Jump target out of bounds'); this.pc = target; }
  private requireHeap(offset: number, length: number) { if (!Number.isInteger(offset) || offset < 0 || offset + length > this.heap.length) throw new NeonVmError('Heap access out of bounds'); }
}
