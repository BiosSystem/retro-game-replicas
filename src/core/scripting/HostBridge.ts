import type { NeonVmHost } from './vm/NeonBytecodeVM';

export interface ArcadeModHost {
  drawVectorPath(pathId: number, x: number, y: number, scale: number, color: number): void;
  playSynthNote(channel: number, patchId: number, note: number, volume: number): void;
  readInputBitmask(playerIndex: number): number;
  readTime(): number;
}

export class HostBridge implements NeonVmHost {
  private readonly host: ArcadeModHost;
  constructor(host: ArcadeModHost) { this.host = host; }

  drawVectorPath(pathId: number, x: number, y: number, scale: number, color: number) {
    this.host.drawVectorPath(clampInteger(pathId, 0, 65535), clampInteger(x, -8192, 8192), clampInteger(y, -8192, 8192), clampInteger(scale, 1, 4096), color >>> 0);
  }
  playSynthNote(channel: number, patchId: number, note: number, volume: number) {
    this.host.playSynthNote(clampInteger(channel, 0, 3), clampInteger(patchId, 0, 255), clampInteger(note, 0, 127), clampInteger(volume, 0, 255));
  }
  readInputBitmask(playerIndex: number) { return this.host.readInputBitmask(clampInteger(playerIndex, 0, 3)) >>> 0; }
  readTime() { return clampInteger(this.host.readTime(), 0, 0x7fffffff); }
}

function clampInteger(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? Math.trunc(value) : 0)); }
