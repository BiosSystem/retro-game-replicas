import { describe, expect, it } from 'vitest';
import { createSwarmIdentity, ScoreGossip } from './ScoreGossip';

describe('score gossip', () => {
  it('converges signed claims independent of order', async () => {
    const keys = await createSwarmIdentity();
    const source = new ScoreGossip();
    const receiver = new ScoreGossip();
    const first = await source.create('AAA', 'LabyrinthScene', 900, 'a'.repeat(64), keys, 1);
    const second = await source.create('BBB', 'LabyrinthScene', 1200, 'b'.repeat(64), keys, 2);
    expect(await receiver.merge({ type: 'SCORE_GOSSIP', claims: [second, first] })).toBe(2);
    expect(receiver.top()[0].score).toBe(1200);
    expect(await source.merge(receiver.envelope())).toBe(0);
  });

  it('returns the exact newly verified claims independently of rank', async () => {
    const keys = await createSwarmIdentity();
    const source = new ScoreGossip();
    const receiver = new ScoreGossip();
    const high = await source.create('TOP', 'LabyrinthScene', 9000, 'a'.repeat(64), keys, 1);
    const low = await source.create('LOW', 'LabyrinthScene', 10, 'b'.repeat(64), keys, 2);
    await receiver.merge({ type: 'SCORE_GOSSIP', claims: [high] });
    expect(await receiver.mergeClaims({ type: 'SCORE_GOSSIP', claims: [low] })).toEqual([low]);
    expect(receiver.top(undefined, 1)).toEqual([high]);
  });

  it('rejects modified scores', async () => {
    const keys = await createSwarmIdentity();
    const source = new ScoreGossip();
    const receiver = new ScoreGossip();
    const claim = await source.create('AAA', 'LabyrinthScene', 100, 'c'.repeat(64), keys, 1);
    claim.score = 999;
    expect(await receiver.merge({ type: 'SCORE_GOSSIP', claims: [claim] })).toBe(0);
  });
});
