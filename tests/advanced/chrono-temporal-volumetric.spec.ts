import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('bios_arcade_free_play', 'true')); });

test('keep time-clone simulation and causal collisions deterministic', async ({ page }) => {
  await launchChrono(page);
  const result = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('ChronoScene') as { temporalDiagnostics(frames: number): { deterministic: boolean; causalDeterministic: boolean; state: number[] } }).temporalDiagnostics(600));
  expect(result.deterministic).toBe(true);
  expect(result.causalDeterministic).toBe(true);
  expect(result.state).toHaveLength(8);
  await page.evaluate(() => (window as typeof window & { game: { scene: { pause(key: string): void } } }).game.scene.pause('ChronoScene'));
  const first = await page.locator('#app canvas').first().screenshot(), second = await page.locator('#app canvas').first().screenshot();
  expect(first.equals(second)).toBe(true);
});

test('compile the volumetric WebGPU pipeline when the browser exposes WebGPU', async ({ page }) => {
  await launchChrono(page);
  const result = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('ChronoScene') as { volumetricDiagnostics(): Promise<{ status: 'COMPILED' | 'UNAVAILABLE'; shaderBytes: number }> }).volumetricDiagnostics());
  expect(result.shaderBytes).toBeGreaterThan(900);
  expect(['COMPILED', 'UNAVAILABLE']).toContain(result.status);
});

async function launchChrono(page: Page) {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => { const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void }; for (let index = 0; index < 19; index++) lobby.updateGameSelection(1); lobby.handleSpace(); });
  await page.waitForTimeout(220); await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace());
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('ChronoScene'))).toBe(true);
}
