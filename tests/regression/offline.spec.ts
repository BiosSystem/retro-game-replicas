import { expect, test } from '@playwright/test';

test('install the complete arcade bundle and launch a lazy game offline', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('bios_arcade_free_play', 'true'));
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.offline), { timeout: 15000 }).toBe('ready');
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15000 }).toBe(true);

  const cacheState = await page.evaluate(async () => {
    const names = (await caches.keys()).filter(name => name.startsWith('bios-arcade-'));
    const cache = names.length === 1 ? await caches.open(names[0]) : undefined;
    const entries = cache ? await cache.keys() : [];
    const styleUrl = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"]')?.href ?? '';
    const scriptUrl = document.querySelector<HTMLScriptElement>('script[type="module"]')?.src ?? '';
    const manifest = await fetch('/manifest.webmanifest').then(response => response.json()) as { name?: string; display?: string; icons?: unknown[] };
    return { names, entries: entries.length, manifest, styleCached: Boolean(await cache?.match(styleUrl)), scriptCached: Boolean(await cache?.match(scriptUrl)) };
  });
  expect(cacheState.names).toHaveLength(1);
  expect(cacheState.entries).toBeGreaterThan(60);
  expect(cacheState.styleCached).toBe(true);
  expect(cacheState.scriptCached).toBe(true);
  expect(cacheState.manifest).toMatchObject({ name: 'BiosSystem Neon Arcade', display: 'standalone' });
  expect(cacheState.manifest.icons).toHaveLength(1);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#app canvas').first().waitFor();
    expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
    await page.evaluate(() => {
      const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void };
      for (let index = 0; index < 11; index++) lobby.updateGameSelection(1);
      lobby.handleSpace();
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace());
    await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { game?: { scene: { isActive(key: string): boolean } } }).game?.scene.isActive('RacerScene'))), { timeout: 10000 }).toBe(true);
  } finally {
    await context.setOffline(false);
  }
});
