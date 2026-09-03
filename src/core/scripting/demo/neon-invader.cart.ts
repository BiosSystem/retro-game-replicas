import { encodeCartridge } from '../CartridgeCodec';
import { NEON_OPCODE } from '../vm/NeonBytecodeVM';

const LEFT = 1; const RIGHT = 2; const FIRE = 4;
const CYAN = 0x00ffff; const GREEN = 0x66ff88; const MAGENTA = 0xff33cc;

export const NEON_INVADER_STATE = { playerX: 0, score: 4, lives: 8 } as const;

function buildProgram() {
  const writer = new BytecodeWriter();
  writer.push(NEON_INVADER_STATE.playerX).op(NEON_OPCODE.LOAD_I32).push(0).op(NEON_OPCODE.HOST_INPUT).push(LEFT).op(NEON_OPCODE.BIT_AND).push(4).op(NEON_OPCODE.MUL).op(NEON_OPCODE.SUB);
  writer.push(0).op(NEON_OPCODE.HOST_INPUT).push(RIGHT).op(NEON_OPCODE.BIT_AND).push(4).op(NEON_OPCODE.MUL).op(NEON_OPCODE.ADD).push(NEON_INVADER_STATE.playerX).op(NEON_OPCODE.SWAP).op(NEON_OPCODE.STORE_I32);
  draw(writer, 1, NEON_INVADER_STATE.playerX, 420, 2, CYAN, true);
  for (let row = 0; row < 3; row += 1) for (let column = 0; column < 7; column += 1) draw(writer, 2, 150 + column * 56, 120 + row * 42, 1, GREEN, false);
  writer.push(0).op(NEON_OPCODE.HOST_INPUT).push(FIRE).op(NEON_OPCODE.BIT_AND).jump(NEON_OPCODE.JUMP_IF, 'fire').jump(NEON_OPCODE.JUMP, 'done');
  writer.mark('fire').push(0).push(1).push(72).push(180).op(NEON_OPCODE.HOST_AUDIO);
  writer.push(NEON_INVADER_STATE.score).op(NEON_OPCODE.LOAD_I32).push(10).op(NEON_OPCODE.ADD).push(NEON_INVADER_STATE.score).op(NEON_OPCODE.SWAP).op(NEON_OPCODE.STORE_I32);
  draw(writer, 3, NEON_INVADER_STATE.playerX, 375, 1, MAGENTA, true);
  writer.mark('done').op(NEON_OPCODE.HALT);
  return writer.finish();
}

function draw(writer: BytecodeWriter, path: number, x: number, y: number, scale: number, color: number, xIsHeap: boolean) { writer.push(path); if (xIsHeap) writer.push(x).op(NEON_OPCODE.LOAD_I32); else writer.push(x); writer.push(y).push(scale).push(color).op(NEON_OPCODE.HOST_DRAW); }

class BytecodeWriter {
  private readonly bytes: number[] = [];
  private readonly labels = new Map<string, number>();
  private readonly patches: Array<{ offset: number; label: string }> = [];
  op(value: number) { this.bytes.push(value); return this; }
  push(value: number) { this.op(NEON_OPCODE.PUSH); const buffer = new ArrayBuffer(4); new DataView(buffer).setInt32(0, value, true); this.bytes.push(...new Uint8Array(buffer)); return this; }
  mark(label: string) { this.labels.set(label, this.bytes.length); return this; }
  jump(opcode: number, label: string) { this.op(opcode); this.patches.push({ offset: this.bytes.length, label }); this.bytes.push(0, 0, 0, 0); return this; }
  finish() { const output = new Uint8Array(this.bytes); const view = new DataView(output.buffer); for (const patch of this.patches) { const target = this.labels.get(patch.label); if (target === undefined) throw new Error('Missing bytecode label'); view.setUint32(patch.offset, target, true); } return output; }
}

export const NEON_INVADER_CARTRIDGE: ArrayBuffer = encodeCartridge({
  metadata: { title: 'NEON INVADER', author: 'BiosSystem', version: '1.0.0', targetTickRate: 60 },
  bytecode: buildProgram(),
  vectorAssets: [{ id: 1, data: new Uint8Array([1]) }, { id: 2, data: new Uint8Array([2]) }, { id: 3, data: new Uint8Array([3]) }],
  audioPatterns: [{ id: 1, data: new Uint8Array([72, 180]) }],
});
