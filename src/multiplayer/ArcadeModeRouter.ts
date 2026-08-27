import type { ArcadeMode } from './CoopSession';
import type { PlayerAction, PlayerId } from './MultiInput';

export class ArcadeModeRouter {
  private mode: ArcadeMode = 'SOLO';
  private nativeDualControl = false;
  private relayPlayer: PlayerId = 1;
  private relayStartedAt = 0;

  configure(mode: ArcadeMode, nativeDualControl: boolean, now = 0) {
    this.mode = mode;
    this.nativeDualControl = nativeDualControl;
    this.relayPlayer = 1;
    this.relayStartedAt = now;
  }

  tick(now: number) {
    if (this.mode !== 'VERSUS' || this.nativeDualControl) return false;
    const turns = Math.floor(Math.max(0, now - this.relayStartedAt) / 15000);
    const nextPlayer = turns % 2 === 0 ? 1 : 2;
    if (nextPlayer === this.relayPlayer) return false;
    this.relayPlayer = nextPlayer;
    return true;
  }

  primary(_action: PlayerAction, player1: boolean, player2: boolean) {
    if (this.nativeDualControl || this.mode === 'SOLO') return player1;
    if (this.mode === 'COOP') return player1 || player2;
    return this.relayPlayer === 1 ? player1 : player2;
  }

  getStatus() {
    return { mode: this.mode, nativeDualControl: this.nativeDualControl, relayPlayer: this.relayPlayer };
  }
}
