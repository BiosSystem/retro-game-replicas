import { bench, describe } from 'vitest';
import { GamepadHandler } from './GamepadHandler';

const gamepad = { axes: [0.4, -0.8, 0.1, 0], buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: index === 0, touched: index === 0, value: index === 0 ? 1 : 0 })), connected: true, id: 'Xbox Controller', index: 0, mapping: 'standard', timestamp: 1 } as unknown as Gamepad;
const handler = new GamepadHandler({ getGamepads: () => [gamepad] });

describe('gamepad frame polling', () => {
  bench('poll one standard controller frame', () => { handler.poll(1); }, { time: 500 });
});
