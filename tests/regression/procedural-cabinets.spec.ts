import { expect, test, type Page } from '@playwright/test';

const cabinets = [
  { index: 27, scene: 'RelayScene', collection: 'ships' },
  { index: 28, scene: 'SpiralScene', collection: 'pilots' },
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bios_arcade_free_play', 'true'));
});

test('launch both procedural cabinets in local co-op without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();

  for (const cabinet of cabinets) {
    await launchFromLobby(page, cabinet.index, cabinet.scene);
    await page.evaluate(({ scene }) => {
      const game = window as typeof window & { game: { scene: { getScene(key: string): { scene: { restart(data: object): void } } } } };
      game.game.scene.getScene(scene).scene.restart({ difficulty: 'HARD', mode: 'COOP' });
    }, cabinet);
    await expect.poll(() => page.evaluate(({ scene, collection }) => {
      const game = window as typeof window & { game: { scene: { isActive(key: string): boolean; getScene(key: string): unknown } } };
      const active = game.game.scene.isActive(scene);
      const instance = game.game.scene.getScene(scene) as Record<string, unknown>;
      return active && (instance[collection] as Map<unknown, unknown>).size === 2;
    }, cabinet), { timeout: 10000 }).toBe(true);
    await page.waitForTimeout(250);
  }

  expect(errors).toEqual([]);
});

async function launchFromLobby(page: Page, index: number, scene: string) {
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
  await expect.poll(() => page.evaluate(key => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive(key), scene), { timeout: 10000 }).toBe(true);
}
