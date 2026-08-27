export class Int4Matrix {
  readonly rows: number; readonly columns: number; readonly packed: Uint8Array; readonly scale: number;
  constructor(rows: number, columns: number, packed: Uint8Array, scale = 1 / 8) { if (rows < 1 || columns < 1 || packed.length !== Math.ceil(rows * columns / 2)) throw new Error('Invalid INT4 matrix'); this.rows = rows; this.columns = columns; this.packed = packed.slice(); this.scale = scale; }
  static generated(rows: number, columns: number, seed: number, scale = 1 / 8) { const count = rows * columns, packed = new Uint8Array(Math.ceil(count / 2)); let state = seed | 0; for (let i = 0; i < count; i++) { state = random(state); const signed = ((state >>> 28) & 15) - 8, nibble = signed & 15; packed[i >> 1] |= nibble << ((i & 1) * 4); } return new Int4Matrix(rows, columns, packed, scale); }
  get(row: number, column: number) { const index = row * this.columns + column, nibble = this.packed[index >> 1] >> ((index & 1) * 4) & 15; return (nibble >= 8 ? nibble - 16 : nibble) * this.scale; }
  project(input: Float32Array, output = new Float32Array(this.rows)) { if (input.length !== this.columns || output.length !== this.rows) throw new Error('INT4 projection dimensions do not match'); for (let row = 0; row < this.rows; row++) { let sum = 0; for (let column = 0; column < this.columns; column++) sum += this.get(row, column) * input[column]; output[row] = sum; } return output; }
}
function random(value: number) { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value | 0; }
