import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bios_arcade_free_play', 'true'));
});

test('launch every registered arcade scene without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const scenes = await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { games: Array<{ scene: string }> };
    return lobby.games.map(game => game.scene);
  });
  expect(scenes).toHaveLength(27);

  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    await launchFromLobby(page, index);
    await expect.poll(() => page.evaluate(key => {
      return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive(key);
    }, scene), { timeout: 10000, message: `Launch ${scene}` }).toBe(true);
    await page.waitForTimeout(80);
  }

  expect(errors).toEqual([]);
});

test('drive a keyboard-owned game from semantic touch controls', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 1 }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const pad = page.getByRole('group', { name: 'Arcade touch controls' });
  await expect(pad).toBeVisible();
  await expect(pad.getByRole('button')).toHaveCount(5);
  const cabinet = await page.locator('.arcade-cabinet').boundingBox();
  expect(cabinet?.width).toBeLessThanOrEqual(390);
  expect(cabinet?.height).toBeLessThanOrEqual(844);
  await launchFromLobby(page, 0);
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

async function launchFromLobby(page: import('@playwright/test').Page, index: number) {
  await page.evaluate(({ index }) => {
    const manager = (window as typeof window & { game: { scene: { stop(key: string): void; start(key: string): void; getScene(key: string): unknown; getScenes(activeOnly?: boolean): Array<{ scene: { key: string } }> } } }).game.scene;
    for (const active of manager.getScenes(true)) if (active.scene.key !== 'LobbyScene') manager.stop(active.scene.key);
    manager.start('LobbyScene');
    const lobby = manager.getScene('LobbyScene') as { selectedGameIndex: number; handleSpace(): void };
    lobby.selectedGameIndex = index;
    lobby.handleSpace();
  }, { index });
  await page.waitForTimeout(220);
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void };
    lobby.handleSpace();
  });
}
