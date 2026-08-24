export type Facing = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Hitbox {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface AnimationState {
  frames: readonly string[];
  frameRate: number;
  loop?: boolean;
  hitbox: Hitbox;
  emitOnEnter?: string;
}

export interface AnimationSnapshot {
  state: string;
  facing: Facing;
  frame: string;
  progress: number;
  hitbox: Hitbox;
  event?: string;
}

export class SpriteStateMachine {
  private readonly states: Readonly<Record<string, AnimationState>>;
  private state: string;
  private facing: Facing = 'RIGHT';
  private elapsed = 0;
  private pendingEvent: string | undefined;

  constructor(states: Readonly<Record<string, AnimationState>>, initialState: string) {
    this.states = states;
    if (!states[initialState]) throw new Error(`Unknown animation state: ${initialState}`);
    this.state = initialState;
    this.pendingEvent = states[initialState].emitOnEnter;
  }

  setState(state: string, facing: Facing = this.facing) {
    if (!this.states[state]) throw new Error(`Unknown animation state: ${state}`);
    this.facing = facing;
    if (state === this.state) return;
    this.state = state;
    this.elapsed = 0;
    this.pendingEvent = this.states[state].emitOnEnter;
  }

  getState() { return this.state; }

  update(deltaMs: number): AnimationSnapshot {
    const definition = this.states[this.state];
    const safeDelta = Math.max(0, Math.min(deltaMs, 250));
    this.elapsed += safeDelta;
    const frameDuration = 1000 / Math.max(1, definition.frameRate);
    const rawIndex = Math.floor(this.elapsed / frameDuration);
    const frameIndex = definition.loop === false
      ? Math.min(rawIndex, definition.frames.length - 1)
      : rawIndex % definition.frames.length;
    const snapshot: AnimationSnapshot = {
      state: this.state,
      facing: this.facing,
      frame: definition.frames[frameIndex],
      progress: Math.min(1, (this.elapsed % frameDuration) / frameDuration),
      hitbox: definition.hitbox,
      event: this.pendingEvent,
    };
    this.pendingEvent = undefined;
    return snapshot;
  }
}
