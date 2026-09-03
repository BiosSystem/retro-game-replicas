import { describe, expect, it } from 'vitest';
import { decodeCartridge, encodeCartridge, CartridgeCodecError } from '../CartridgeCodec';
import { HostBridge } from '../HostBridge';
import { NEON_INVADER_CARTRIDGE, NEON_INVADER_STATE } from '../demo/neon-invader.cart';
import { NEON_OPCODE, NeonBytecodeVM, NeonVmError, NeonVmQuotaError, type NeonVmHost } from '../vm/NeonBytecodeVM';

const host: NeonVmHost = { drawVectorPath() {}, playSynthNote() {}, readInputBitmask: player => player + 9, readTime: () => 1234 };
const word = (value: number) => { const bytes = new Uint8Array(4); new DataView(bytes.buffer).setInt32(0, value, true); return [...bytes]; };

describe('NeonBytecodeVM', () => {
  it('executes deterministic integer arithmetic and stack operations', () => {
    const code = new Uint8Array([NEON_OPCODE.PUSH, ...word(7), NEON_OPCODE.PUSH, ...word(3), NEON_OPCODE.ADD, NEON_OPCODE.DUP, NEON_OPCODE.PUSH, ...word(4), NEON_OPCODE.MUL, NEON_OPCODE.SWAP, NEON_OPCODE.POP, NEON_OPCODE.HALT]);
    const vm = new NeonBytecodeVM(code, host); expect(vm.step()).toEqual({ executed: 9, halted: true }); expect(vm.peek()).toBe(40);
  });
  it('enforces execution quotas and heap boundaries', () => {
    const vm = new NeonBytecodeVM(new Uint8Array([NEON_OPCODE.JUMP, 0, 0, 0, 0]), host, { heapBytes: 8 }); expect(() => vm.step(12)).toThrow(NeonVmQuotaError); vm.writeHeapInt32(4, -2); expect(vm.readHeapInt32(4)).toBe(-2); expect(() => vm.writeHeapInt32(5, 1)).toThrow(NeonVmError);
  });
  it('routes sanitized host calls through the bridge', () => {
    const calls: number[][] = []; const bridge = new HostBridge({ drawVectorPath: (...values) => calls.push(values), playSynthNote() {}, readInputBitmask: () => 0, readTime: () => 0 });
    bridge.drawVectorPath(90000, -9000, 9000, 0, -1); expect(calls).toEqual([[65535, -8192, 8192, 1, 4294967295]]);
  });
});

describe('neongame cartridge codec', () => {
  it('round-trips cartridge metadata and immutable payload views', () => {
    const cartridge = { metadata: { title: 'VECTOR TEST', author: 'BiosSystem', version: '1.0.0', targetTickRate: 60 }, bytecode: new Uint8Array([NEON_OPCODE.HALT]), vectorAssets: [{ id: 7, data: new Uint8Array([1, 2]) }], audioPatterns: [{ id: 3, data: new Uint8Array([9]) }] };
    const decoded = decodeCartridge(encodeCartridge(cartridge)); expect(decoded.metadata).toEqual(cartridge.metadata); expect([...decoded.bytecode]).toEqual([NEON_OPCODE.HALT]); expect([...decoded.vectorAssets[0].data]).toEqual([1, 2]);
  });
  it('rejects truncated and tampered cartridges', () => {
    const cartridge = { metadata: { title: 'T', author: 'A', version: '1', targetTickRate: 60 }, bytecode: new Uint8Array([NEON_OPCODE.HALT]), vectorAssets: [], audioPatterns: [] }; const encoded = new Uint8Array(encodeCartridge(cartridge)); expect(() => decodeCartridge(encoded.subarray(0, 10))).toThrow(CartridgeCodecError); encoded[10] ^= 1; expect(() => decodeCartridge(encoded)).toThrow(CartridgeCodecError);
  });
});

describe('Neon Invader reference cartridge', () => {
  it('moves the cannon and emits an FM fire command through the bounded host bridge', () => {
    const draws: number[][] = []; const notes: number[][] = [];
    const cartridge = decodeCartridge(NEON_INVADER_CARTRIDGE);
    const vm = new NeonBytecodeVM(cartridge.bytecode, new HostBridge({ drawVectorPath: (...values) => draws.push(values), playSynthNote: (...values) => notes.push(values), readInputBitmask: () => 6, readTime: () => 0 }));
    vm.writeHeapInt32(NEON_INVADER_STATE.playerX, 320); vm.writeHeapInt32(NEON_INVADER_STATE.score, 0); vm.rewind();
    expect(vm.step()).toMatchObject({ halted: true }); expect(vm.readHeapInt32(NEON_INVADER_STATE.playerX)).toBe(328); expect(vm.readHeapInt32(NEON_INVADER_STATE.score)).toBe(10);
    expect(draws).toHaveLength(23); expect(notes).toEqual([[0, 1, 72, 180]]);
  });
});
