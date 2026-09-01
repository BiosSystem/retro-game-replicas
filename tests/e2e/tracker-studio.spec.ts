import { expect, test } from '@playwright/test';

test('opens Tracker Studio, edits notes, runs transport, exports, and returns to the lobby', async ({ page }) => {
  await page.addInitScript(() => { sessionStorage.setItem('bios_post_complete', 'true'); localStorage.setItem('bios_arcade_free_play', 'true'); });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const canvas = page.locator('#app canvas').first();
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game?: { scene: { getScene(key: string): unknown } } }).game?.scene.getScene('LobbyScene') as { handleDown(): void; handleSpace(): void } | undefined;
    for (let index = 0; index < 14; index += 1) lobby?.handleDown();
    lobby?.handleSpace(); lobby?.handleSpace();
  });
  await expect(canvas).toHaveAttribute('data-arcade-scene', 'TrackerStudioScene');
  await page.keyboard.press('z'); await page.keyboard.press('s'); await page.keyboard.press('x');
  await expect.poll(async () => Number(await canvas.getAttribute('data-tracker-row'))).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Space');
  await expect.poll(() => canvas.getAttribute('data-tracker-state')).toBe('PLAYING_SONG');
  await expect.poll(() => canvas.getAttribute('data-tracker-scope')).toBe('active');
  const neonseqDownload = page.waitForEvent('download', download => download.suggestedFilename() === 'studio.neonseq'); await page.keyboard.press('o'); expect((await neonseqDownload).suggestedFilename()).toBe('studio.neonseq');
  const wavDownload = page.waitForEvent('download', download => download.suggestedFilename() === 'studio.wav'); await page.keyboard.press('Control+w'); expect((await wavDownload).suggestedFilename()).toBe('studio.wav');
  await page.evaluate(() => (window as typeof window & { game?: { scene: { start(key: string): void } } }).game?.scene.start('LobbyScene'));
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game?: { scene: { isActive(key: string): boolean } } }).game?.scene.isActive('LobbyScene'))).toBe(true);
  await expect.poll(() => page.evaluate(() => ({ project: localStorage.getItem('bios_tracker_project_v1'), slots: localStorage.getItem('bios_cabinet_bgm_slots_v1') }))).toEqual(expect.objectContaining({ project: expect.any(String), slots: expect.any(String) }));
});
