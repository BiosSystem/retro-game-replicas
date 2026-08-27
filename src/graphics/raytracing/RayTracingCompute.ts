export type RayTracingTier = 'STANDARD_COMPUTE_BVH' | 'EXPERIMENTAL_HARDWARE_RAY_TRACING';
export function detectRayTracingTier(features: ReadonlySet<string>): RayTracingTier { return features.has('ray-tracing') ? 'EXPERIMENTAL_HARDWARE_RAY_TRACING' : 'STANDARD_COMPUTE_BVH'; }
export const RAYTRACE_WORKGROUP = 8;
export const RAYTRACE_BVH_WGSL = `
struct Node { minimum: vec3f, left: i32, maximum: vec3f, right: i32, first: u32, count: u32, pad: vec2u }
struct Params { width: u32, height: u32, nodeCount: u32, frame: u32, camera: vec4f, light: vec4f }
@group(0) @binding(0) var<storage, read> nodes: array<Node>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var<uniform> params: Params;
fn box_hit(origin: vec3f, inverse: vec3f, minimum: vec3f, maximum: vec3f, limit: f32) -> bool {
  let a = (minimum - origin) * inverse; let b = (maximum - origin) * inverse;
  let near = max(max(min(a.x,b.x), min(a.y,b.y)), max(min(a.z,b.z), 0.0));
  let far = min(min(max(a.x,b.x), max(a.y,b.y)), min(max(a.z,b.z), limit)); return far >= near;
}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= params.width || id.y >= params.height) { return; }
  let uv = (vec2f(id.xy) + vec2f(0.5)) / vec2f(params.width, params.height);
  let origin = params.camera.xyz; let direction = normalize(vec3f((uv - 0.5) * 2.0, 1.0)); let inverse = 1.0 / max(abs(direction), vec3f(0.00001)) * sign(direction);
  var stack: array<i32, 64>; var top = 1u; stack[0] = 0; var visits = 0u;
  loop { if (top == 0u || visits >= 64u) { break; } top -= 1u; let nodeIndex = stack[top]; visits += 1u; if (nodeIndex < 0 || u32(nodeIndex) >= params.nodeCount) { continue; } let node = nodes[nodeIndex]; if (!box_hit(origin, inverse, node.minimum, node.maximum, 1000.0)) { continue; } if (node.count == 0u && top + 2u <= 64u) { stack[top] = node.left; stack[top + 1u] = node.right; top += 2u; } }
  let glow = f32(visits) / 64.0; let bounce = max(0.0, dot(direction, normalize(params.light.xyz - origin)));
  textureStore(outputTexture, vec2i(id.xy), vec4f(vec3f(0.03, 0.08, 0.16) + vec3f(0.1, 0.5, 0.8) * glow + bounce * 0.15, 1.0));
}`;
export function raytraceDispatch(width: number, height: number) { return { x: Math.ceil(Math.max(1, Math.floor(width)) / 8), y: Math.ceil(Math.max(1, Math.floor(height)) / 8) }; }
interface Device { createShaderModule(input: { code: string }): unknown; createComputePipelineAsync(input: unknown): Promise<unknown>; }
interface NavigatorGpu { gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<Device> } | null> } }
export async function compileRayTracingPipeline() { if (typeof navigator === 'undefined') return 'UNAVAILABLE' as const; const gpu = (navigator as Navigator & NavigatorGpu).gpu; if (!gpu) return 'UNAVAILABLE' as const; const adapter = await gpu.requestAdapter(); if (!adapter) return 'UNAVAILABLE' as const; const device = await adapter.requestDevice(); const module = device.createShaderModule({ code: RAYTRACE_BVH_WGSL }); await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'main' } }); return 'COMPILED' as const; }
