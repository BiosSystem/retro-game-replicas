import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const files = await collect(root);
const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
const bootstrap = files.find(file => /assets[\\/]bootstrap-.*\.js$/.test(file.path));
const phaser = files.find(file => /assets[\\/]phaser-runtime-.*\.js$/.test(file.path));
const budgets = { total: 2_500_000, bootstrap: 131_072, phaser: 1_450_000 };
const measurements = { total: bytes, bootstrap: bootstrap?.bytes ?? 0, phaser: phaser?.bytes ?? 0 };
const violations = Object.entries(budgets).filter(([key, budget]) => measurements[key] > budget);

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), files: files.length, measurements, budgets, status: violations.length ? 'WARN' : 'PASS' }, null, 2));
if (violations.length) {
  console.error(`Bundle budgets exceeded: ${violations.map(([key]) => key).join(', ')}`);
  process.exitCode = 1;
}

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await collect(path));
    else output.push({ path: relative(root, path), bytes: (await stat(path)).size });
  }
  return output;
}
