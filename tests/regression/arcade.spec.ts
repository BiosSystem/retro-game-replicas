import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => { let state = 0x4252494f; Math.random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; localStorage.setItem('bios_arcade_free_play', 'true'); }); });

test('render stable cabinet and creation overlays', async ({ page }) => { await page.goto('/?mods=1'); await expect(page.locator('.arcade-cabinet')).toBeVisible(); await expect(page.locator('#mod-manager')).toBeVisible(); await expect(page.locator('[data-preview]')).toBeVisible(); const first = await pixels(page); await page.waitForTimeout(100); const second = await pixels(page); expect(pixelRatio(first, second)).toBeLessThan(0.002); });

test('open bounded netplay handshake panel', async ({ page }) => { await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await page.locator('#netplay-toggle').click(); await expect(page.locator('.netplay-panel')).toBeVisible(); await expect(page.locator('.netplay-panel')).toContainText('P2P NETPLAY'); });

test('install the active Phaser frame delta guard', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await expect(page.locator('html')).toHaveAttribute('data-frame-delta-cap', '50ms');
});

test('persist and reroll the procedural player profile', async ({ page }) => {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await page.keyboard.press('KeyP');
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('ProfileScene')))).toBe(true);
  const before = await page.evaluate(() => localStorage.getItem('bios_arcade_profile_v1'));
  await page.keyboard.press('KeyR');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('bios_arcade_profile_v1'))).not.toBe(before);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('ProfileScene')))).toBe(false);
});

test('expose the user-initiated fullscreen cabinet control', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => {
    (window as typeof window & { game: { scene: { start(key: string, data: unknown): void } } }).game.scene.start('SettingsScene', { scene: 'LobbyScene' });
  });
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('SettingsScene') as { menuItems: Array<{ text: string }> };
    return scene.menuItems[1]?.text;
  })).toMatch(/^FULLSCREEN: (READY|UNAVAILABLE)$/);
});

test('persist and render the performance baseline telemetry control', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => {
    const game = (window as typeof window & { game: { scene: { start(key: string, data: unknown): void; getScene(key: string): unknown } } }).game;
    game.scene.start('SettingsScene', { scene: 'LobbyScene' });
    const settings = game.scene.getScene('SettingsScene') as { options: string[]; selectedIndex: number; selectOption(): void };
    settings.selectedIndex = settings.options.indexOf('TELEMETRY');
    settings.selectOption();
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('arcade_telemetry'))).toBe('true');
  const telemetry = page.locator('#runtime-telemetry');
  await expect(telemetry).toBeVisible();
  await expect(telemetry).toContainText('BASELINE LOW');
  await expect(telemetry).toContainText('INPUT EVENT');
  await expect(telemetry).toContainText('AUDIO XRUN');
});

test('persist CRT quality, overscan, and scanline phase calibration', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => {
    const game = (window as typeof window & { game: { scene: { start(key: string, data: unknown): void; getScene(key: string): unknown } } }).game;
    game.scene.start('SettingsScene', { scene: 'LobbyScene' });
    const settings = game.scene.getScene('SettingsScene') as { options: string[]; selectedIndex: number; selectOption(): void };
    for (const option of ['CRT QUALITY', 'CRT OVERSCAN', 'SCANLINE PHASE']) {
      settings.selectedIndex = settings.options.indexOf(option);
      settings.selectOption();
    }
  });
  await expect.poll(() => page.evaluate(() => ({ quality: localStorage.getItem('arcade_crt_quality'), overscan: localStorage.getItem('arcade_crt_overscan'), phase: localStorage.getItem('arcade_crt_scanline_phase') }))).toEqual({ quality: 'HIGH', overscan: '0.02', phase: '0.25' });
  await expect(page.locator('html')).toHaveAttribute('data-crt-quality', 'high');
});

test('detect a synthetic controller and open the live calibration overlay', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{ axes: [0.28, -0.12, 0, 0], buttons, connected: true, id: 'Vendor: 054c Product: 0ce6 DualSense', index: 0, mapping: 'standard', timestamp: performance.now() }] });
  });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => {
    const game = (window as typeof window & { game: { scene: { start(key: string, data: unknown): void; getScene(key: string): unknown } } }).game;
    game.scene.start('SettingsScene', { scene: 'LobbyScene' });
    const settings = game.scene.getScene('SettingsScene') as { options: string[]; selectedIndex: number; selectOption(): void };
    settings.selectedIndex = settings.options.indexOf('CONTROLLER SETUP');
    settings.selectOption();
  });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('ControllerConfigScene'))).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('ControllerConfigScene') as { status: { text: string } };
    return scene.status.text;
  })).toContain('PLAYSTATION');
});

test('launch the generated Neon Retro Racer scene', async ({ page }) => { await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await page.evaluate(() => { const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void }; for (let index = 0; index < 11; index++) lobby.updateGameSelection(1); lobby.handleSpace(); }); await page.waitForTimeout(250); await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace()); await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { game?: { scene: { isActive(key: string): boolean } } }).game?.scene.isActive('RacerScene'))), { timeout: 10000 }).toBe(true); });

test('render the WebGL CRT surface inside a 16:9 integer frame', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('arcade_crt_preset', 'ARCADE_CRT_1980S'); localStorage.setItem('arcade_crt_quality', 'LOW'); localStorage.setItem('arcade_crt_overscan', '0.04'); localStorage.setItem('arcade_crt_scanline_phase', '0.5'); localStorage.setItem('arcade_display_aspect', '16:9'); });
  await page.goto('/');
  const source = page.locator('#app canvas[data-arcade-surface="game"]');
  const output = page.locator('#app canvas[data-arcade-surface="crt"]');
  await source.waitFor();
  await expect(output).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('data-display-aspect', '16x9');
  await expect(page.locator('html')).toHaveAttribute('data-crt-quality', 'low');
  await expect(output).toHaveAttribute('data-crt-quality', 'low');
  await expect(output).toHaveAttribute('data-crt-overscan', '0.040');
  await expect(output).toHaveAttribute('data-crt-program-compiles', '1');
  await expect.poll(() => output.getAttribute('data-crt-submit-mean-ms'), { timeout: 5000 }).not.toBeNull();
  const sourceBox = await source.boundingBox();
  const outputBox = await output.boundingBox();
  expect(outputBox).toEqual(sourceBox);
  expect(await source.evaluate(canvas => canvas.style.opacity)).toBe('0');
  const mean = Number(await output.getAttribute('data-crt-submit-mean-ms'));
  expect(Number.isFinite(mean)).toBe(true);
  expect(mean).toBeLessThan(20);
  console.log(`CRT CPU SUBMISSION MEAN ${mean.toFixed(4)} MS`);
});

async function pixels(page: import('@playwright/test').Page) { return page.locator('[data-preview]').evaluate((canvas: HTMLCanvasElement) => Array.from(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data)); }
function pixelRatio(a: number[], b: number[]) { let changed = 0; for (let index = 0; index < a.length; index += 4) if (Math.abs(a[index] - b[index]) > 8 || Math.abs(a[index + 1] - b[index + 1]) > 8 || Math.abs(a[index + 2] - b[index + 2]) > 8 || Math.abs(a[index + 3] - b[index + 3]) > 8) changed++; return changed / (a.length / 4); }
