import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('bios_post_complete', 'true');
    localStorage.setItem('bios_arcade_ledger_migrated', 'true');
    localStorage.setItem('bios_arcade_free_play', 'true');
  });
});

test('boot the cabinet and open persistent controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.arcade-cabinet')).toBeVisible();
  await page.locator('#app canvas').first().waitFor();
  await expect(page.locator('html')).toHaveAttribute('data-frame-delta-cap', '50ms');
  await page.locator('#leaderboard-toggle').click();
  await expect(page.locator('.leaderboard-center')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.leaderboard-center')).toBeHidden();
  await page.locator('#save-state-toggle').click();
  await expect(page.locator('.save-state-panel')).toBeVisible();
});

test('provide browser persistence and safe rendering fallbacks', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const capabilities = await page.evaluate(() => ({
    indexedDb: typeof indexedDB !== 'undefined',
    canvas: Boolean(document.querySelector<HTMLCanvasElement>('#app canvas')?.getContext('2d') || document.querySelector<HTMLCanvasElement>('#app canvas')?.getContext('webgl')),
    storage: typeof localStorage !== 'undefined',
  }));
  expect(capabilities).toEqual({ indexedDb: true, canvas: true, storage: true });
});

test('control a keyboard-owned game from a mobile touch pad', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 1 }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const pad = page.getByRole('group', { name: 'Arcade touch controls' });
  await expect(pad).toBeVisible();
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { selectedGameIndex: number; handleSpace(): void };
    lobby.selectedGameIndex = 0;
    lobby.handleSpace();
  });
  await page.waitForTimeout(220);
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void };
    lobby.handleSpace();
  });
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene');
  })).toBe(true);
  await pad.getByRole('button', { name: 'Move up' }).hover();
  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('SnakeScene') as { nextDirection: string }).nextDirection;
  })).toBe('UP');
  await page.mouse.up();
});
