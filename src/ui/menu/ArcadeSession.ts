export interface SessionStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }

export class CreditLedger {
  private readonly storage: SessionStorage;
  private credits: number;
  private freePlay: boolean;

  constructor(storage: SessionStorage) {
    this.storage = storage;
    this.credits = this.readNumber('bios_arcade_credits');
    this.freePlay = storage.getItem('bios_arcade_free_play') === 'true';
  }

  insertCoin(amount = 1) { this.credits = Math.min(99, this.credits + Math.max(0, Math.floor(amount))); this.save(); return this.credits; }
  canStart() { return this.freePlay || this.credits > 0; }
  consume() { if (this.freePlay) return true; if (this.credits <= 0) return false; this.credits -= 1; this.save(); return true; }
  toggleFreePlay() { this.freePlay = !this.freePlay; this.storage.setItem('bios_arcade_free_play', String(this.freePlay)); return this.freePlay; }
  snapshot() { return { credits: this.credits, freePlay: this.freePlay }; }

  private save() { this.storage.setItem('bios_arcade_credits', String(this.credits)); }
  private readNumber(key: string) { const value = Number(this.storage.getItem(key)); return Number.isFinite(value) ? Math.max(0, Math.min(99, Math.floor(value))) : 0; }
}

export class AttractController {
  private readonly idleMs: number;
  private lastInputAt: number;
  constructor(idleMs = 30_000, now = 0) { this.idleMs = idleMs; this.lastInputAt = now; }
  registerInput(now: number) { this.lastInputAt = now; }
  isActive(now: number) { return now - this.lastInputAt >= this.idleMs; }
  nextSelection(current: number, count: number) { return count > 0 ? (current + 1) % count : 0; }
}
