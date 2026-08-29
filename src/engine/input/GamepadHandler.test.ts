import { describe, expect, it } from 'vitest';
import { GamepadButton, GamepadHandler, applyRadialDeadzone, identifyGamepadFamily } from './GamepadHandler';

function pad(options: { id?: string; mapping?: GamepadMappingType; axes?: number[]; pressed?: number[]; values?: Record<number, number>; index?: number } = {}) {
  const pressed = new Set(options.pressed ?? []);
  const buttons = Array.from({ length: 17 }, (_, index) => ({ pressed: pressed.has(index), touched: pressed.has(index), value: options.values?.[index] ?? (pressed.has(index) ? 1 : 0) }));
  return {
    axes: options.axes ?? [0, 0, 0, 0],
    buttons,
    connected: true,
    hapticActuators: [],
    id: options.id ?? 'Xbox Wireless Controller',
    index: options.index ?? 0,
    mapping: options.mapping ?? 'standard',
    timestamp: 10,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

describe('animation-frame gamepad handler', () => {
  it('normalizes standard Xbox and PlayStation layouts into one bitmask', () => {
    let active = pad({ pressed: [0, 9, 12], axes: [0.8, -0.6, 0.05, 0.04] });
    const handler = new GamepadHandler({ getGamepads: () => [active] });
    const xbox = handler.poll(1)[0];
    expect(xbox.family).toBe('XBOX');
    expect(xbox.buttons & GamepadButton.SOUTH).toBeTruthy();
    expect(xbox.buttons & GamepadButton.START).toBeTruthy();
    expect(xbox.buttons & GamepadButton.DPAD_UP).toBeTruthy();
    expect(Math.hypot(xbox.rightX, xbox.rightY)).toBe(0);
    active = pad({ id: 'Sony DualSense Wireless Controller', pressed: [0] });
    expect(handler.poll(2)[0]).toMatchObject({ family: 'PLAYSTATION', buttons: GamepadButton.SOUTH });
  });

  it('maps raw PlayStation face buttons and records press and release edges', () => {
    let active = pad({ id: 'DualShock 4', mapping: '', pressed: [1] });
    const handler = new GamepadHandler({ getGamepads: () => [active] });
    expect(handler.poll()[0]).toMatchObject({ buttons: GamepadButton.SOUTH, pressed: GamepadButton.SOUTH, released: 0 });
    active = pad({ id: 'DualShock 4', mapping: '', pressed: [0] });
    const next = handler.poll()[0];
    expect(next.buttons).toBe(GamepadButton.WEST);
    expect(next.pressed).toBe(GamepadButton.WEST);
    expect(next.released).toBe(GamepadButton.SOUTH);
  });

  it('rescales radial deadzones without changing stick direction', () => {
    expect(applyRadialDeadzone(0.1, 0.1, 0.2)).toEqual({ x: 0, y: 0 });
    const output = applyRadialDeadzone(0.6, 0.8, 0.2);
    expect(output.x).toBeCloseTo(0.6, 5);
    expect(output.y).toBeCloseTo(0.8, 5);
    expect(identifyGamepadFamily('USB joystick')).toBe('GENERIC');
  });

  it('drops disconnected pads and accepts analog trigger thresholds', () => {
    let pads: readonly (Gamepad | null)[] = [pad({ values: { 6: 0.75 }, index: 4 })];
    const handler = new GamepadHandler({ getGamepads: () => pads });
    expect(handler.poll()[0].buttons & GamepadButton.LEFT_TRIGGER).toBeTruthy();
    pads = [];
    expect(handler.poll()).toEqual([]);
    expect(handler.getFrame(4)).toBeUndefined();
  });

  it('applies persisted controller calibration and remapped fire buttons during polling', () => {
    const handler = new GamepadHandler({
      getGamepads: () => [pad({ axes: [0.12, 0, 0, 0], pressed: [5], values: { 6: 0.6 } })],
      getProfile: () => ({ deadzoneMode: 'SCALED_RADIAL', deadzone: 0.2, triggerThreshold: 0.7, bindings: { UP: [12], DOWN: [13], LEFT: [14], RIGHT: [15], FIRE: [5], COIN: [8], START: [9] } }),
    });
    const frame = handler.poll()[0];
    expect(frame.leftX).toBe(0);
    expect(frame.actions?.FIRE).toBe(true);
    expect(frame.buttons & GamepadButton.LEFT_TRIGGER).toBe(0);
  });
});
