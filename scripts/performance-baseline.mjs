import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const files = await collect(root);
const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
const bootstrap = files.find(file => /assets[\\/]bootstrap-.*\.js$/.test(file.path));
const phaser = files.find(file => /assets[\\/]phaser-runtime-.*\.js$/.test(file.path));
const required = ['index.html', 'sw.js', 'manifest.webmanifest'];
const missing = required.filter(path => !files.some(file => file.path === path && file.bytes > 0));
if (!bootstrap?.bytes) missing.push('bootstrap chunk');
if (!phaser?.bytes) missing.push('Phaser runtime chunk');
if (missing.length) throw new Error(`Incomplete production build: ${missing.join(', ')}`);
// Bootstrap: since Vite 8.3 Rolldown keeps the statically imported engine
// modules (InputManager, ModRuntime, SaveStateServices, ...) inside the
// bootstrap chunk instead of emitting them as shared chunks. The boot payload
// did not grow (112 KB + 55 KB of shared chunks before, 160 KB in one file
// after), so the budget covers the whole payload. See docs/PERFORMANCE_BASELINE.md.
const budgets = { total: 1_950_000, bootstrap: 176_128, phaser: 1_450_000 };
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
