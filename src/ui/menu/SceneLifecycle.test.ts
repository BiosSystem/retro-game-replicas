import { describe, expect, it, vi } from 'vitest';
import { mountGameScene, type SceneHost } from './SceneLifecycle';

class FakeScene {}

describe('lazy game scene lifecycle', () => {
  it('loads and mounts an absent game scene once', async () => {
    const loaded = new Set<string>();
    const host: SceneHost = { has: key => loaded.has(key), add: (key) => { loaded.add(key); }, start: vi.fn() };
    const loader = vi.fn(async () => FakeScene as never);
    await mountGameScene(host, 'AsteroidsScene', { difficulty: 'HARD' }, loader);
    await mountGameScene(host, 'AsteroidsScene', { difficulty: 'EASY' }, loader);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(host.start).toHaveBeenCalledTimes(2);
  });
});
