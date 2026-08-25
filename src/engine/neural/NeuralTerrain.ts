export type Biome = 'VOID' | 'TUNDRA' | 'FOREST' | 'DESERT' | 'VOLCANIC';
export interface TerrainSample { elevation: number; erosion: number; mineral: number; biome: Biome; }
export interface TerrainChunk { size: number; elevation: Int16Array<ArrayBuffer>; erosion: Uint8Array<ArrayBuffer>; mineral: Uint8Array<ArrayBuffer>; biome: Uint8Array<ArrayBuffer>; checksum: number; }

const BIOMES: readonly Biome[] = ['VOID', 'TUNDRA', 'FOREST', 'DESERT', 'VOLCANIC'];

function mix(value: number): number { value = Math.imul(value ^ value >>> 16, 0x45d9f3b); value = Math.imul(value ^ value >>> 16, 0x45d9f3b); return value ^ value >>> 16; }
function weight(seed: number, layer: number, output: number, input: number): number { return (mix(seed ^ Math.imul(layer + 1, 0x9e3779b9) ^ Math.imul(output + 3, 0x85ebca6b) ^ input) & 31) - 16; }
function clamp16(value: number): number { return Math.max(-32768, Math.min(32767, value | 0)); }

export function sampleNeuralTerrain(seed: number, x: number, z: number): TerrainSample {
  const qx = Math.max(-4096, Math.min(4096, Math.round(x * 16))), qz = Math.max(-4096, Math.min(4096, Math.round(z * 16)));
  const inputs = [qx, qz, ((mix(seed ^ qx) & 1023) - 512), ((mix(seed ^ qz ^ 0x51ed270b) & 1023) - 512)];
  const hidden = new Int16Array(8);
  for (let output = 0; output < hidden.length; output++) { let sum = weight(seed, 0, output, 99) * 64; for (let input = 0; input < inputs.length; input++) sum += weight(seed, 0, output, input) * (inputs[input] as number); hidden[output] = clamp16(Math.max(0, sum >> 4)); }
  const outputs = new Int16Array(8);
  for (let output = 0; output < outputs.length; output++) { let sum = weight(seed, 1, output, 99) * 128; for (let input = 0; input < hidden.length; input++) sum += weight(seed, 1, output, input) * (hidden[input] as number); outputs[output] = clamp16(sum >> 7); }
  let biome = 0; for (let index = 1; index < 5; index++) if ((outputs[index] as number) > (outputs[biome] as number)) biome = index;
  return { elevation: outputs[5] as number, erosion: Math.min(255, Math.abs(outputs[6] as number) >> 3), mineral: Math.min(255, Math.abs(outputs[7] as number) >> 3), biome: BIOMES[biome] as Biome };
}

export function generateNeuralTerrain(seed: number, chunkX: number, chunkZ: number, size = 64): TerrainChunk {
  const width = Math.max(1, Math.min(128, Math.floor(size))), count = width * width, elevation = new Int16Array(count), erosion = new Uint8Array(count), mineral = new Uint8Array(count), biome = new Uint8Array(count); let checksum = 2166136261;
  for (let index = 0; index < count; index++) { const x = chunkX * width + index % width, z = chunkZ * width + Math.floor(index / width), sample = sampleNeuralTerrain(seed, x, z); elevation[index] = sample.elevation; erosion[index] = sample.erosion; mineral[index] = sample.mineral; biome[index] = BIOMES.indexOf(sample.biome); checksum = Math.imul(checksum ^ (sample.elevation & 0xffff) ^ sample.erosion << 8 ^ sample.mineral << 16 ^ biome[index], 16777619); }
  return { size: width, elevation, erosion, mineral, biome, checksum: checksum >>> 0 };
}

export const NEURAL_TERRAIN_WGSL = `
struct Params { seed: u32, originX: i32, originZ: i32, size: u32 }
struct Sample { elevation: i32, packed: u32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> output: array<Sample>;
fn mix32(input: u32) -> u32 { var value = input; value = (value ^ (value >> 16u)) * 0x045d9f3bu; value = (value ^ (value >> 16u)) * 0x045d9f3bu; return value ^ (value >> 16u); }
fn networkWeight(layer: u32, neuron: u32, input: u32) -> i32 { return i32(mix32(params.seed ^ ((layer + 1u) * 0x9e3779b9u) ^ ((neuron + 3u) * 0x85ebca6bu) ^ input) & 31u) - 16; }
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let count = params.size * params.size; if (id.x >= count) { return; }
  let x = clamp((params.originX + i32(id.x % params.size)) * 16, -4096, 4096); let z = clamp((params.originZ + i32(id.x / params.size)) * 16, -4096, 4096);
  var inputs = array<i32, 4>(x, z, i32(mix32(params.seed ^ bitcast<u32>(x)) & 1023u) - 512, i32(mix32(params.seed ^ bitcast<u32>(z) ^ 0x51ed270bu) & 1023u) - 512); var hidden: array<i32, 8>;
  for (var neuron = 0u; neuron < 8u; neuron++) { var sum = networkWeight(0u, neuron, 99u) * 64; for (var input = 0u; input < 4u; input++) { sum += networkWeight(0u, neuron, input) * inputs[input]; } hidden[neuron] = clamp(max(0, sum >> 4), -32768, 32767); }
  var scores: array<i32, 8>; for (var neuron = 0u; neuron < 8u; neuron++) { var sum = networkWeight(1u, neuron, 99u) * 128; for (var input = 0u; input < 8u; input++) { sum += networkWeight(1u, neuron, input) * hidden[input]; } scores[neuron] = clamp(sum >> 7, -32768, 32767); }
  var biome = 0u; for (var index = 1u; index < 5u; index++) { if (scores[index] > scores[biome]) { biome = index; } } let erosion = min(255u, u32(abs(scores[6])) >> 3u); let mineral = min(255u, u32(abs(scores[7])) >> 3u); output[id.x] = Sample(scores[5], biome | (erosion << 8u) | (mineral << 16u));
}`;

interface GpuDevice { createShaderModule(input: { code: string }): unknown; createComputePipelineAsync(input: unknown): Promise<unknown>; }
export async function compileNeuralTerrainPipeline(): Promise<'COMPILED' | 'UNAVAILABLE'> { if (typeof navigator === 'undefined') return 'UNAVAILABLE'; const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<GpuDevice> } | null> } }).gpu; if (!gpu) return 'UNAVAILABLE'; const adapter = await gpu.requestAdapter(); if (!adapter) return 'UNAVAILABLE'; const device = await adapter.requestDevice(); const module = device.createShaderModule({ code: NEURAL_TERRAIN_WGSL }); await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'main' } }); return 'COMPILED'; }
