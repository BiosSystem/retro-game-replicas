export const GamepadButton = {
  SOUTH: 1 << 0,
  EAST: 1 << 1,
  WEST: 1 << 2,
  NORTH: 1 << 3,
  LEFT_BUMPER: 1 << 4,
  RIGHT_BUMPER: 1 << 5,
  LEFT_TRIGGER: 1 << 6,
  RIGHT_TRIGGER: 1 << 7,
  SELECT: 1 << 8,
  START: 1 << 9,
  LEFT_STICK: 1 << 10,
  RIGHT_STICK: 1 << 11,
  DPAD_UP: 1 << 12,
  DPAD_DOWN: 1 << 13,
  DPAD_LEFT: 1 << 14,
  DPAD_RIGHT: 1 << 15,
  HOME: 1 << 16,
} as const;

export type GamepadFamily = 'PLAYSTATION' | 'XBOX' | 'GENERIC';

export interface GamepadFrame {
  index: number;
  id: string;
  family: GamepadFamily;
  connected: boolean;
  timestamp: number;
  buttons: number;
  pressed: number;
  released: number;
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  leftTrigger: number;
  rightTrigger: number;
}

export interface GamepadHandlerOptions {
  deadzone?: number;
  buttonThreshold?: number;
  getGamepads?: () => readonly (Gamepad | null)[];
}

const STANDARD_BUTTONS = Array.from({ length: 17 }, (_, index) => index);
const PLAYSTATION_RAW_BUTTONS = [1, 2, 0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

export function identifyGamepadFamily(id: string): GamepadFamily {
  const normalized = id.toLowerCase();
  if (/playstation|dualshock|dualsense|sony/.test(normalized)) return 'PLAYSTATION';
  if (/xbox|xinput|microsoft/.test(normalized)) return 'XBOX';
  return 'GENERIC';
}

export function applyRadialDeadzone(x: number, y: number, deadzone = 0.16) {
  const boundedX = clampAxis(x);
  const boundedY = clampAxis(y);
  const magnitude = Math.min(1, Math.hypot(boundedX, boundedY));
  if (magnitude <= deadzone) return { x: 0, y: 0 };
  const scaled = (magnitude - deadzone) / (1 - deadzone);
  return { x: boundedX / magnitude * scaled, y: boundedY / magnitude * scaled };
}

export class GamepadHandler {
  private readonly deadzone: number;
  private readonly buttonThreshold: number;
  private readonly provider: () => readonly (Gamepad | null)[];
  private readonly frames = new Map<number, GamepadFrame>();
  private frameList: readonly GamepadFrame[] = [];

  constructor(options: GamepadHandlerOptions = {}) {
    this.deadzone = clamp(options.deadzone ?? 0.16, 0, 0.75);
    this.buttonThreshold = clamp(options.buttonThreshold ?? 0.5, 0.01, 1);
    this.provider = options.getGamepads ?? (() => typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []);
  }

  poll(frameTime = now()) {
    const pads = this.provider();
    const seen = new Set<number>();
    const next: GamepadFrame[] = [];
    for (const pad of pads) {
      if (!pad?.connected) continue;
      seen.add(pad.index);
      const family = identifyGamepadFamily(pad.id);
      const mapping = pad.mapping === 'standard' || family !== 'PLAYSTATION' ? STANDARD_BUTTONS : PLAYSTATION_RAW_BUTTONS;
      let buttons = 0;
      for (let canonical = 0; canonical < mapping.length; canonical++) {
        const button = pad.buttons[mapping[canonical]];
        if (button && (button.pressed || button.value >= this.buttonThreshold)) buttons |= 1 << canonical;
      }
      const previous = this.frames.get(pad.index)?.buttons ?? 0;
      const left = applyRadialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0, this.deadzone);
      const right = applyRadialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, this.deadzone);
      const frame: GamepadFrame = {
        index: pad.index,
        id: pad.id,
        family,
        connected: true,
        timestamp: Number.isFinite(pad.timestamp) && pad.timestamp > 0 ? pad.timestamp : frameTime,
        buttons,
        pressed: buttons & ~previous,
        released: previous & ~buttons,
        leftX: left.x,
        leftY: left.y,
        rightX: right.x,
        rightY: right.y,
        leftTrigger: clamp(pad.buttons[mapping[6]]?.value ?? 0, 0, 1),
        rightTrigger: clamp(pad.buttons[mapping[7]]?.value ?? 0, 0, 1),
      };
      this.frames.set(pad.index, frame);
      next.push(frame);
    }
    for (const index of this.frames.keys()) if (!seen.has(index)) this.frames.delete(index);
    next.sort((a, b) => a.index - b.index);
    this.frameList = next;
    return this.frameList;
  }

  getFrames() { return this.frameList; }
  getFrame(index: number) { return this.frames.get(index); }
  pressed(index: number, button: number) { return Boolean(this.frames.get(index)?.pressed && (this.frames.get(index)!.pressed & button)); }
}

function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : 0)); }
function clampAxis(value: number) { return clamp(value, -1, 1); }
function now() { return typeof performance === 'undefined' ? Date.now() : performance.now(); }
