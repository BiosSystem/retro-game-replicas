import { expect, test } from '@playwright/test';

test('render the cabinet netplay lobby with room input and player readiness', async ({ page }) => {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor();
  await page.locator('#netplay-toggle').click();
  await expect(page.locator('.netplay-panel h2')).toHaveText('NETPLAY LOBBY');
  await expect(page.locator('[data-seats] .netplay-seat')).toHaveCount(2);
  const room = page.locator('[data-room-input]'); await room.fill('a1_b2c3'); await expect(room).toHaveValue('AB2C3');
  await expect(page.locator('[data-ready-host]')).toHaveText('READY P1');
});
