import type { StoragePort } from './PreferenceStore';

export interface ScoreEntry { score: number; name: string; recordedAt: number; }

export class ScoreLedger {
  private readonly storage: StoragePort;
  private readonly key: string;

  constructor(storage: StoragePort, key = 'bios_arcade_ledger_v3') {
    this.storage = storage;
    this.key = key;
  }

  submit(game: string, difficulty: string, score: number, name: string, recordedAt = Date.now()) {
    if (!Number.isFinite(score) || score < 0) return false;
    const ledger = this.read();
    const boardKey = `${game}:${difficulty}`;
    const entry = { score: Math.floor(score), name: this.cleanName(name), recordedAt };
    const board = [...(ledger[boardKey] ?? []), entry]
      .sort((a, b) => b.score - a.score || a.recordedAt - b.recordedAt)
      .slice(0, 10);
    ledger[boardKey] = board;
    this.storage.setItem(this.key, JSON.stringify(ledger));
    return board.includes(entry);
  }

  getBoard(game: string, difficulty: string) { return this.read()[`${game}:${difficulty}`] ?? []; }
  getBest(game: string, difficulty: string) { return this.getBoard(game, difficulty)[0] ?? { score: 0, name: '---', recordedAt: 0 }; }

  private read(): Record<string, ScoreEntry[]> {
    try {
      const value = JSON.parse(this.storage.getItem(this.key) ?? '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }

  private cleanName(name: string) {
    const clean = name.toUpperCase().replace(/[^A-Z0-9!?. -]/g, '').trim().slice(0, 3);
    return clean || 'AAA';
  }
}
