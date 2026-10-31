import { describe, expect, it } from 'vitest';
import { installPhaserKeyboardQueueGuard, PhaserKeyboardQueueGuard } from './PhaserKeyboardQueueGuard';

interface FakeKey { type: string; key: string; timeStamp: number }

// Mirrors Phaser 4's KeyboardManager + KeyboardPlugin: queue on arrival, replay the whole
// queue, skip only an exact repeat of the previous event, clear the queue once per frame.
function fakePhaser() {
  const target = new EventTarget();
  const keyboard = { queue: [] as FakeKey[], target: target as EventTarget | null };
  const delivered: string[] = [];
  let prev: FakeKey | null = null;
  const process = () => {
    for (const event of keyboard.queue) {
      if (prev && event.key === prev.key && event.timeStamp === prev.timeStamp && event.type === prev.type) continue;
      prev = event;
      if (event.type === 'keydown') delivered.push(event.key);
    }
  };
  for (const type of ['keydown', 'keyup']) target.addEventListener(type, event => { const detail = (event as CustomEvent<FakeKey>).detail; keyboard.queue.push(detail); process(); });
  const press = (key: string, timeStamp: number) => {
    for (const type of ['keydown', 'keyup']) target.dispatchEvent(new CustomEvent(type, { detail: { type, key, timeStamp: timeStamp + (type === 'keyup' ? 1 : 0) } }));
  };
  return { keyboard, delivered, press, endFrame: () => { keyboard.queue.length = 0; } };
}

describe('Phaser keyboard queue guard', () => {
  it('reproduces the replay when several presses land in one frame', () => {
    const phaser = fakePhaser();
    phaser.press('x', 10); phaser.press(' ', 20);
    expect(phaser.delivered.filter(key => key === ' ').length).toBeGreaterThan(1);
  });

  it('delivers each press once within a slow frame', () => {
    const phaser = fakePhaser();
    const guard = new PhaserKeyboardQueueGuard(phaser.keyboard);
    expect(guard.install()).toBe(true);
    phaser.press('z', 10); phaser.press('s', 20); phaser.press('x', 30); phaser.press(' ', 40);
    expect(phaser.delivered).toEqual(['z', 's', 'x', ' ']);
    expect(phaser.keyboard.queue).toHaveLength(0);
    expect(guard.snapshot()).toEqual({ installed: true, clearedEvents: 8 });
  });

  it('leaves frame-by-frame input unchanged', () => {
    const phaser = fakePhaser();
    new PhaserKeyboardQueueGuard(phaser.keyboard).install();
    phaser.press('z', 10); phaser.endFrame(); phaser.press(' ', 20); phaser.endFrame();
    expect(phaser.delivered).toEqual(['z', ' ']);
  });

  it('stops clearing after destroy', () => {
    const phaser = fakePhaser();
    const guard = new PhaserKeyboardQueueGuard(phaser.keyboard);
    guard.install(); guard.destroy();
    phaser.press('x', 10); phaser.press(' ', 20);
    expect(phaser.delivered.filter(key => key === ' ').length).toBeGreaterThan(1);
    expect(guard.snapshot().installed).toBe(false);
  });

  it('waits for the game to boot before installing', () => {
    const phaser = fakePhaser();
    let ready: (() => void) | undefined;
    const game = { isBooted: false, input: { keyboard: phaser.keyboard }, events: { once: (_event: string, callback: () => void) => { ready = callback; } } };
    const handle = installPhaserKeyboardQueueGuard(game);
    expect(handle.snapshot().installed).toBe(false);
    ready?.();
    expect(handle.snapshot().installed).toBe(true);
  });

  it('does nothing when keyboard input is disabled', () => {
    const handle = installPhaserKeyboardQueueGuard({ isBooted: true, input: { keyboard: null }, events: { once: () => undefined } });
    expect(handle.snapshot()).toEqual({ installed: false, clearedEvents: 0 });
  });
});
