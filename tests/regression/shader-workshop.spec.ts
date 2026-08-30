import { expect, test } from '@playwright/test';

test('open the bounded CRT shader workshop and retain a local uniform change', async ({ page }) => {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => window.dispatchEvent(new Event('arcade-shader-workshop-open')));
  await expect(page.locator('.shader-workshop')).toBeVisible();
  await page.locator('[data-field="curvature"]').fill('0.08');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('arcade_shader_workshop_enabled'))).toBe('true');
});
