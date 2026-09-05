import { expect, test } from '@playwright/test';

const flagships = [
  { index: 2, scene: 'AsteroidsScene', name: 'neon-vector' },
  { index: 3, scene: 'BreakoutScene', name: 'neon-breaker' },
  { index: 11, scene: 'RacerScene', name: 'cyber-racer' },
  { index: 28, scene: 'EpochScene', name: 'neon-epoch' },
  { index: 29, scene: 'RelayScene', name: 'neon-relay' },
  { index: 30, scene: 'SpiralScene', name: 'prism-spiral' },
] as const;

test('priority visual scenes lazy-load and render clean raw frames', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    sessionStorage.setItem('bios_post_complete', 'true');
    localStorage.setItem('bios_arcade_free_play', 'true');
    localStorage.setItem('arcade_reduced_motion', 'true');
  });
  await page.goto('/');
  const canvas = page.locator('#app canvas').first();
  await canvas.waitFor();

  for (const flagship of flagships) {
    await page.evaluate(index => {
      const game = (window as typeof window & { game: { scene: { getScene(key: string): unknown; start(key: string): void } } }).game;
      game.scene.start('LobbyScene');
      const lobby = game.scene.getScene('LobbyScene') as { selectedGameIndex: number; handleSpace(): void };
      lobby.selectedGameIndex = index;
      lobby.handleSpace();
      lobby.handleSpace();
    }, flagship.index);
    await expect.poll(() => page.evaluate(scene => {
      const game = (window as typeof window & { game: { scene: { getScene(key: string): { scene: { isActive(): boolean } } } } }).game;
      try { return game.scene.getScene(scene).scene.isActive(); } catch { return false; }
    }, flagship.scene)).toBe(true);
    await page.waitForTimeout(350);
    await testInfo.attach(`${flagship.name}-raw-frame`, { body: await canvas.screenshot(), contentType: 'image/png' });
  }

  expect(errors).toEqual([]);
});
