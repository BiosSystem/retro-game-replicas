import { describe, expect, it, vi } from 'vitest';
import { installPhaserDeltaGuard, PhaserDeltaGuard } from './PhaserDeltaGuard';

describe('Phaser runtime delta guard', () => {
  it('preserves high-refresh deltas and caps long frame gaps', () => {
    const callback = vi.fn();
    const loop = { callback, started: true };
    const guard = new PhaserDeltaGuard(loop);

    expect(guard.install()).toBe(true);
    loop.callback(10, 8.3333);
    loop.callback(20, 6.9444);
    loop.callback(30, 180);
    loop.callback(40, Number.NaN);

    expect(callback.mock.calls.map(call => call[1])).toEqual([8.3333, 6.9444, 50, 0]);
    expect(guard.snapshot()).toEqual({
      installed: true,
      maximumDeltaMs: 50,
      clampedFrames: 2,
      largestDeltaMs: 180,
    });
  });

  it('restores the original Phaser callback on destroy', () => {
    const callback = vi.fn();
    const loop = { callback, started: true };
    const guard = new PhaserDeltaGuard(loop, 40);

    guard.install();
    guard.destroy();
    loop.callback(10, 100);

    expect(loop.callback).toBe(callback);
    expect(callback).toHaveBeenCalledWith(10, 100);
    expect(guard.snapshot().installed).toBe(false);
  });

  it('installs after Phaser binds its callback on the ready tick', async () => {
    const initialCallback = vi.fn();
    const boundCallback = vi.fn();
    const loop = { callback: initialCallback, started: false };
    let readyCallback: (() => void) | undefined;
    const game = {
      loop,
      events: { once: vi.fn((_event: string, callback: () => void) => { readyCallback = callback; }) },
    };

    const guard = installPhaserDeltaGuard(game);
    loop.callback = boundCallback;
    loop.started = true;
    readyCallback?.();
    await new Promise<void>(resolve => queueMicrotask(resolve));
    loop.callback(100, 90);

    expect(initialCallback).not.toHaveBeenCalled();
    expect(boundCallback).toHaveBeenCalledWith(100, 50);
    expect(guard.snapshot().installed).toBe(true);
  });
});
