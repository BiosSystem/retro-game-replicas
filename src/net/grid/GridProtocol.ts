import type { GridShardResult, GridShardTask } from './GridKernels';

export type GridEnvelope = { type: 'GRID_TASK'; task: GridShardTask } | { type: 'GRID_RESULT'; result: GridShardResult };

export function encodeGridEnvelope(envelope: GridEnvelope): Uint8Array {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope));
  if (bytes.length > 1_048_576) throw new Error('Grid envelope exceeds transport limit');
  return bytes;
}

export function decodeGridEnvelope(bytes: Uint8Array): GridEnvelope {
  if (bytes.length > 1_048_576) throw new Error('Grid envelope exceeds transport limit');
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== 'object' || !('type' in value)) throw new Error('Invalid grid envelope');
  const envelope = value as GridEnvelope;
  if (envelope.type !== 'GRID_TASK' && envelope.type !== 'GRID_RESULT') throw new Error('Unknown grid message');
  return envelope;
}
