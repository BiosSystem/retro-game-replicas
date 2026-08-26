import { clampFrameDelta } from './GameLoop';

type FrameCallback = (time: number, delta: number) => void;

interface TimeStepPort {
  callback: FrameCallback;
  started: boolean;
}

interface GamePort {
  loop: TimeStepPort;
  events: {
    once(event: string, callback: () => void): unknown;
  };
}

export interface DeltaGuardSnapshot {
  installed: boolean;
  maximumDeltaMs: number;
  clampedFrames: number;
  largestDeltaMs: number;
}

export class PhaserDeltaGuard {
  private readonly loop: TimeStepPort;
  private originalCallback: FrameCallback | null = null;
  private installed = false;
  private destroyed = false;
  private clampedFrames = 0;
  private largestDeltaMs = 0;
  private readonly wrappedCallback: FrameCallback;

  readonly maximumDeltaMs: number;

  constructor(loop: TimeStepPort, maximumDeltaMs = 50) {
    this.loop = loop;
    this.maximumDeltaMs = normalizeMaximum(maximumDeltaMs);
    this.wrappedCallback = (time, delta) => {
      const boundedDelta = clampFrameDelta(delta, this.maximumDeltaMs);
      this.largestDeltaMs = Math.max(this.largestDeltaMs, Number.isFinite(delta) ? delta : 0);
      if (boundedDelta !== delta) this.clampedFrames += 1;
      this.originalCallback?.(time, boundedDelta);
    };
  }

  install() {
    if (this.installed || this.destroyed) return false;
    this.originalCallback = this.loop.callback;
    this.loop.callback = this.wrappedCallback;
    this.installed = true;
    return true;
  }

  destroy() {
    this.destroyed = true;
    if (this.installed && this.originalCallback && this.loop.callback === this.wrappedCallback) {
      this.loop.callback = this.originalCallback;
    }
    this.originalCallback = null;
    this.installed = false;
  }

  snapshot(): DeltaGuardSnapshot {
    return {
      installed: this.installed,
      maximumDeltaMs: this.maximumDeltaMs,
      clampedFrames: this.clampedFrames,
      largestDeltaMs: this.largestDeltaMs,
    };
  }
}

export function installPhaserDeltaGuard(game: GamePort, maximumDeltaMs = 50) {
  const guard = new PhaserDeltaGuard(game.loop, maximumDeltaMs);
  if (game.loop.started) {
    guard.install();
  } else {
    game.events.once('ready', () => queueMicrotask(() => guard.install()));
  }
  return guard;
}

function normalizeMaximum(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(1, Math.min(250, value));
}
