export interface CompiledNeonScript {
  bytes: Uint8Array<ArrayBuffer>;
  instructions: number;
}

const MAX_SOURCE_BYTES = 256 * 1024;
const MAX_INSTRUCTIONS = 16_384;
const MAX_STACK = 256;

function unsignedLeb(value: number): number[] {
  const bytes: number[] = [];
  let remaining = value >>> 0;
  do {
    let byte = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining) byte |= 0x80;
    bytes.push(byte);
  } while (remaining);
  return bytes;
}

function signedLeb(value: number): number[] {
  const bytes: number[] = [];
  let remaining = value | 0;
  let more = true;
  while (more) {
    let byte = remaining & 0x7f;
    remaining >>= 7;
    const sign = (byte & 0x40) !== 0;
    more = !((remaining === 0 && !sign) || (remaining === -1 && sign));
    if (more) byte |= 0x80;
    bytes.push(byte);
  }
  return bytes;
}

function section(id: number, payload: number[]): number[] {
  return [id, ...unsignedLeb(payload.length), ...payload];
}

function parse(source: string): { code: number[]; count: number } {
  if (new TextEncoder().encode(source).length > MAX_SOURCE_BYTES) throw new Error('Script exceeds 256 KiB');
  const lines = source.split(/\r?\n|;/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0 || lines.length > MAX_INSTRUCTIONS) throw new Error('Instruction count is outside the safe range');
  const code: number[] = [];
  let stack = 0;
  let returned = false;
  const binary: Record<string, number> = { add: 0x6a, sub: 0x6b, mul: 0x6c, and: 0x71, or: 0x72, xor: 0x73, shl: 0x74, shr: 0x76 };
  for (const [index, line] of lines.entries()) {
    if (returned) throw new Error(`Instruction after return at line ${index + 1}`);
    const [operation, operand, extra] = line.toLowerCase().split(/\s+/);
    if (extra) throw new Error(`Invalid operands at line ${index + 1}`);
    if (operation === 'input' && operand === undefined) { code.push(0x20, 0); stack++; }
    else if (operation === 'const' && operand !== undefined && /^-?\d+$/.test(operand)) { const value = Number(operand); if (!Number.isSafeInteger(value) || value < -2147483648 || value > 2147483647) throw new Error(`Invalid i32 at line ${index + 1}`); code.push(0x41, ...signedLeb(value)); stack++; }
    else if (operation in binary && operand === undefined) { if (stack < 2) throw new Error(`Stack underflow at line ${index + 1}`); code.push(binary[operation] as number); stack--; }
    else if (operation === 'drop' && operand === undefined) { if (stack < 1) throw new Error(`Stack underflow at line ${index + 1}`); code.push(0x1a); stack--; }
    else if (operation === 'return' && operand === undefined) { if (stack !== 1) throw new Error(`Return requires one value at line ${index + 1}`); code.push(0x0f); returned = true; stack--; }
    else throw new Error(`Unknown instruction at line ${index + 1}`);
    if (stack > MAX_STACK) throw new Error(`Stack exceeds ${MAX_STACK} values`);
  }
  if (!returned) throw new Error('Script must end with return');
  return { code, count: lines.length };
}

export function compileNeonScript(source: string): CompiledNeonScript {
  const parsed = parse(source);
  const type = section(1, [1, 0x60, 1, 0x7f, 1, 0x7f]);
  const functions = section(3, [1, 0]);
  const exportName = [...new TextEncoder().encode('run')];
  const exports = section(7, [1, ...unsignedLeb(exportName.length), ...exportName, 0, 0]);
  const body = [0, ...parsed.code, 0x0b];
  const code = section(10, [1, ...unsignedLeb(body.length), ...body]);
  const bytes = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, ...type, ...functions, ...exports, ...code]);
  if (!WebAssembly.validate(bytes)) throw new Error('Compiler produced an invalid module');
  return { bytes, instructions: parsed.count };
}

export async function executeNeonScript(source: string, input: number): Promise<number> {
  const compiled = compileNeonScript(source);
  const module = new WebAssembly.Module(compiled.bytes);
  const instance = await WebAssembly.instantiate(module, {});
  const run = instance.exports.run;
  if (typeof run !== 'function') throw new Error('Compiled module has no run export');
  return Number(run(input | 0));
}
