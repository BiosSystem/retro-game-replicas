import { bench, describe } from 'vitest';
import { compileNeonScript } from './NeonDslCompiler';

const lines = Array.from({ length: 2499 }, () => ['input', 'const 1', 'add', 'drop']).flat();
lines.push('input', 'const 2', 'mul', 'return');
const tenThousandLineScript = lines.join('\n');

describe('Neon DSL compiler', () => {
  bench('compile 10,000 safe instructions', () => { compileNeonScript(tenThousandLineScript); });
});
