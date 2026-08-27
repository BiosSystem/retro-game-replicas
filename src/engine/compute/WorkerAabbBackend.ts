import type { AabbBatchResult } from './AabbKernel';

export class WorkerAabbBackend {
  private readonly worker: Worker; private nextId = 1; private readonly pending = new Map<number, { resolve(value: AabbBatchResult): void; reject(error: Error): void }>();
  constructor() { this.worker = new Worker(new URL('./ComputeWorker.ts', import.meta.url), { type: 'module', name: 'bios-compute' }); this.worker.onmessage = event => { const value = event.data as { id: number; tested: number; overlaps: number; durationMs: number }; const pending = this.pending.get(value.id); if (!pending) return; this.pending.delete(value.id); pending.resolve({ tested: value.tested, overlaps: value.overlaps, durationMs: value.durationMs, backend: 'WORKER' }); }; this.worker.onerror = event => { for (const pending of this.pending.values()) pending.reject(new Error(event.message || 'Compute worker failed')); this.pending.clear(); }; }
  count(pairs: Float32Array) { const id = this.nextId++; const copy = pairs.slice(); return new Promise<AabbBatchResult>((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.worker.postMessage({ id, buffer: copy.buffer }, [copy.buffer]); }); }
  destroy() { this.worker.terminate(); for (const pending of this.pending.values()) pending.reject(new Error('Compute worker stopped')); this.pending.clear(); }
}
