import { describe, expect, it } from 'vitest';
import { SpriteStateMachine } from './SpriteStateMachine';

const states = {
  idle: { frames: ['idle'], frameRate: 1, hitbox: { width: 10, height: 20, offsetX: 1, offsetY: 2 } },
  run: { frames: ['run-1', 'run-2'], frameRate: 10, hitbox: { width: 12, height: 18, offsetX: 0, offsetY: 2 }, emitOnEnter: 'dust' },
};

describe('SpriteStateMachine', () => {
  it('advances frames deterministically and clamps long frame gaps', () => {
    const machine = new SpriteStateMachine(states, 'idle');
    machine.setState('run', 'LEFT');
    expect(machine.update(0)).toMatchObject({ frame: 'run-1', facing: 'LEFT', event: 'dust' });
    expect(machine.update(100).frame).toBe('run-2');
    expect(machine.update(10_000).frame).toBe('run-2');
  });

  it('rejects unknown states', () => expect(() => new SpriteStateMachine(states, 'missing')).toThrow());
});
