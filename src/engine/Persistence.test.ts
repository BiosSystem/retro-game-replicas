import { describe, expect, it } from 'vitest';
import { PreferenceStore } from './PreferenceStore';
import { ScoreLedger } from './ScoreLedger';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('persistent arcade state', () => {
  it('sanitizes themes and custom key bindings', () => {
    const storage = new MemoryStorage();
    const preferences = new PreferenceStore(storage);
    preferences.setTheme('CYBER');
    preferences.setBinding('FIRE', ['KeyZ', 'KeyZ', '<script>']);
    expect(preferences.load()).toMatchObject({ theme: 'CYBER', bindings: { FIRE: ['KeyZ'] } });
  });

  it('keeps a stable top ten and sanitizes initials', () => {
    const ledger = new ScoreLedger(new MemoryStorage());
    for (let score = 0; score < 12; score++) ledger.submit('Runner', 'NORMAL', score, '<a>', score);
    const board = ledger.getBoard('Runner', 'NORMAL');
    expect(board).toHaveLength(10);
    expect(board[0]).toMatchObject({ score: 11, name: 'A' });
    expect(board[9].score).toBe(2);
  });
});
