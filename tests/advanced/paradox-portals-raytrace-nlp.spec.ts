import { expect, test, type Page } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { let state = 0x50415241; Math.random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; localStorage.setItem('bios_arcade_free_play', 'true'); }); });

test('preserve portal momentum and render four recursive stencil levels', async ({ page }) => {
  await launchParadox(page);
  const result = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('ParadoxScene') as { paradoxDiagnostics(): { speedBefore: number; speedAfter: number; maximumDepth: number; views: number; parameters: number } }).paradoxDiagnostics());
  expect(result.speedAfter).toBeCloseTo(result.speedBefore, 6); expect(result.maximumDepth).toBe(4); expect(result.views).toBeGreaterThan(4); expect(result.parameters).toBeLessThan(100_000);
  await page.evaluate(() => (window as typeof window & { game: { scene: { pause(key: string): void } } }).game.scene.pause('ParadoxScene'));
  const first = await page.locator('#app canvas').first().screenshot(), second = await page.locator('#app canvas').first().screenshot(); expect(first.equals(second)).toBe(true);
});

test('compile local INT4 and BVH compute pipelines when an adapter is available', async ({ page }) => {
  await launchParadox(page);
  const result = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('ParadoxScene') as { gpuDiagnostics(): Promise<{ nlp: string; raytrace: string }> }).gpuDiagnostics());
  expect(['COMPILED', 'UNAVAILABLE']).toContain(result.nlp); expect(['COMPILED', 'UNAVAILABLE']).toContain(result.raytrace);
});

async function launchParadox(page: Page) { await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await page.evaluate(() => { const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void }; for (let index = 0; index < 22; index++) lobby.updateGameSelection(1); lobby.handleSpace(); }); await page.waitForTimeout(220); await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace()); await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('ParadoxScene'))).toBe(true); }
