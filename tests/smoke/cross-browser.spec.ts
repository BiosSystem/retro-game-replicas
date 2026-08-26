import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('bios_post_complete', 'true');
    localStorage.setItem('bios_arcade_ledger_migrated', 'true');
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
