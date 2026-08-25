export const VOLUMETRIC_WORKGROUP = 8;
export const VOLUMETRIC_WGSL = `
struct Params { width: u32, height: u32, steps: u32, density: f32, light: vec3f, anisotropy: f32 }
@group(0) @binding(0) var outputTexture: texture_storage_2d<rgba16float, write>;
@group(0) @binding(1) var<uniform> params: Params;
fn rayleigh_phase(cosTheta: f32) -> f32 { return 0.059683 * (1.0 + cosTheta * cosTheta); }
fn mie_phase(cosTheta: f32, g: f32) -> f32 {
  let d = max(0.0001, 1.0 + g * g - 2.0 * g * cosTheta);
  return (1.0 - g * g) / (12.566371 * pow(d, 1.5));
}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= params.width || id.y >= params.height) { return; }
  let uv = (vec2f(id.xy) + 0.5) / vec2f(params.width, params.height);
  let ray = normalize(vec3f((uv - 0.5) * 2.0, 1.0));
  let cosTheta = dot(ray, normalize(params.light));
  var depth = 0.0;
  var light = vec3f(0.0);
  let count = max(1u, min(96u, params.steps));
  for (var step = 0u; step < count; step++) {
    let t = (f32(step) + 0.5) / f32(count);
    let localDensity = params.density * exp(-t * 1.75);
    depth += localDensity / f32(count);
    let transmittance = exp(-depth * 1.4);
    let rayleigh = rayleigh_phase(cosTheta) * vec3f(0.35, 0.55, 1.0);
    let mie = mie_phase(cosTheta, params.anisotropy) * vec3f(1.0, 0.72, 0.45);
    light += transmittance * localDensity * (rayleigh + mie) / f32(count);
  }
  textureStore(outputTexture, vec2i(id.xy), vec4f(light, 1.0 - exp(-depth)));
}`;

export function volumetricDispatch(width: number, height: number) {
  const safeWidth = Math.max(1, Math.min(8192, Math.floor(width)));
  const safeHeight = Math.max(1, Math.min(8192, Math.floor(height)));
  return { x: Math.ceil(safeWidth / VOLUMETRIC_WORKGROUP), y: Math.ceil(safeHeight / VOLUMETRIC_WORKGROUP) };
}

interface GpuDevice { createShaderModule(input: { code: string }): unknown; createComputePipelineAsync(input: unknown): Promise<unknown>; }
interface GpuNavigator { gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<GpuDevice> } | null> } }

export async function compileVolumetricPipeline() {
  if (typeof navigator === 'undefined') return 'UNAVAILABLE' as const;
  const gpu = (navigator as Navigator & GpuNavigator).gpu;
  if (!gpu) return 'UNAVAILABLE' as const;
  const adapter = await gpu.requestAdapter();
  if (!adapter) return 'UNAVAILABLE' as const;
  const device = await adapter.requestDevice();
  const module = device.createShaderModule({ code: VOLUMETRIC_WGSL });
  await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'main' } });
  return 'COMPILED' as const;
}
