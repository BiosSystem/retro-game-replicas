import { expect, test } from '@playwright/test';

test('loads Neon Invader, executes player controls, and recovers from malformed cartridge data', async ({ page }) => {
  await page.addInitScript(() => { sessionStorage.setItem('bios_post_complete', 'true'); localStorage.setItem('bios_arcade_free_play', 'true'); });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const canvas = page.locator('#app canvas').first();
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { selectedGameIndex: number; handleSpace(): void };
    lobby.selectedGameIndex = 31; lobby.handleSpace(); lobby.handleSpace();
  });
  await expect(canvas).toHaveAttribute('data-arcade-scene', 'CartridgePlayerScene');
  await expect(canvas).toHaveAttribute('data-cartridge-state', 'READY');
  await expect(canvas).toHaveAttribute('data-cartridge-title', 'NEON INVADER');
  const startingX = Number(await canvas.getAttribute('data-cartridge-player-x'));
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(80); await page.keyboard.up('ArrowRight');
  await expect.poll(async () => Number(await canvas.getAttribute('data-cartridge-player-x'))).toBeGreaterThan(startingX);
  await page.keyboard.down('Space'); await page.waitForTimeout(50); await page.keyboard.up('Space');
  await expect.poll(async () => Number(await canvas.getAttribute('data-cartridge-score'))).toBeGreaterThan(0);
  await page.evaluate(() => {
    const scene = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('CartridgePlayerScene') as { loadCartridge(value: Uint8Array): void };
    scene.loadCartridge(new Uint8Array([0, 1, 2]));
  });
  await expect(canvas).toHaveAttribute('data-cartridge-state', 'ERROR');
  await page.keyboard.press('Enter');
  await expect(canvas).toHaveAttribute('data-cartridge-state', 'READY');
});
