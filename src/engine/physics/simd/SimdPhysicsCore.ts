export const MAX_SIMD_BODIES = 100_000;

export interface GravityBatch {
  x: Float32Array;
  y: Float32Array;
}

function unsignedLeb(value: number) {
  const output: number[] = [];
  let remaining = value >>> 0;
  do {
    let byte = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining) byte |= 0x80;
    output.push(byte);
  } while (remaining);
  return output;
}

function section(id: number, payload: number[]) {
  return [id, ...unsignedLeb(payload.length), ...payload];
}

function name(value: string) {
  const bytes = [...new TextEncoder().encode(value)];
  return [...unsignedLeb(bytes.length), ...bytes];
}

function simd(opcode: number) {
  return [0xfd, ...unsignedLeb(opcode)];
}

export function buildSimdPhysicsModule() {
  const type = section(1, [1, 0x60, 7, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0]);
  const functions = section(3, [1, 0]);
  const memory = section(5, [1, 1, ...unsignedLeb(64), ...unsignedLeb(256)]);
  const exports = section(7, [2, ...name('memory'), 2, 0, ...name('separation4'), 0, 0]);
  const load = [...simd(0), 4, 0];
  const store = [...simd(11), 4, 0];
  const subtract = simd(229);
  const multiply = simd(230);
  const add = simd(228);
  const instructions = [
    0x02, 0x40,
    0x03, 0x40,
    0x20, 7, 0x20, 6, 0x4f, 0x0d, 1,
    0x20, 0, 0x20, 7, 0x6a, ...load, 0x20, 1, 0x20, 7, 0x6a, ...load, ...subtract, 0x21, 8,
    0x20, 2, 0x20, 7, 0x6a, ...load, 0x20, 3, 0x20, 7, 0x6a, ...load, ...subtract, 0x21, 9,
    0x20, 4, 0x20, 7, 0x6a, ...load, 0x21, 10,
    0x20, 5, 0x20, 7, 0x6a,
    0x20, 8, 0x20, 8, ...multiply,
    0x20, 9, 0x20, 9, ...multiply, ...add,
    0x20, 10, 0x20, 10, ...multiply, ...subtract,
    ...store,
    0x20, 7, 0x41, 16, 0x6a, 0x21, 7,
    0x0c, 0,
    0x0b,
    0x0b,
    0x0b,
  ];
  const body = [2, 1, 0x7f, 3, 0x7b, ...instructions];
  const code = section(10, [1, ...unsignedLeb(body.length), ...body]);
  return new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, ...type, ...functions, ...memory, ...exports, ...code]);
}

export const SIMD_PHYSICS_WASM = buildSimdPhysicsModule();

export function buildScalarPhysicsModule() {
  const type = section(1, [1, 0x60, 7, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0]);
  const functions = section(3, [1, 0]);
  const memory = section(5, [1, 1, ...unsignedLeb(64), ...unsignedLeb(256)]);
  const exports = section(7, [2, ...name('memory'), 2, 0, ...name('separation'), 0, 0]);
  const load = [0x2a, 2, 0];
  const store = [0x38, 2, 0];
  const instructions = [
    0x02, 0x40, 0x03, 0x40,
    0x20, 7, 0x20, 6, 0x4f, 0x0d, 1,
    0x20, 0, 0x20, 7, 0x6a, ...load, 0x20, 1, 0x20, 7, 0x6a, ...load, 0x93, 0x21, 8,
    0x20, 2, 0x20, 7, 0x6a, ...load, 0x20, 3, 0x20, 7, 0x6a, ...load, 0x93, 0x21, 9,
    0x20, 4, 0x20, 7, 0x6a, ...load, 0x21, 10,
    0x20, 5, 0x20, 7, 0x6a,
    0x20, 8, 0x20, 8, 0x94,
    0x20, 9, 0x20, 9, 0x94, 0x92,
    0x20, 10, 0x20, 10, 0x94, 0x93,
    ...store,
    0x20, 7, 0x41, 4, 0x6a, 0x21, 7, 0x0c, 0,
    0x0b, 0x0b, 0x0b,
  ];
  const body = [2, 1, 0x7f, 3, 0x7d, ...instructions];
  const code = section(10, [1, ...unsignedLeb(body.length), ...body]);
  return new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, ...type, ...functions, ...memory, ...exports, ...code]);
}

export const SCALAR_PHYSICS_WASM = buildScalarPhysicsModule();

export function supportsWasmSimd() {
  return typeof WebAssembly !== 'undefined' && WebAssembly.validate(SIMD_PHYSICS_WASM);
}

type Separation4 = (ax: number, bx: number, ay: number, by: number, radii: number, output: number, byteLength: number) => void;

function assertBatch(arrays: readonly Float32Array[]) {
  const count = arrays[0]?.length ?? 0;
  if (count < 1 || count > MAX_SIMD_BODIES || arrays.some(array => array.length !== count)) throw new Error('SIMD batch lengths are invalid');
  return count;
}

export function batchCollisionScalar(ax: Float32Array, ay: Float32Array, bx: Float32Array, by: Float32Array, radii: Float32Array) {
  const count = assertBatch([ax, ay, bx, by, radii]);
  const output = new Float32Array(count);
  for (let index = 0; index < count; index++) {
    const dx = Math.fround(ax[index] - bx[index]);
    const dy = Math.fround(ay[index] - by[index]);
    const squaredDistance = Math.fround(Math.fround(dx * dx) + Math.fround(dy * dy));
    output[index] = Math.fround(squaredDistance - Math.fround(radii[index] * radii[index]));
  }
  return output;
}

export class SimdPhysicsCore {
  private readonly memory: WebAssembly.Memory;
  private readonly separation4: Separation4;

  private constructor(memory: WebAssembly.Memory, separation4: Separation4) {
    this.memory = memory;
    this.separation4 = separation4;
  }

  static async create() {
    if (!supportsWasmSimd()) return null;
    const instantiated = await WebAssembly.instantiate(SIMD_PHYSICS_WASM);
    const exports = instantiated.instance.exports as { memory: WebAssembly.Memory; separation4: Separation4 };
    return new SimdPhysicsCore(exports.memory, exports.separation4);
  }

  collisionSeparation(ax: Float32Array, ay: Float32Array, bx: Float32Array, by: Float32Array, radii: Float32Array) {
    const count = assertBatch([ax, ay, bx, by, radii]);
    const padded = Math.ceil(count / 4) * 4;
    const bytesPerArray = padded * 4;
    const required = bytesPerArray * 6;
    const current = this.memory.buffer.byteLength;
    if (required > current) this.memory.grow(Math.ceil((required - current) / 65_536));
    const memory = new Float32Array(this.memory.buffer, 0, padded * 6);
    memory.fill(0);
    memory.set(ax, 0);
    memory.set(bx, padded);
    memory.set(ay, padded * 2);
    memory.set(by, padded * 3);
    memory.set(radii, padded * 4);
    this.separation4(0, bytesPerArray, bytesPerArray * 2, bytesPerArray * 3, bytesPerArray * 4, bytesPerArray * 5, bytesPerArray);
    return new Float32Array(memory.slice(padded * 5, padded * 5 + count));
  }

  gravityVectors(x: Float32Array, y: Float32Array, attractorX: number, attractorY: number, strength: number, softening = 0.25): GravityBatch {
    const count = assertBatch([x, y]);
    const centerX = new Float32Array(count).fill(attractorX);
    const centerY = new Float32Array(count).fill(attractorY);
    const soft = new Float32Array(count).fill(Math.sqrt(Math.max(1e-6, softening)));
    const radiusSquaredMinusSoftening = this.collisionSeparation(x, y, centerX, centerY, soft);
    const outputX = new Float32Array(count);
    const outputY = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      const radiusSquared = Math.max(1e-6, radiusSquaredMinusSoftening[index] + softening * 2);
      const factor = strength / (radiusSquared * Math.sqrt(radiusSquared));
      outputX[index] = Math.fround((attractorX - x[index]) * factor);
      outputY[index] = Math.fround((attractorY - y[index]) * factor);
    }
    return { x: outputX, y: outputY };
  }

  timeDilation(vx: Float32Array, vy: Float32Array, lightSpeed: number) {
    const count = assertBatch([vx, vy]);
    if (!Number.isFinite(lightSpeed) || lightSpeed <= 0) throw new Error('Invalid light speed');
    const zero = new Float32Array(count);
    const speedSquared = this.collisionSeparation(vx, vy, zero, zero, zero);
    const output = new Float32Array(count);
    const inverseC2 = 1 / (lightSpeed * lightSpeed);
    for (let index = 0; index < count; index++) output[index] = Math.fround(Math.sqrt(Math.max(1e-8, 1 - Math.min(0.999998, speedSquared[index] * inverseC2))));
    return output;
  }
}

export class ScalarWasmPhysicsCore {
  private readonly memory: WebAssembly.Memory;
  private readonly separation: Separation4;

  private constructor(memory: WebAssembly.Memory, separation: Separation4) {
    this.memory = memory;
    this.separation = separation;
  }

  static async create() {
    const instantiated = await WebAssembly.instantiate(SCALAR_PHYSICS_WASM);
    const exports = instantiated.instance.exports as { memory: WebAssembly.Memory; separation: Separation4 };
    return new ScalarWasmPhysicsCore(exports.memory, exports.separation);
  }

  collisionSeparation(ax: Float32Array, ay: Float32Array, bx: Float32Array, by: Float32Array, radii: Float32Array) {
    const count = assertBatch([ax, ay, bx, by, radii]);
    const bytesPerArray = count * 4;
    const required = bytesPerArray * 6;
    const current = this.memory.buffer.byteLength;
    if (required > current) this.memory.grow(Math.ceil((required - current) / 65_536));
    const memory = new Float32Array(this.memory.buffer, 0, count * 6);
    memory.set(ax, 0);
    memory.set(bx, count);
    memory.set(ay, count * 2);
    memory.set(by, count * 3);
    memory.set(radii, count * 4);
    this.separation(0, bytesPerArray, bytesPerArray * 2, bytesPerArray * 3, bytesPerArray * 4, bytesPerArray * 5, bytesPerArray);
    return new Float32Array(memory.slice(count * 5, count * 6));
  }
}
