export const MAX_GAUSSIAN_SPLATS = 100_000;
export const SPLAT_STRIDE = 16;

export interface GaussianSplatCloud {
  readonly data: Float32Array;
  readonly count: number;
  readonly seed: number;
}

export interface SplatCamera {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  focalLength: number;
  near: number;
}

export interface ProjectedSplat {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  depth: number;
  opacity: number;
  red: number;
  green: number;
  blue: number;
}

function randomStep(state: { value: number }) {
  let value = state.value | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.value = value | 0;
  return (value >>> 0) / 4_294_967_296;
}

export function generateProceduralSplatCloud(seed = 0x45504f43, requestedCount = 24_000): GaussianSplatCloud {
  const count = Math.max(1, Math.min(MAX_GAUSSIAN_SPLATS, Math.floor(requestedCount)));
  const data = new Float32Array(count * SPLAT_STRIDE);
  const state = { value: seed || 1 };
  for (let index = 0; index < count; index++) {
    const offset = index * SPLAT_STRIDE;
    const choice = randomStep(state);
    const angle = randomStep(state) * Math.PI * 2;
    const radius = Math.sqrt(randomStep(state)) * 92;
    let x = Math.cos(angle) * radius;
    let y = (randomStep(state) - 0.5) * 1.2;
    let z = Math.sin(angle) * radius;
    let scaleX = 0.7 + randomStep(state) * 1.8;
    let scaleY = 0.3 + randomStep(state) * 0.9;
    let scaleZ = 0.7 + randomStep(state) * 1.8;
    let red = 0.08 + randomStep(state) * 0.12;
    let green = 0.18 + randomStep(state) * 0.28;
    let blue = 0.2 + randomStep(state) * 0.22;
    let opacity = 0.16 + randomStep(state) * 0.24;

    if (choice > 0.58 && choice <= 0.76) {
      const grove = Math.floor(randomStep(state) * 18);
      const groveAngle = grove / 18 * Math.PI * 2;
      const groveRadius = 18 + (grove % 5) * 13;
      x = Math.cos(groveAngle) * groveRadius + (randomStep(state) - 0.5) * 4;
      z = Math.sin(groveAngle) * groveRadius + (randomStep(state) - 0.5) * 4;
      y = 2 + randomStep(state) * 14;
      scaleX = 0.45 + randomStep(state) * 0.6;
      scaleY = 1.5 + randomStep(state) * 3.2;
      scaleZ = scaleX;
      red = 0.12 + randomStep(state) * 0.1;
      green = 0.07 + randomStep(state) * 0.07;
      blue = 0.05;
      opacity = 0.32;
    } else if (choice > 0.76) {
      const grove = Math.floor(randomStep(state) * 18);
      const groveAngle = grove / 18 * Math.PI * 2;
      const groveRadius = 18 + (grove % 5) * 13;
      const crownAngle = randomStep(state) * Math.PI * 2;
      const crownRadius = Math.sqrt(randomStep(state)) * 7;
      x = Math.cos(groveAngle) * groveRadius + Math.cos(crownAngle) * crownRadius;
      z = Math.sin(groveAngle) * groveRadius + Math.sin(crownAngle) * crownRadius;
      y = 13 + (randomStep(state) - 0.5) * 9;
      scaleX = 1.2 + randomStep(state) * 2.5;
      scaleY = 0.8 + randomStep(state) * 2;
      scaleZ = 1.2 + randomStep(state) * 2.5;
      red = 0.04 + randomStep(state) * 0.12;
      green = 0.38 + randomStep(state) * 0.5;
      blue = 0.16 + randomStep(state) * 0.2;
      opacity = 0.18 + randomStep(state) * 0.3;
    }

    data[offset] = x;
    data[offset + 1] = y;
    data[offset + 2] = z;
    data[offset + 3] = opacity;
    data[offset + 4] = scaleX;
    data[offset + 5] = scaleY;
    data[offset + 6] = scaleZ;
    data[offset + 7] = angle;
    data[offset + 8] = red;
    data[offset + 9] = green;
    data[offset + 10] = blue;
    data[offset + 11] = 1;
    data[offset + 12] = 0.25 + randomStep(state) * 0.75;
    data[offset + 13] = 0.15 + randomStep(state) * 0.35;
    data[offset + 14] = randomStep(state) * 0.08;
    data[offset + 15] = 0;
  }
  return { data, count, seed };
}

export function projectSplatCloud(cloud: GaussianSplatCloud, camera: SplatCamera, width: number, height: number, maximum = 4_096): ProjectedSplat[] {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const limit = Math.max(1, Math.min(cloud.count, Math.floor(maximum)));
  const output: ProjectedSplat[] = [];
  const cy = Math.cos(camera.yaw);
  const sy = Math.sin(camera.yaw);
  const cp = Math.cos(camera.pitch);
  const sp = Math.sin(camera.pitch);
  const stride = Math.max(1, Math.floor(cloud.count / limit));
  for (let index = 0; index < cloud.count && output.length < limit; index += stride) {
    const offset = index * SPLAT_STRIDE;
    const dx = cloud.data[offset] - camera.x;
    const dy = cloud.data[offset + 1] - camera.y;
    const dz = cloud.data[offset + 2] - camera.z;
    const yawX = dx * cy - dz * sy;
    const yawZ = dx * sy + dz * cy;
    const viewY = dy * cp - yawZ * sp;
    const viewZ = dy * sp + yawZ * cp;
    if (viewZ <= Math.max(0.01, camera.near)) continue;
    const perspective = Math.max(0.1, camera.focalLength) / viewZ;
    const screenX = safeWidth * 0.5 + yawX * perspective;
    const screenY = safeHeight * 0.52 - viewY * perspective;
    const radiusX = Math.max(0.45, cloud.data[offset + 4] * perspective);
    const radiusY = Math.max(0.45, cloud.data[offset + 5] * perspective);
    if (screenX + radiusX * 3 < 0 || screenX - radiusX * 3 >= safeWidth || screenY + radiusY * 3 < 0 || screenY - radiusY * 3 >= safeHeight) continue;
    const diffuse = 0.45 + cloud.data[offset + 12] * 0.55;
    output.push({ x: screenX, y: screenY, radiusX, radiusY, depth: viewZ, opacity: cloud.data[offset + 3], red: cloud.data[offset + 8] * diffuse, green: cloud.data[offset + 9] * diffuse, blue: cloud.data[offset + 10] * diffuse });
  }
  output.sort((left, right) => right.depth - left.depth);
  return output;
}

export function splatChecksum(cloud: GaussianSplatCloud) {
  let checksum = 2_166_136_261;
  for (let index = 0; index < cloud.data.length; index += 7) {
    const value = Math.round((cloud.data[index] ?? 0) * 4096);
    checksum ^= value;
    checksum = Math.imul(checksum, 16_777_619);
  }
  return checksum >>> 0;
}

export const GAUSSIAN_SPLAT_WGSL = `
struct Splat { centerOpacity: vec4f, scaleRotation: vec4f, color: vec4f, lighting: vec4f }
struct Camera { viewProjection: mat4x4f, viewportExposure: vec4f, light: vec4f }
struct VertexOutput { @builtin(position) position: vec4f, @location(0) local: vec2f, @location(1) color: vec4f }
@group(0) @binding(0) var<storage, read> splats: array<Splat>;
@group(0) @binding(1) var<uniform> camera: Camera;
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
  let corners = array<vec2f, 6>(vec2f(-1.0,-1.0), vec2f(1.0,-1.0), vec2f(-1.0,1.0), vec2f(-1.0,1.0), vec2f(1.0,-1.0), vec2f(1.0,1.0));
  let splat = splats[instanceIndex];
  let center = camera.viewProjection * vec4f(splat.centerOpacity.xyz, 1.0);
  let corner = corners[vertexIndex];
  let radius = splat.scaleRotation.xy * camera.viewportExposure.z / max(0.001, center.w);
  var output: VertexOutput;
  output.position = center + vec4f(corner * radius, 0.0, 0.0);
  output.local = corner;
  let lightAmount = 0.35 + 0.65 * max(0.0, dot(normalize(camera.light.xyz), normalize(vec3f(splat.lighting.xy, 1.0))));
  output.color = vec4f(splat.color.rgb * lightAmount * camera.viewportExposure.w, splat.centerOpacity.w);
  return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let weight = exp(-2.0 * dot(input.local, input.local));
  let alpha = input.color.a * weight;
  if (alpha < 0.002) { discard; }
  return vec4f(input.color.rgb * alpha, alpha);
}`;

interface SplatGpuDevice {
  createShaderModule(input: { code: string }): unknown;
  createRenderPipelineAsync(input: unknown): Promise<unknown>;
}

interface SplatGpuNavigator {
  gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<SplatGpuDevice> } | null> };
}

export async function compileGaussianSplatPipeline(format: GPUTextureFormat = 'bgra8unorm') {
  if (typeof navigator === 'undefined') return 'UNAVAILABLE' as const;
  const gpu = (navigator as Navigator & SplatGpuNavigator).gpu;
  if (!gpu) return 'UNAVAILABLE' as const;
  const adapter = await gpu.requestAdapter();
  if (!adapter) return 'UNAVAILABLE' as const;
  const device = await adapter.requestDevice();
  const module = device.createShaderModule({ code: GAUSSIAN_SPLAT_WGSL });
  await device.createRenderPipelineAsync({
    layout: 'auto',
    vertex: { module, entryPoint: 'vertexMain' },
    fragment: { module, entryPoint: 'fragmentMain', targets: [{ format, blend: { color: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }, alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
  });
  return 'COMPILED' as const;
}
