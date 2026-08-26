import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('release configuration', () => {
  it('keeps release metadata synchronized', () => {
    const packageVersion = (JSON.parse(read('package.json')) as { version: string }).version;
    const lock = JSON.parse(read('package-lock.json')) as { version: string; packages: Record<string, { version: string }> };
    const tauriVersion = (JSON.parse(read('src-tauri/tauri.conf.json')) as { version: string }).version;
    const cargoVersion = read('src-tauri/Cargo.toml').match(/^version = "([^"]+)"/m)?.[1];
    const cargoLockVersion = read('src-tauri/Cargo.lock').match(/name = "retro-game-replicas"\r?\nversion = "([^"]+)"/)?.[1];
    expect([packageVersion, lock.version, lock.packages[''].version, tauriVersion, cargoVersion, cargoLockVersion]).toEqual(['2.0.0', '2.0.0', '2.0.0', '2.0.0', '2.0.0', '2.0.0']);
    expect(read('CHANGELOG.md')).toContain('## [2.0.0] - 2026-08-26');
  });

  it('blocks package publication behind complete validation', () => {
    const workflow = read('.github/workflows/release_and_packages.yml');
    for (const command of ['npm ci', 'npm run lint', 'npm test', 'npm run build', 'npm run test:regression', 'npm run test:cross-browser', 'docker build --tag retro-arcade-validation .', 'Cross-Origin-Embedder-Policy: require-corp', 'cargo check --locked']) expect(workflow).toContain(command);
    expect(workflow.match(/needs: validate/g)).toHaveLength(2);
    expect(workflow.match(/if: startsWith\(github\.ref, 'refs\/tags\/v'\)/g)).toHaveLength(2);
  });

  it('serves an isolated application shell with durable security headers', () => {
    const nginx = read('nginx.conf');
    for (const header of ['Content-Security-Policy', 'Cross-Origin-Opener-Policy', 'Cross-Origin-Embedder-Policy', 'Cross-Origin-Resource-Policy', 'X-Content-Type-Options', 'Permissions-Policy']) expect(nginx).toContain(header);
    expect(nginx).toContain('try_files $uri $uri/ /index.html');
    expect(read('Dockerfile')).toContain('RUN npm ci');
    expect(read('Dockerfile')).toContain('COPY nginx.conf /etc/nginx/conf.d/default.conf');
  });

  it('keeps generated and native trees outside the web container context', () => {
    const ignored = new Set(read('.dockerignore').split(/\r?\n/).filter(Boolean));
    for (const path of ['.git', 'node_modules', 'dist', 'src-tauri', 'tests', 'test-results', 'docs', '*.py', '*.tsbuildinfo']) expect(ignored.has(path)).toBe(true);
  });

  it('keeps the desktop CSP enabled for Wasm and generated worklets', () => {
    const config = JSON.parse(read('src-tauri/tauri.conf.json')) as { app: { security: { csp: string | null } } };
    expect(config.app.security.csp).not.toBeNull();
    expect(config.app.security.csp).toContain("'wasm-unsafe-eval'");
    expect(config.app.security.csp).toContain('worker-src');
    expect(config.app.security.csp).toContain('blob:');
    expect(config.app.security.csp).toContain('http://ipc.localhost');
  });
});
