import { describe, expect, it } from 'vitest';
import { GridCoordinator, localGridPeer } from './GridCoordinator';
import { decodeGridEnvelope, encodeGridEnvelope } from './GridProtocol';

describe('masterless grid coordinator', () => {
  it('distributes deterministic declarative shards', async () => {
    const grid = new GridCoordinator(); grid.addPeer(localGridPeer('peer-b')); grid.addPeer(localGridPeer('peer-a'));
    const result = await grid.execute('GRADIENT_SUM', [1, 2, 3, 4, 5, 6], 2);
    expect(result.value).toBe(21); expect(result.shards).toBe(3); expect(result.peers).toEqual(['peer-a', 'peer-b']);
  });
  it('recovers rejected shards after peer churn', async () => {
    const grid = new GridCoordinator();
    grid.addPeer({ id: 'peer-a', execute: async () => { throw new Error('peer left'); } });
    grid.addPeer(localGridPeer('peer-b'));
    const result = await grid.execute('GRADIENT_SUM', [2, 4, 6, 8], 2);
    expect(result.value).toBe(20); expect(result.retries).toBe(1); expect(grid.peerCount()).toBe(1);
  });
  it('falls back locally and rejects arbitrary protocol messages', async () => {
    const grid = new GridCoordinator(); expect((await grid.execute('GRADIENT_SUM', [3, 7])).value).toBe(10);
    expect(() => decodeGridEnvelope(new TextEncoder().encode('{"type":"EVAL","code":"alert(1)"}'))).toThrow('Unknown grid message');
    const envelope = { type: 'GRID_TASK' as const, task: { jobId: 'j', shardId: 0, kernel: 'GRADIENT_SUM' as const, values: [1] } };
    expect(decodeGridEnvelope(encodeGridEnvelope(envelope))).toEqual(envelope);
  });
});
