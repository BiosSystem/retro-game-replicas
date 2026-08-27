import type { ScoreBoard } from '../../engine/ScoreLedger';
import type { ScoreClaim } from '../../net/swarm/ScoreGossip';

export type LeaderboardSource = 'ALL' | 'LOCAL' | 'PEER';

export interface RankedScore {
  game: string;
  difficulty: string;
  player: string;
  score: number;
  recordedAt: number;
  source: Exclude<LeaderboardSource, 'ALL'>;
  verified: boolean;
}

export interface LeaderboardFilter {
  game?: string;
  source?: LeaderboardSource;
  limit?: number;
}

export function rankScores(localBoards: ScoreBoard[], peerClaims: ScoreClaim[], filter: LeaderboardFilter = {}): RankedScore[] {
  const local = localBoards.flatMap(board => board.entries.map(entry => ({
    game: board.game,
    difficulty: board.difficulty,
    player: entry.name,
    score: entry.score,
    recordedAt: entry.recordedAt,
    source: 'LOCAL' as const,
    verified: true,
  })));
  const peers = peerClaims.map(claim => ({
    game: claim.game,
    difficulty: 'CONNECTED',
    player: claim.player,
    score: claim.score,
    recordedAt: claim.clock,
    source: 'PEER' as const,
    verified: true,
  }));
  const source = filter.source ?? 'ALL';
  const limit = Math.max(1, Math.min(100, Math.floor(filter.limit ?? 50)));
  return [...local, ...peers]
    .filter(entry => (!filter.game || entry.game === filter.game) && (source === 'ALL' || entry.source === source))
    .sort((a, b) => b.score - a.score || a.recordedAt - b.recordedAt || a.player.localeCompare(b.player))
    .slice(0, limit);
}

export function leaderboardGames(localBoards: ScoreBoard[], peerClaims: ScoreClaim[]): string[] {
  return [...new Set([...localBoards.map(board => board.game), ...peerClaims.map(claim => claim.game)])].sort();
}
