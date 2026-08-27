import { describe, expect, it } from 'vitest';
import { GamepadButton, type GamepadFrame } from './GamepadHandler';
import { readGamepadMenuInput } from './GamepadMenuInput';

function frame(buttons = 0, leftX = 0, leftY = 0): GamepadFrame {
  return { index: 0, id: 'Xbox Wireless Controller', family: 'XBOX', connected: true, timestamp: 0, buttons, pressed: 0, released: 0, leftX, leftY, rightX: 0, rightY: 0, leftTrigger: 0, rightTrigger: 0 };
}

describe('gamepad menu input', () => {
  it('maps normalized d-pad, stick, confirm, and back controls without conflating face buttons', () => {
    expect(readGamepadMenuInput([frame(GamepadButton.DPAD_UP | GamepadButton.SOUTH)])).toEqual({ up: true, down: false, left: false, right: false, confirm: true, back: false });
    expect(readGamepadMenuInput([frame(GamepadButton.EAST | GamepadButton.SELECT, 0.8, 0.8)])).toEqual({ up: false, down: true, left: false, right: true, confirm: false, back: true });
  });

  it('returns an idle state with no connected controller frame', () => {
    expect(readGamepadMenuInput([])).toEqual({ up: false, down: false, left: false, right: false, confirm: false, back: false });
  });
});
