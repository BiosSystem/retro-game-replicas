import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
const excluded = new Set(['.git', 'dist', 'node_modules', 'target', 'test-results', 'playwright-report']);

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name)) return [];
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'docs' ? markdownFiles(path) : [];
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  });
}

describe('documentation links', () => {
  it('resolves every repository-local Markdown target', () => {
    const missing: string[] = [];
    for (const file of markdownFiles(root)) {
      const markdown = readFileSync(file, 'utf8');
      for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = match[1].trim().replace(/^<|>$/g, '').split(/[?#]/, 1)[0];
        if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
        const resolved = resolve(dirname(file), decodeURIComponent(target));
        if (!existsSync(resolved)) missing.push(`${file.slice(root.length + 1)} -> ${target}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
