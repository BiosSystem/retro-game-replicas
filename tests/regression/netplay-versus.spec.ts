import { expect, test } from '@playwright/test';

test('connects two browser contexts, confirms readiness, and resolves a disconnect forfeit', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const peerContext = await browser.newContext();
  const host = await hostContext.newPage();
  const peer = await peerContext.newPage();
  const prepare = async (page: typeof host) => {
    await page.addInitScript(() => { sessionStorage.setItem('bios_post_complete', 'true'); localStorage.setItem('bios_arcade_free_play', 'true'); localStorage.setItem('arcade_netplay_telemetry', 'true'); });
    await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await page.locator('#netplay-toggle').click();
  };

  await prepare(host); await prepare(peer);
  await host.locator('[data-host]').click();
  const hostOffer = host.locator('[data-code]'); await expect(hostOffer).toHaveValue(/^ARC1\./, { timeout: 15000 });
  const offer = await hostOffer.inputValue();
  await peer.locator('[data-code]').fill(offer); await peer.locator('[data-join]').click();
  const peerAnswer = peer.locator('[data-code]'); await expect.poll(() => peerAnswer.inputValue(), { timeout: 15000 }).not.toBe(offer);
  await hostOffer.fill(await peerAnswer.inputValue()); await host.locator('[data-answer]').click();
  await expect(host.locator('.netplay-panel [data-status]')).toHaveText('CONNECTED', { timeout: 15000 });
  await expect(peer.locator('.netplay-panel [data-status]')).toHaveText('CONNECTED', { timeout: 15000 });
  await host.locator('[data-ready-host]').click(); await peer.locator('[data-ready-challenger]').click();
  await expect(host.locator('.netplay-telemetry')).toBeVisible();

  await peerContext.close();
  await expect(host.locator('.netplay-disconnect-modal')).toBeVisible({ timeout: 10000 });
  await expect(host.locator('.versus-podium')).toBeVisible({ timeout: 25000 });
  await expect(host.locator('.versus-podium')).toContainText('PLAYER ONE VICTORY');
  await hostContext.close();
});
