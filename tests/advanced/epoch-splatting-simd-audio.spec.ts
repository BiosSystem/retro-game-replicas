import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bios_arcade_free_play', 'true');
    let state = 0x45504f43;
    Math.random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4_294_967_296; };
  });
});

async function launchEpoch(page: Page) {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.locator('#app canvas').first().click({ position: { x: 12, y: 12 } });
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void };
    for (let index = 0; index < 28; index++) lobby.updateGameSelection(1);
    lobby.handleSpace();
  });
  await page.waitForTimeout(220);
  await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace());
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { game?: { scene: { isActive(key: string): boolean } } }).game?.scene.isActive('EpochScene'))), { timeout: 10_000 }).toBe(true);
}

test('verify Gaussian splats, Wasm SIMD physics, and shared audio allocation', async ({ page }) => {
  await launchEpoch(page);
  expect(await page.evaluate(() => globalThis.crossOriginIsolated)).toBe(true);
  const result = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('EpochScene') as { epochDiagnostics(): Promise<{ architectures: number; splats: number; splatChecksum: number; fluidConserved: boolean; simdSupported: boolean; physicsBackend: string; maximumError: number; audioRing: string; workletMode: string; audioCapacity: number; delaySamples: number; gaussianGpu: string }> }).epochDiagnostics());
  expect(result.architectures).toBe(19);
  expect(result.splats).toBe(24_000);
  expect(result.splatChecksum).toBeGreaterThan(0);
  expect(result.fluidConserved).toBe(true);
  expect(result.simdSupported).toBe(true);
  expect(result.physicsBackend).toBe('WASM_SIMD_128');
  expect(result.maximumError).toBe(0);
  expect(result.audioRing).toBe('SHARED');
  expect(result.workletMode).toBe('SHARED');
  expect(result.audioCapacity).toBe(16_384);
  expect(result.delaySamples).toBe(4_800);
  expect(['COMPILED', 'UNAVAILABLE']).toContain(result.gaussianGpu);
});

test('render a stable procedural Epoch frame after pausing', async ({ page }) => {
  await launchEpoch(page);
  await page.evaluate(() => (window as typeof window & { game: { scene: { pause(key: string): void } } }).game.scene.pause('EpochScene'));
  const first = await page.locator('#app canvas').first().screenshot();
  const second = await page.locator('#app canvas').first().screenshot();
  expect(first.equals(second)).toBe(true);
});
