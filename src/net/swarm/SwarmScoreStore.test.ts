import { describe, expect, it } from 'vitest';
import { MAX_PERSISTED_SCORE_CLAIMS } from './SwarmScoreStore';

describe('swarm score persistence', () => {
  it('publishes the documented bounded retention contract', () => {
    expect(MAX_PERSISTED_SCORE_CLAIMS).toBe(4096);
  });
});
