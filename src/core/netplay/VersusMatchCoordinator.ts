export type VersusPhase = 'COUNTDOWN' | 'PLAYING' | 'DISCONNECTED' | 'ROUND_OVER' | 'COMPLETE';
export class VersusMatchCoordinator {
  private phase: VersusPhase = 'COUNTDOWN'; private ticks = 180; private wins = [0, 0];
  tick() { if (this.phase === 'COUNTDOWN' && --this.ticks <= 0) this.phase = 'PLAYING'; return this.phase; }
  disconnect() { if (this.phase === 'PLAYING') { this.phase = 'DISCONNECTED'; this.ticks = 900; } }
  reconnect() { if (this.phase === 'DISCONNECTED') this.phase = 'PLAYING'; }
  forfeitWinner() { if (this.phase !== 'DISCONNECTED' || --this.ticks > 0) return null; return this.roundWinner(0); }
  roundWinner(player: 0 | 1) { this.wins[player]++; this.phase = this.wins[player] >= 2 ? 'COMPLETE' : 'ROUND_OVER'; return this.phase; }
  rematch() { if (this.phase === 'ROUND_OVER') { this.phase = 'COUNTDOWN'; this.ticks = 180; } }
  snapshot() { return { phase: this.phase, countdown: Math.ceil(this.ticks / 60), wins: [...this.wins] as [number, number] }; }
}
