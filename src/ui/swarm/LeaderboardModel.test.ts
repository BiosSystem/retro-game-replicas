import { describe, expect, it } from 'vitest';
import type { ScoreClaim } from '../../net/swarm/ScoreGossip';
import { leaderboardGames, rankScores } from './LeaderboardModel';

const peer = (game: string, player: string, score: number, clock: number): ScoreClaim => ({
  version: 1, id: `${game}-${clock}`, player, game, score, clock,
  replayHash: 'a'.repeat(64), publicKey: 'verified-upstream', signature: 'verified-upstream',
});

describe('leaderboard projection', () => {
  const boards = [
    { game: 'RunnerScene', difficulty: 'NORMAL', entries: [{ name: 'ACE', score: 900, recordedAt: 3 }] },
    { game: 'TetrisScene', difficulty: 'HARD', entries: [{ name: 'BEE', score: 1200, recordedAt: 2 }] },
  ];
  const peers = [peer('RunnerScene', 'NET', 1400, 4)];

  it('merges local and verified peer scores into deterministic rank order', () => {
    expect(rankScores(boards, peers).map(entry => [entry.player, entry.score, entry.source])).toEqual([
      ['NET', 1400, 'PEER'], ['BEE', 1200, 'LOCAL'], ['ACE', 900, 'LOCAL'],
    ]);
  });

  it('filters by game and source without changing stored boards', () => {
    expect(rankScores(boards, peers, { game: 'RunnerScene', source: 'LOCAL' })).toHaveLength(1);
    expect(leaderboardGames(boards, peers)).toEqual(['RunnerScene', 'TetrisScene']);
    expect(boards[0].entries).toHaveLength(1);
  });
});
