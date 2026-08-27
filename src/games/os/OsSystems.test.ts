import { describe, expect, it } from 'vitest';
import { NeonTerminal, NeonWindowManager } from './OsSystems';

describe('Neon OS', () => {
  it('lays out bounded procedural windows', () => { const manager = new NeonWindowManager(); expect(manager.open('Compiler')).toMatchObject({ id: 1, x: 28, y: 92 }); expect(manager.open('Grid').x).toBe(224); expect(manager.close(1)).toBe(true); });
  it('compiles and executes safe terminal scripts', async () => { const result = await new NeonTerminal().execute('RUN 9 input|const 2|mul|return'); expect(result.value).toBe(18); expect(result.output).toBe('PROCESS EXIT 18'); });
  it('submits bounded grid jobs from the terminal', async () => expect((await new NeonTerminal().execute('GRID 1,2,3,4')).value).toBe(10));
});
