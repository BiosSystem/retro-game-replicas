import { expect, it } from 'vitest'; import { TetrisVersusAdapter } from './TetrisVersusAdapter';
it('queues and injects bottom-up garbage', () => { const adapter = new TetrisVersusAdapter(); expect(adapter.queueAttack(4)).toBe(4); expect(adapter.injectGarbage(4)).toBe(true); expect(adapter.opponent.board[194]).toBe(0); });
