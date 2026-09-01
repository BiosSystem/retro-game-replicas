import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('bios_arcade_free_play', 'true')); });

async function launchOs(page: Page) {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => { const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void }; for (let index = 0; index < 25; index++) lobby.updateGameSelection(1); lobby.handleSpace(); });
  await page.waitForTimeout(150); await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace());
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('OsScene'))).toBe(true);
}

test('compile safe programs and recover a grid shard after peer churn', async ({ page }) => {
  await launchOs(page); const result = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('OsScene') as { osDiagnostics(): Promise<{ compiler: number; grid: number; retries: number; bitrate: number; broadcast: { supported: boolean }; webgpu: string; windows: number }> }).osDiagnostics());
  expect(result).toMatchObject({ compiler: 18, grid: 10, retries: 1, bitrate: 2_000_000, windows: 3 }); expect(typeof result.broadcast.supported).toBe('boolean'); expect(['COMPILED', 'UNAVAILABLE']).toContain(result.webgpu);
});

test('exercise the capability-gated canvas capture path and hold a stable frame', async ({ page }) => {
  await launchOs(page); const result = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('OsScene') as { broadcastCaptureDiagnostics(): Promise<{ support: { supported: boolean }; accepted: boolean; packets: number }> }).broadcastCaptureDiagnostics());
  if (result.support.supported) { expect(result.accepted).toBe(true); expect(result.packets).toBeGreaterThanOrEqual(0); } else expect(result.accepted).toBe(false);
  await page.evaluate(() => (window as typeof window & { game: { scene: { pause(key: string): void } } }).game.scene.pause('OsScene')); const first = await page.locator('#app canvas').first().screenshot(), second = await page.locator('#app canvas').first().screenshot(); expect(first.equals(second)).toBe(true);
});
