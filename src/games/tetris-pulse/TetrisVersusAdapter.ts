import { garbageLinesForClear } from '../../core/netplay/VersusRules';
export interface TetrisOpponentView { board: Uint8Array; activeX: number; activeY: number; ghostY: number; garbageQueued: number; }
export class TetrisVersusAdapter {
  readonly opponent: TetrisOpponentView = { board: new Uint8Array(200), activeX: 3, activeY: 0, ghostY: 19, garbageQueued: 0 };
  queueAttack(clearedLines: number, bonus = 0) { const lines = Math.min(8, garbageLinesForClear(clearedLines) + Math.max(0, Math.floor(bonus))); this.opponent.garbageQueued += lines; return lines; }
  injectGarbage(hole: number) { if (!this.opponent.garbageQueued) return false; this.opponent.board.copyWithin(0, 10); this.opponent.board.fill(1, 190, 200); this.opponent.board[190 + Math.max(0, Math.min(9, hole))] = 0; this.opponent.garbageQueued--; return true; }
}
