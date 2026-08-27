import { GamepadButton, type GamepadFrame } from './GamepadHandler';

export interface GamepadMenuState {
  up: boolean;
  down: boolean;
  confirm: boolean;
  back: boolean;
}

export function readGamepadMenuInput(frames: readonly GamepadFrame[]): GamepadMenuState {
  const pad = frames[0];
  const buttons = pad?.buttons ?? 0;
  return {
    up: Boolean(buttons & GamepadButton.DPAD_UP) || (pad?.leftY ?? 0) < -0.5,
    down: Boolean(buttons & GamepadButton.DPAD_DOWN) || (pad?.leftY ?? 0) > 0.5,
    confirm: Boolean(buttons & GamepadButton.SOUTH),
    back: Boolean(buttons & (GamepadButton.EAST | GamepadButton.SELECT)),
  };
}
