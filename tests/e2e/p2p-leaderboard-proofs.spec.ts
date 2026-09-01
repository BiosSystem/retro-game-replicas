import { expect, test } from '@playwright/test';

test('creates a verified proof and opens spectator replay', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bios_arcade_free_play', 'true');
    localStorage.setItem('bios_arcade_ledger_v3', JSON.stringify({ 'SnakeScene:NORMAL': [{ score: 12, name: 'AAA', recordedAt: 1 }] }));
  });
  await page.goto('/');
  const canvas = page.locator('#app canvas').first(); await expect(canvas).toBeVisible();
  await page.evaluate(() => { const lobby = (window as typeof window & { game?: { scene: { getScene(key: string): { handleSpace(): void } } } }).game?.scene.getScene('LobbyScene'); lobby?.handleSpace(); lobby?.handleSpace(); });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game?: { scene: { isActive(key: string): boolean } } }).game?.scene.isActive('SnakeScene'))).toBe(true);
  await page.waitForTimeout(100);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('arcade-game-over', { detail: { scene: 'SnakeScene', score: 12 } })));
  await expect.poll(() => page.evaluate(() => localStorage.getItem('bios_verified_neonproof_v1'))).not.toBeNull();
  await page.locator('#leaderboard-toggle').click();
  const badge = page.locator('[data-proof="verified"]'); await expect(badge).toBeVisible(); await badge.click();
  await expect(page.locator('.replay-hud')).toBeVisible(); await expect(page.locator('.replay-hud')).toContainText('REPLAY SPECTATOR');
  await page.keyboard.press('Escape'); await expect(page.locator('.replay-hud')).toBeHidden();
});
