export const INT4_WORKGROUP_SIZE = 64;
export const INT4_INFERENCE_WGSL = `
struct Params { rows: u32, columns: u32, scale: f32, pad: u32 }
@group(0) @binding(0) var<storage, read> packedWeights: array<u32>;
@group(0) @binding(1) var<storage, read> inputValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;
fn int4(index: u32) -> f32 { let word = packedWeights[index / 8u]; let nibble = i32((word >> ((index % 8u) * 4u)) & 15u); return f32(select(nibble, nibble - 16, nibble >= 8)) * params.scale; }
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) { let row = id.x; if (row >= params.rows) { return; } var sum = 0.0; for (var column = 0u; column < params.columns; column++) { sum += int4(row * params.columns + column) * inputValues[column]; } outputValues[row] = sum; }`;
export function int4Dispatch(rows: number) { return Math.ceil(Math.max(0, Math.min(65536, Math.floor(rows))) / INT4_WORKGROUP_SIZE); }
interface Device { createShaderModule(input: { code: string }): unknown; createComputePipelineAsync(input: unknown): Promise<unknown>; }
interface NavigatorGpu { gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<Device> } | null> } }
export async function compileInt4Pipeline() { if (typeof navigator === 'undefined') return 'UNAVAILABLE' as const; const gpu = (navigator as Navigator & NavigatorGpu).gpu; if (!gpu) return 'UNAVAILABLE' as const; const adapter = await gpu.requestAdapter(); if (!adapter) return 'UNAVAILABLE' as const; const device = await adapter.requestDevice(); const module = device.createShaderModule({ code: INT4_INFERENCE_WGSL }); await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'main' } }); return 'COMPILED' as const; }
