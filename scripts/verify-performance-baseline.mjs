// Run with node --test; intentionally outside Vitest's *.test.* discovery.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

async function checkFixture(files) {
  const root = await mkdtemp(join(tmpdir(), 'arcade-baseline-test-'));
  try {
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'dist', 'assets'), { recursive: true });
    await copyFile(new URL('./performance-baseline.mjs', import.meta.url), join(root, 'scripts', 'performance-baseline.mjs'));
    for (const [path, contents] of Object.entries(files)) await writeFile(join(root, 'dist', path), contents);
    return spawnSync(process.execPath, [join(root, 'scripts', 'performance-baseline.mjs')], { encoding: 'utf8' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const complete = {
  'index.html': '<html></html>', 'sw.js': '// worker', 'manifest.webmanifest': '{}',
  'assets/bootstrap-test.js': '// bootstrap', 'assets/phaser-runtime-test.js': '// runtime',
};

test('rejects a partial build instead of reporting a small bundle as passing', async () => {
  const result = await checkFixture({ 'favicon.svg': '<svg/>' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Incomplete production build/);
});

test('accepts a complete build below the budget', async () => {
  const result = await checkFixture(complete);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'PASS');
});

test('rejects an oversized complete build', async () => {
  const result = await checkFixture({ ...complete, 'assets/oversize.bin': Buffer.alloc(1_950_000) });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Bundle budgets exceeded/);
});
