import { describe, expect, it } from 'vitest';
import { CoopSession } from './CoopSession';
import { MultiInput, separatePlayers } from './MultiInput';
import { ArcadeModeRouter } from './ArcadeModeRouter';

describe('local multiplayer engine', () => {
  it('splits keyboard controls and hot-plugs two gamepads by stable index', () => {
    const input = new MultiInput(); input.setKey('KeyW', true); input.setKey('Enter', true);
    const state = input.poll([{ index: 3, connected: true, axes: [0.8, 0], buttons: [] }, { index: 1, connected: true, axes: [0, 0], buttons: [true] }]);
    expect(state[1]).toMatchObject({ UP: true, FIRE: true });
    expect(state[2]).toMatchObject({ RIGHT: true, FIRE: true });
    expect(input.getPadSlots()).toEqual({ 1: 1, 2: 3 });
  });

  it('reassigns a remaining gamepad after disconnect', () => {
    const input = new MultiInput();
    input.poll([{ index: 0, connected: true, axes: [], buttons: [] }, { index: 2, connected: true, axes: [], buttons: [] }]);
    input.poll([{ index: 2, connected: true, axes: [], buttons: [] }]);
    expect(input.getPadSlots()).toEqual({ 1: 2 });
  });

  it('separates colliding players on the minimum penetration axis', () => {
    const result = separatePlayers({ x: 0, y: 0, width: 20, height: 20 }, { x: 15, y: 2, width: 20, height: 20 });
    expect(result).toEqual({ ax: -2.5, ay: 0, bx: 2.5, by: 0 });
  });

  it('awards alternating cooperative combo multipliers and separate lives', () => {
    const session = new CoopSession('COOP');
    expect(session.score(1, 100, 1000)).toBe(100);
    expect(session.score(2, 100, 1500)).toBe(200);
    session.loseLife(1);
    expect(session.snapshot()).toMatchObject({ multiplier: 2, lives: { 1: 2, 2: 3 } });
  });

  it('routes shared co-op controls and timed versus relay turns', () => {
    const router = new ArcadeModeRouter();
    router.configure('COOP', false, 0);
    expect(router.primary('FIRE', false, true)).toBe(true);
    router.configure('VERSUS', false, 0);
    expect(router.primary('LEFT', true, false)).toBe(true);
    router.tick(15000);
    expect(router.primary('LEFT', true, false)).toBe(false);
    expect(router.primary('LEFT', false, true)).toBe(true);
    expect(router.getStatus().relayPlayer).toBe(2);
  });
});
