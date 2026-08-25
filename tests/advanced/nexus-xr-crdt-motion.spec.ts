import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem('bios_arcade_free_play', 'true'); localStorage.removeItem('neon_nexus_world_v1'); }); });

test('plan stereo views and converge Nexus world edits', async ({ page }) => {
  await launchNexus(page);
  const result = await diagnostics(page);
  expect(result.stereoViews).toBe(2); expect(result.eyesDistinct).toBe(true); expect(result.crdtConverged).toBe(true); expect(result.arcades).toBe(13);
});

test('select deterministic matrix-matched locomotion and render a stable frame', async ({ page }) => {
  await launchNexus(page); const first = await diagnostics(page), second = await diagnostics(page);
  expect(second.motionIndex).toBe(first.motionIndex); expect(second.motionPose).toEqual(first.motionPose);
  await page.evaluate(() => (window as typeof window & { game: { scene: { pause(key: string): void } } }).game.scene.pause('NexusScene'));
  const a = await page.locator('#app canvas').first().screenshot(), b = await page.locator('#app canvas').first().screenshot(); expect(a.equals(b)).toBe(true);
});

async function diagnostics(page: Page) { return page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('NexusScene') as { nexusDiagnostics(): { stereoViews: number; eyesDistinct: boolean; motionIndex: number; motionPose: number[]; crdtConverged: boolean; arcades: number } }).nexusDiagnostics()); }
async function launchNexus(page: Page) { await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await page.evaluate(() => { const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void }; for (let index = 0; index < 21; index++) lobby.updateGameSelection(1); lobby.handleSpace(); }); await page.waitForTimeout(220); await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace()); await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('NexusScene'))).toBe(true); }
