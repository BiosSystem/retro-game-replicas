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

  it('separates simultaneous claims from different signer identities', async () => {
    const firstKeys = await createSwarmIdentity();
    const secondKeys = await createSwarmIdentity();
    const gossip = new ScoreGossip();
    const first = await gossip.create('AAA', 'LabyrinthScene', 500, 'd'.repeat(64), firstKeys, 10);
    const second = await gossip.create('AAA', 'LabyrinthScene', 500, 'd'.repeat(64), secondKeys, 10);
    expect(first.id).not.toBe(second.id);
    expect(gossip.top()).toHaveLength(2);
  });

  it('relays the newest 256 logical clocks in deterministic order', async () => {
    const keys = await createSwarmIdentity();
    const gossip = new ScoreGossip();
    const stored = [];
    for (let clock = 257; clock >= 1; clock--) {
      stored.push(await gossip.create('AAA', 'LabyrinthScene', clock, 'e'.repeat(64), keys, clock));
    }
    const claims = gossip.envelope().claims;
    expect(claims).toHaveLength(256);
    expect(claims[0].clock).toBe(2);
    expect(claims.at(-1)?.clock).toBe(257);
    const hydrated = new ScoreGossip();
    expect(await hydrated.mergeStored(stored)).toBe(257);
    expect(hydrated.top(undefined, 100)).toHaveLength(100);
  }, 15000);
});
