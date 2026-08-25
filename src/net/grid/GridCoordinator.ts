import { executeGridKernel, reduceGridResults, type GridKernel, type GridShardResult, type GridShardTask } from './GridKernels';

export interface GridPeer {
  id: string;
  execute(task: GridShardTask): Promise<GridShardResult>;
}

export interface GridRunResult {
  jobId: string;
  value: number;
  shards: number;
  retries: number;
  peers: string[];
}

const MAX_JOB_VALUES = 131_072;

export class GridCoordinator {
  private readonly peers = new Map<string, GridPeer>();
  private sequence = 0;

  addPeer(peer: GridPeer): void { this.peers.set(peer.id, peer); }
  removePeer(id: string): void { this.peers.delete(id); }
  peerCount(): number { return this.peers.size; }

  async execute(kernel: GridKernel, values: readonly number[], shardSize = 2048): Promise<GridRunResult> {
    if (values.length === 0 || values.length > MAX_JOB_VALUES) throw new Error('Grid job size is outside the safe range');
    if (!Number.isInteger(shardSize) || shardSize < 1 || shardSize > 16_384) throw new Error('Invalid grid shard size');
    if (!values.every(Number.isFinite)) throw new Error('Grid jobs require finite numeric values');
    const jobId = `grid-${++this.sequence}-${values.length}`;
    const pending: GridShardTask[] = [];
    for (let offset = 0, shardId = 0; offset < values.length; offset += shardSize, shardId++) {
      pending.push({ jobId, shardId, kernel, values: values.slice(offset, offset + shardSize) });
    }
    const totalShards = pending.length;
    const results: GridShardResult[] = [];
    const used = new Set<string>();
    let retries = 0;
    while (pending.length) {
      const available = [...this.peers.values()].sort((a, b) => a.id.localeCompare(b.id));
      if (available.length === 0) {
        results.push(...pending.splice(0).map(executeGridKernel));
        used.add('local-fallback');
        break;
      }
      const batch = pending.splice(0, available.length);
      const settled = await Promise.allSettled(batch.map((task, index) => {
        const peer = available[index % available.length] as GridPeer;
        used.add(peer.id);
        return peer.execute(task);
      }));
      settled.forEach((result, index) => {
        const task = batch[index] as GridShardTask;
        if (result.status === 'fulfilled' && result.value.jobId === jobId && result.value.shardId === task.shardId && Number.isFinite(result.value.value)) results.push(result.value);
        else { pending.push(task); retries++; const peer = available[index % available.length]; if (peer) this.peers.delete(peer.id); }
      });
    }
    return { jobId, value: reduceGridResults(kernel, results), shards: totalShards, retries, peers: [...used] };
  }
}

export function localGridPeer(id: string): GridPeer {
  return { id, execute: async task => executeGridKernel(task) };
}
