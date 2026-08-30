import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bios_arcade_free_play', 'true');
    localStorage.setItem('arcade_visual_mode', 'OVERDRIVE_2026');
  });
});

test('boot Neon Breaker and advance a live ball through the shared cabinet flow', async ({ page }) => {
  await launchFromLobby(page, 3, 'BreakoutScene');
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('BreakoutScene') as { balls: { countActive(): number } };
    return scene.balls.countActive();
  })).toBeGreaterThan(0);
});

test('boot Cyber-Racer and advance deterministic throttle progression', async ({ page }) => {
  await launchFromLobby(page, 11, 'RacerScene');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(220);
  await page.keyboard.up('KeyW');
  await expect.poll(() => page.evaluate(() => {
    const scene = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('RacerScene') as { speed: number; distance: number };
    return { speed: scene.speed, distance: scene.distance };
  })).toMatchObject({ speed: expect.any(Number), distance: expect.any(Number) });
  const progress = await page.evaluate(() => {
    const scene = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('RacerScene') as { speed: number; distance: number };
    return { speed: scene.speed, distance: scene.distance };
  });
  expect(progress.speed).toBeGreaterThan(0);
  expect(progress.distance).toBeGreaterThan(0);
});

async function launchFromLobby(page: Page, index: number, scene: string) {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.evaluate(({ index }) => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { selectedGameIndex: number; handleSpace(): void };
    lobby.selectedGameIndex = index;
    lobby.handleSpace();
  }, { index });
  await page.waitForTimeout(220);
  await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace());
  await expect.poll(() => page.evaluate(key => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive(key), scene), { timeout: 10000 }).toBe(true);
}
