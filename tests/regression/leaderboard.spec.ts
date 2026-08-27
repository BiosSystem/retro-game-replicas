import { expect, test } from '@playwright/test';

test('open and filter the local-first leaderboard center', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bios_arcade_ledger_v3', JSON.stringify({
      'RunnerScene:NORMAL': [{ name: 'ACE', score: 4200, recordedAt: 1 }],
      'TetrisScene:HARD': [{ name: 'BEE', score: 3100, recordedAt: 2 }],
    }));
    localStorage.setItem('bios_arcade_ledger_migrated', 'true');
  });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.locator('#leaderboard-toggle').click();
  const panel = page.locator('.leaderboard-center');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('ACE');
  await expect(panel).toContainText('4,200');
  await panel.locator('[data-source="PEER"]').click();
  await expect(panel.locator('[data-list]')).toContainText('NO SCORES IN THIS VIEW');
  await page.keyboard.press('KeyL');
  await expect(panel).toBeHidden();
});
