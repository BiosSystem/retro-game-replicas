import { describe, expect, it } from 'vitest';
import { compileNeonScript, executeNeonScript } from './NeonDslCompiler';

describe('Neon DSL compiler', () => {
  it('emits an import-free WebAssembly module', () => {
    const compiled = compileNeonScript('input\nconst 7\nadd\nreturn');
    const module = new WebAssembly.Module(compiled.bytes);
    expect(compiled.instructions).toBe(4);
    expect(WebAssembly.Module.imports(module)).toEqual([]);
  });
  it('executes deterministic i32 programs', async () => expect(await executeNeonScript('input; const 3; mul; const 2; add; return', 8)).toBe(26));
  it('rejects unsafe syntax and invalid stacks', () => {
    expect(() => compileNeonScript('input\nfetch https://example.test\nreturn')).toThrow('Unknown instruction');
    expect(() => compileNeonScript('add\nreturn')).toThrow('Stack underflow');
    expect(() => compileNeonScript('input\ninput\nreturn')).toThrow('Return requires one value');
  });
  it('compiles exactly ten thousand lines', async () => {
    const lines = Array.from({ length: 2499 }, () => ['input', 'const 1', 'add', 'drop']).flat();
    lines.push('input', 'const 2', 'mul', 'return');
    const source = lines.join('\n');
    expect(compileNeonScript(source).instructions).toBe(10_000);
    expect(await executeNeonScript(source, 9)).toBe(18);
  });
});
