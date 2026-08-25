import { countAabbOverlaps } from './AabbKernel';

self.onmessage = (event: MessageEvent<{ id: number; buffer: ArrayBuffer }>) => { const started = performance.now(); const pairs = new Float32Array(event.data.buffer); const overlaps = countAabbOverlaps(pairs); self.postMessage({ id: event.data.id, tested: pairs.length / 8, overlaps, durationMs: performance.now() - started }); };
