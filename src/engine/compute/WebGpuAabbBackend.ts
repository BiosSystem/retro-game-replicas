import type { AabbBatchResult } from './AabbKernel';

export const AABB_WGSL = `
struct PairBuffer { values: array<f32> }
struct ResultBuffer { values: array<u32> }
@group(0) @binding(0) var<storage, read> pairs: PairBuffer;
@group(0) @binding(1) var<storage, read_write> results: ResultBuffer;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  if (index >= arrayLength(&results.values)) { return; }
  let offset = index * 8u;
  let overlap = pairs.values[offset] < pairs.values[offset + 6u] && pairs.values[offset + 2u] > pairs.values[offset + 4u] && pairs.values[offset + 1u] < pairs.values[offset + 7u] && pairs.values[offset + 3u] > pairs.values[offset + 5u];
  results.values[index] = select(0u, 1u, overlap);
}`;

interface GpuBuffer { mapAsync(mode: number): Promise<void>; getMappedRange(): ArrayBuffer; unmap(): void; destroy(): void; }
interface GpuDevice { createShaderModule(input: { code: string }): unknown; createComputePipelineAsync(input: unknown): Promise<{ getBindGroupLayout(index: number): unknown }>; createBuffer(input: { size: number; usage: number }): GpuBuffer; createBindGroup(input: unknown): unknown; createCommandEncoder(): { beginComputePass(): { setPipeline(pipeline: unknown): void; setBindGroup(index: number, group: unknown): void; dispatchWorkgroups(count: number): void; end(): void }; copyBufferToBuffer(source: GpuBuffer, sourceOffset: number, target: GpuBuffer, targetOffset: number, size: number): void; finish(): unknown }; queue: { writeBuffer(buffer: GpuBuffer, offset: number, data: ArrayBufferView): void; submit(commands: unknown[]): void }; }
interface GpuAdapter { requestDevice(): Promise<GpuDevice>; }
interface GpuNavigator { gpu?: { requestAdapter(): Promise<GpuAdapter | null> } }

export class WebGpuAabbBackend {
  private constructor(privateDevice: GpuDevice, privatePipeline: { getBindGroupLayout(index: number): unknown }) { this.device = privateDevice; this.pipeline = privatePipeline; }
  private readonly device: GpuDevice; private readonly pipeline: { getBindGroupLayout(index: number): unknown };
  static async create() { const gpu = (navigator as Navigator & GpuNavigator).gpu; if (!gpu) return null; const adapter = await gpu.requestAdapter(); if (!adapter) return null; const device = await adapter.requestDevice(); const module = device.createShaderModule({ code: AABB_WGSL }); const pipeline = await device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'main' } }); return new WebGpuAabbBackend(device, pipeline); }
  async count(pairs: Float32Array): Promise<AabbBatchResult> { if (pairs.length % 8 !== 0) throw new Error('AABB batch must contain eight values per pair'); const started = performance.now(); const tested = pairs.length / 8; if (!tested) return { tested: 0, overlaps: 0, backend: 'WEBGPU', durationMs: performance.now() - started }; const resultBytes = tested * 4; const input = this.device.createBuffer({ size: pairs.byteLength, usage: 128 | 8 }); const output = this.device.createBuffer({ size: resultBytes, usage: 128 | 4 }); const staging = this.device.createBuffer({ size: resultBytes, usage: 1 | 8 }); this.device.queue.writeBuffer(input, 0, pairs); const group = this.device.createBindGroup({ layout: this.pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: input } }, { binding: 1, resource: { buffer: output } }] }); const encoder = this.device.createCommandEncoder(); const pass = encoder.beginComputePass(); pass.setPipeline(this.pipeline); pass.setBindGroup(0, group); pass.dispatchWorkgroups(Math.ceil(tested / 64)); pass.end(); encoder.copyBufferToBuffer(output, 0, staging, 0, resultBytes); this.device.queue.submit([encoder.finish()]); await staging.mapAsync(1); const values = new Uint32Array(staging.getMappedRange().slice(0)); let overlaps = 0; for (let index = 0; index < tested; index++) overlaps += values[index]; staging.unmap(); input.destroy(); output.destroy(); staging.destroy(); return { tested, overlaps, backend: 'WEBGPU', durationMs: performance.now() - started }; }
}
