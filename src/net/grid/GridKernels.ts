export type GridKernel = 'GENETIC_FITNESS' | 'GRADIENT_SUM';

export interface GridShardTask {
  jobId: string;
  shardId: number;
  kernel: GridKernel;
  values: number[];
}

export interface GridShardResult {
  jobId: string;
  shardId: number;
  value: number;
}

export function executeGridKernel(task: GridShardTask): GridShardResult {
  if (task.values.length > 16_384) throw new Error('Grid shard exceeds 16,384 values');
  let value = 0;
  if (task.kernel === 'GRADIENT_SUM') value = task.values.reduce((sum, item) => sum + item, 0);
  else value = task.values.reduce((sum, item, index) => sum + Math.abs(item) / (1 + index), 0);
  if (!Number.isFinite(value)) throw new Error('Grid kernel produced a non-finite result');
  return { jobId: task.jobId, shardId: task.shardId, value };
}

export function reduceGridResults(kernel: GridKernel, results: GridShardResult[]): number {
  const ordered = [...results].sort((a, b) => a.shardId - b.shardId);
  if (kernel === 'GRADIENT_SUM') return ordered.reduce((sum, result) => sum + result.value, 0);
  return ordered.length ? ordered.reduce((sum, result) => sum + result.value, 0) / ordered.length : 0;
}
