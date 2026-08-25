export interface AabbBatchResult { tested: number; overlaps: number; backend: ComputeBackend; durationMs: number; }
export type ComputeBackend = 'WEBGPU' | 'WORKER' | 'WASM' | 'CPU';

export function countAabbOverlaps(pairs: Float32Array) {
  if (pairs.length % 8 !== 0) throw new Error('AABB batch must contain eight values per pair');
  let overlaps = 0; for (let offset = 0; offset < pairs.length; offset += 8) if (pairs[offset] < pairs[offset + 6] && pairs[offset + 2] > pairs[offset + 4] && pairs[offset + 1] < pairs[offset + 7] && pairs[offset + 3] > pairs[offset + 5]) overlaps++; return overlaps;
}

export function buildAabbStressBatch(count: number, seed = 0x434f4d50) { const safe = Math.max(0, Math.min(1_000_000, Math.floor(count))); const values = new Float32Array(safe * 8); let state = seed | 0 || 1; const random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; for (let index = 0; index < safe; index++) { const offset = index * 8; const ax = random() * 2000; const ay = random() * 2000; const bx = ax + (random() - 0.5) * 80; const by = ay + (random() - 0.5) * 80; values.set([ax, ay, ax + 24, ay + 24, bx, by, bx + 24, by + 24], offset); } return values; }
