import { countAabbOverlaps, type AabbBatchResult, type ComputeBackend } from './AabbKernel';
import { initializeWasmProbe } from './WasmProbe';
import { WebGpuAabbBackend } from './WebGpuAabbBackend';
import { WorkerAabbBackend } from './WorkerAabbBackend';

export class ComputePipeline {
  private gpu: WebGpuAabbBackend | null = null; private worker: WorkerAabbBackend | null = null; private backend: ComputeBackend = 'CPU';
  async initialize() { try { this.gpu = await WebGpuAabbBackend.create(); if (this.gpu) { this.backend = 'WEBGPU'; return this.backend; } } catch { this.gpu = null; } if (typeof Worker !== 'undefined') { try { this.worker = new WorkerAabbBackend(); this.backend = 'WORKER'; return this.backend; } catch { this.worker = null; } } if (await initializeWasmProbe()) this.backend = 'WASM'; return this.backend; }
  async countAabb(pairs: Float32Array): Promise<AabbBatchResult> { if (this.gpu) return this.gpu.count(pairs); if (this.worker) return this.worker.count(pairs); const started = performance.now(); const overlaps = countAabbOverlaps(pairs); return { tested: pairs.length / 8, overlaps, backend: this.backend, durationMs: performance.now() - started }; }
  countAabbSync(pairs: Float32Array) { return countAabbOverlaps(pairs); }
  getBackend() { return this.backend; }
  destroy() { this.worker?.destroy(); this.worker = null; }
}

export const arcadeCompute = new ComputePipeline();
