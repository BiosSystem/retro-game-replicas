import { expect, test } from '@playwright/test';

test('creates, exports, saves, and displays a cabinet decal', async ({ page }) => {
  await page.addInitScript(() => { sessionStorage.setItem('bios_post_complete', 'true'); localStorage.setItem('bios_arcade_free_play', 'true'); });
  await page.goto('/');
  const canvas = page.locator('#app canvas').first(); await expect(canvas).toBeVisible();
  await page.evaluate(() => { const game = (window as unknown as { game: { scene: { getScene(key: string): { handleDown(): void; handleSpace(): void } } } }).game; const lobby = game.scene.getScene('LobbyScene'); for (let index = 0; index < 15; index++) lobby.handleDown(); lobby.handleSpace(); });
  await page.waitForTimeout(50);
  await page.evaluate(() => (window as unknown as { game: { scene: { getScene(key: string): { handleSpace(): void } } } }).game.scene.getScene('LobbyScene').handleSpace());
  await expect(canvas).toHaveAttribute('data-arcade-scene', 'DecalWorkshopScene');
  await page.keyboard.press('8'); await canvas.click({ position: { x: 84, y: 148 } }); await page.keyboard.press('1');
  await canvas.hover({ position: { x: 90, y: 150 } }); await page.mouse.down(); await page.mouse.move(180, 210, { steps: 4 }); await page.mouse.up();
  await page.keyboard.press(']'); await expect(canvas).toHaveAttribute('data-decal-preview', 'SIDE_RIGHT');
  await page.waitForTimeout(80);
  await page.keyboard.press(']'); await expect(canvas).toHaveAttribute('data-decal-preview', 'MARQUEE');
  const download = page.waitForEvent('download'); await page.keyboard.press('o'); await expect((await download).suggestedFilename()).toBe('cabinet.neonart');
  await page.keyboard.press('s'); await expect.poll(() => page.evaluate(() => localStorage.getItem('bios_cabinet_skins_v1'))).not.toBeNull();
  await page.evaluate(() => (window as unknown as { game: { scene: { start(key: string): void } } }).game.scene.start('LobbyScene'));
  await expect(canvas).toHaveAttribute('data-customized-cabinet', 'true');
});
