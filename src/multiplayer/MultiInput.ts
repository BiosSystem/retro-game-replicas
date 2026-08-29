export type PlayerId = 1 | 2;
export type PlayerAction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE';
export type PlayerInputState = Record<PlayerAction, boolean>;
export interface PadSnapshot { index: number; connected: boolean; axes: readonly number[]; buttons?: readonly boolean[]; buttonMask?: number; actions?: PlayerInputState; }

const KEYBOARD: Record<PlayerId, Record<PlayerAction, string[]>> = {
  1: { UP: ['KeyW'], DOWN: ['KeyS'], LEFT: ['KeyA'], RIGHT: ['KeyD'], FIRE: ['Space'] },
  2: { UP: ['ArrowUp'], DOWN: ['ArrowDown'], LEFT: ['ArrowLeft'], RIGHT: ['ArrowRight'], FIRE: ['Enter'] },
};

export class MultiInput {
  private readonly keys = new Set<string>();
  private padSlots: Partial<Record<PlayerId, number>> = {};

  setKey(code: string, pressed: boolean) { if (pressed) this.keys.add(code); else this.keys.delete(code); }

  poll(pads: readonly PadSnapshot[]) {
    const active = pads.filter(pad => pad.connected).sort((a, b) => a.index - b.index).slice(0, 2);
    this.padSlots = {};
    if (active[0]) this.padSlots[1] = active[0].index;
    if (active[1]) this.padSlots[2] = active[1].index;
    return { 1: this.readPlayer(1, active), 2: this.readPlayer(2, active) };
  }

  getPadSlots() { return { ...this.padSlots }; }

  private readPlayer(player: PlayerId, pads: readonly PadSnapshot[]): PlayerInputState {
    const padIndex = this.padSlots[player];
    const pad = pads.find(candidate => candidate.index === padIndex);
    const down = (action: PlayerAction) => KEYBOARD[player][action].some(code => this.keys.has(code));
    const pressed = (index: number) => Boolean(pad && ((pad.buttonMask ?? 0) & (1 << index) || pad.buttons?.[index]));
    const mapped = pad?.actions;
    return {
      UP: down('UP') || mapped?.UP || pressed(12) || (pad?.axes[1] ?? 0) < -0.5,
      DOWN: down('DOWN') || mapped?.DOWN || pressed(13) || (pad?.axes[1] ?? 0) > 0.5,
      LEFT: down('LEFT') || mapped?.LEFT || pressed(14) || (pad?.axes[0] ?? 0) < -0.5,
      RIGHT: down('RIGHT') || mapped?.RIGHT || pressed(15) || (pad?.axes[0] ?? 0) > 0.5,
      FIRE: down('FIRE') || mapped?.FIRE || pressed(0) || pressed(1) || pressed(2) || pressed(3),
    };
  }
}

export interface PlayerBounds { x: number; y: number; width: number; height: number; }
export function separatePlayers(a: PlayerBounds, b: PlayerBounds) {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (overlapX <= 0 || overlapY <= 0) return { ax: 0, ay: 0, bx: 0, by: 0 };
  if (overlapX < overlapY) { const direction = a.x < b.x ? -1 : 1; return { ax: direction * overlapX / 2, ay: 0, bx: -direction * overlapX / 2, by: 0 }; }
  const direction = a.y < b.y ? -1 : 1;
  return { ax: 0, ay: direction * overlapY / 2, bx: 0, by: -direction * overlapY / 2 };
}
