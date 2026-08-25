export const PROJECTILE_WORKGROUP_SIZE = 64;
export const PROJECTILE_WGSL = `
struct Projectile { position: vec2f, velocity: vec2f, life: f32, kind: u32 }
struct Params { delta: f32, count: u32, target: vec2f }
@group(0) @binding(0) var<storage, read_write> projectiles: array<Projectile>;
@group(0) @binding(1) var<uniform> params: Params;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= params.count || projectiles[i].life <= 0.0) { return; }
  var p = projectiles[i];
  if (p.kind == 2u) {
    let desired = normalize(params.target - p.position) * length(p.velocity);
    p.velocity = mix(p.velocity, desired, min(1.0, params.delta * 2.4));
  }
  p.position += p.velocity * params.delta;
  p.life -= params.delta;
  projectiles[i] = p;
}`;
export function projectileDispatchSize(count: number) { return Math.ceil(Math.max(0, Math.min(100_000, Math.floor(Number.isFinite(count) ? count : 0))) / PROJECTILE_WORKGROUP_SIZE); }
export function canUseProjectileWebGpu() { return typeof navigator !== 'undefined' && 'gpu' in navigator; }

interface GpuBuffer { mapAsync(mode: number): Promise<void>; getMappedRange(): ArrayBuffer; unmap(): void; destroy(): void; }
interface GpuPipeline { getBindGroupLayout(index: number): unknown; }
interface GpuDevice { createShaderModule(input: { code: string }): unknown; createComputePipelineAsync(input: unknown): Promise<GpuPipeline>; createBuffer(input: { size: number; usage: number }): GpuBuffer; createBindGroup(input: unknown): unknown; createCommandEncoder(): { beginComputePass(): { setPipeline(pipeline: unknown): void; setBindGroup(index: number, group: unknown): void; dispatchWorkgroups(count: number): void; end(): void }; copyBufferToBuffer(source: GpuBuffer, sourceOffset: number, target: GpuBuffer, targetOffset: number, size: number): void; finish(): unknown }; queue: { writeBuffer(buffer: GpuBuffer, offset: number, data: ArrayBufferView): void; submit(commands: unknown[]): void }; }
interface GpuNavigator { gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<GpuDevice> } | null> } }
export class WebGpuProjectileBackend {
  private readonly device: GpuDevice; private readonly pipeline: GpuPipeline;
  private constructor(device: GpuDevice, pipeline: GpuPipeline) { this.device = device; this.pipeline = pipeline; }
  static async create() { const gpu = (navigator as Navigator & GpuNavigator).gpu; if (!gpu) return null; const adapter = await gpu.requestAdapter(); if (!adapter) return null; const device = await adapter.requestDevice(), module = device.createShaderModule({ code: PROJECTILE_WGSL }), pipeline = await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'main' } }); return new WebGpuProjectileBackend(device, pipeline); }
  async step(projectiles: Float32Array, delta: number, targetX: number, targetY: number) { if (projectiles.length % 6 !== 0 || projectiles.length / 6 > 100_000) throw new Error('Projectile buffer must contain at most 100,000 six-value records'); const count = projectiles.length / 6; if (!count) return new Float32Array(); const bytes = projectiles.byteLength, storage = this.device.createBuffer({ size: bytes, usage: 128 | 4 | 8 }), params = this.device.createBuffer({ size: 16, usage: 64 | 8 }), staging = this.device.createBuffer({ size: bytes, usage: 1 | 8 }); const paramData = new ArrayBuffer(16), floats = new Float32Array(paramData), integers = new Uint32Array(paramData); floats[0] = Math.max(0, Math.min(.05, Number.isFinite(delta) ? delta : 0)); integers[1] = count; floats[2] = Number.isFinite(targetX) ? targetX : 0; floats[3] = Number.isFinite(targetY) ? targetY : 0; this.device.queue.writeBuffer(storage, 0, projectiles); this.device.queue.writeBuffer(params, 0, new Uint8Array(paramData)); const group = this.device.createBindGroup({ layout: this.pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: storage } }, { binding: 1, resource: { buffer: params } }] }), encoder = this.device.createCommandEncoder(), pass = encoder.beginComputePass(); pass.setPipeline(this.pipeline); pass.setBindGroup(0, group); pass.dispatchWorkgroups(projectileDispatchSize(count)); pass.end(); encoder.copyBufferToBuffer(storage, 0, staging, 0, bytes); this.device.queue.submit([encoder.finish()]); await staging.mapAsync(1); const result = new Float32Array(staging.getMappedRange().slice(0)); staging.unmap(); storage.destroy(); params.destroy(); staging.destroy(); return result; }
}
