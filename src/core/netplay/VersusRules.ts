export function garbageLinesForClear(lines: number): number { const clear = Math.max(0, Math.floor(lines)); return clear < 2 ? 0 : clear === 2 ? 1 : clear === 3 ? 2 : 4; }

export class ReconnectForfeitClock {
  private remainingTicks = 0;
  disconnect() { this.remainingTicks = 60 * 15; }
  reconnect() { this.remainingTicks = 0; }
  tick(): boolean { if (!this.remainingTicks) return false; this.remainingTicks--; return this.remainingTicks === 0; }
  secondsRemaining() { return Math.ceil(this.remainingTicks / 60); }
}

export class VersusHashExchange {
  private remoteHash = 0;
  shouldSend(frame: number) { return frame > 0 && frame % 60 === 0; }
  receive(hash: number) { this.remoteHash = hash >>> 0; }
  diverged(localHash: number) { return this.remoteHash !== 0 && this.remoteHash !== (localHash >>> 0); }
}
