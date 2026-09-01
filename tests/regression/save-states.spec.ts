import { expect, test } from '@playwright/test';

test('capture, preview, and restore a generated Neon Epoch save slot', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bios_arcade_free_play', 'true'));
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void };
    for (let index = 0; index < 28; index++) lobby.updateGameSelection(1);
    lobby.handleSpace();
  });
  await page.waitForTimeout(220);
  await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace());
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { game?: { scene: { isActive(key: string): boolean } } }).game?.scene.isActive('EpochScene'))), { timeout: 10000 }).toBe(true);

  await page.locator('#save-state-toggle').click();
  const card = page.locator('[data-save-slot="neon_epoch_1"]');
  const save = card.locator('[data-action="save"]');
  await expect(save).toBeEnabled({ timeout: 10000 });
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyW');
  const savedPosition = await epochPosition(page);
  await save.click();
  await expect(page.locator('.save-state-panel [data-status]')).toHaveText('SAVE COMPLETE', { timeout: 10000 });
  await expect(card.locator('img')).toBeVisible();
  expect(await card.locator('img').getAttribute('src')).toMatch(/^data:image\/(webp|png);base64,/);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyW');
  expect((await epochPosition(page)).z).not.toBeCloseTo(savedPosition.z, 2);
  await card.locator('[data-action="load"]').click();
  await expect(page.locator('.save-state-panel [data-status]')).toHaveText('LOAD COMPLETE', { timeout: 10000 });
  expect((await epochPosition(page)).x).toBeCloseTo(savedPosition.x, 4);
  expect((await epochPosition(page)).z).toBeCloseTo(savedPosition.z, 4);
});

async function epochPosition(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const scene = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('EpochScene') as { cameraX: number; cameraZ: number };
    return { x: scene.cameraX, z: scene.cameraZ };
  });
}
