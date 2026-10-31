// Phaser 4.1-4.2 pushes each DOM key event onto KeyboardManager.queue and processes the
// whole queue straight away, but only clears it once per frame (POST_STEP). When several
// key events land in one slow frame, every new event replays the earlier keydowns, so one
// press of Space starts and then stops the tracker. Every event has been dispatched by the
// time Phaser's own listener returns, so a listener registered after it can empty the queue.

interface KeyboardManagerPort {
  queue: unknown[];
  target: EventTarget | null;
}

interface GamePort {
  isBooted: boolean;
  // Phaser's typings do not declare KeyboardManager.queue, so the manager is checked at runtime.
  input?: { keyboard?: unknown } | null;
  events: {
    once(event: string, callback: () => void): unknown;
  };
}

const KEY_EVENTS = ['keydown', 'keyup'] as const;

export class PhaserKeyboardQueueGuard {
  private readonly keyboard: KeyboardManagerPort;
  private target: EventTarget | null = null;
  private clearedEvents = 0;
  private readonly clear = () => {
    if (this.keyboard.queue.length === 0) return;
    this.clearedEvents += this.keyboard.queue.length;
    this.keyboard.queue.length = 0;
  };

  constructor(keyboard: KeyboardManagerPort) {
    this.keyboard = keyboard;
  }

  install() {
    if (this.target || !this.keyboard.target) return false;
    this.target = this.keyboard.target;
    for (const type of KEY_EVENTS) this.target.addEventListener(type, this.clear);
    return true;
  }

  destroy() {
    if (!this.target) return;
    for (const type of KEY_EVENTS) this.target.removeEventListener(type, this.clear);
    this.target = null;
  }

  snapshot() {
    return { installed: this.target !== null, clearedEvents: this.clearedEvents };
  }
}

export function installPhaserKeyboardQueueGuard(game: GamePort) {
  let guard: PhaserKeyboardQueueGuard | null = null;
  const install = () => {
    const keyboard = game.input?.keyboard;
    if (!isKeyboardManager(keyboard)) return;
    guard = new PhaserKeyboardQueueGuard(keyboard);
    guard.install();
  };
  // Phaser attaches its own key listeners during boot; ours must come after them.
  if (game.isBooted) install();
  else game.events.once('ready', install);
  return { snapshot: () => guard?.snapshot() ?? { installed: false, clearedEvents: 0 } };
}

function isKeyboardManager(value: unknown): value is KeyboardManagerPort {
  return typeof value === 'object' && value !== null && Array.isArray((value as KeyboardManagerPort).queue) && 'target' in value;
}
