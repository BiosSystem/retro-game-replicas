import { describe, expect, it } from 'vitest';
import { AttractController, CreditLedger } from './ArcadeSession';

class MemoryStorage { values = new Map<string, string>(); getItem(key: string) { return this.values.get(key) ?? null; } setItem(key: string, value: string) { this.values.set(key, value); } }

describe('coin-op arcade session', () => {
  it('persists credits and deducts one credit per game', () => {
    const storage = new MemoryStorage();
    const ledger = new CreditLedger(storage);
    expect(ledger.consume()).toBe(false);
    ledger.insertCoin(2);
    expect(ledger.consume()).toBe(true);
    expect(new CreditLedger(storage).snapshot().credits).toBe(1);
  });

  it('starts free-play games without deducting credits', () => {
    const ledger = new CreditLedger(new MemoryStorage());
    ledger.toggleFreePlay();
    expect(ledger.consume()).toBe(true);
    expect(ledger.snapshot()).toEqual({ credits: 0, freePlay: true });
  });

  it('activates and advances attract mode after idle time', () => {
    const attract = new AttractController(30_000, 100);
    expect(attract.isActive(30_099)).toBe(false);
    expect(attract.isActive(30_100)).toBe(true);
    expect(attract.nextSelection(10, 11)).toBe(0);
  });
});
