import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => { let state = 0x4d455441; Math.random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; localStorage.setItem('bios_arcade_free_play', 'true'); }); });

test('render a stable procedural meta-arcade hall', async ({ page }) => {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await launch(page, 13, 'MetaArcadeScene');
  await page.evaluate(() => (window as typeof window & { game: { scene: { pause(key: string): void } } }).game.scene.pause('MetaArcadeScene'));
  const first = await page.locator('#app canvas').first().screenshot(); await page.waitForTimeout(100); const second = await page.locator('#app canvas').first().screenshot(); expect(second.equals(first)).toBe(true);
});

test('hash and replay a deterministic input ledger', async ({ page }) => {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await launch(page, 0, 'SnakeScene'); await page.keyboard.down('w'); await page.waitForTimeout(160); await page.keyboard.up('w'); await page.waitForTimeout(100);
  await page.evaluate(() => { const scenes = (window as typeof window & { game: { scene: { stop(key: string): void; start(key: string): void } } }).game.scene; scenes.stop('SnakeScene'); scenes.start('LobbyScene'); });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('retro_replay_latest_v1'))).toContain('sha256');
  const verified = await page.evaluate(async () => { const signed = JSON.parse(localStorage.getItem('retro_replay_latest_v1')!); const ledger = signed.ledger; const canonical = JSON.stringify({ durationTicks: ledger.durationTicks, inputs: ledger.inputs.map((input: { mask: number; tick: number }) => ({ mask: input.mask, tick: input.tick })), scene: ledger.scene, seed: ledger.seed >>> 0, tickRate: 60, version: 1 }); const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical)); const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join(''); return hash === signed.sha256 && ledger.inputs.length < ledger.durationTicks; });
  expect(verified).toBe(true); await page.keyboard.press('r'); await expect(page.locator('.replay-hud')).toBeVisible(); await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene')))).toBe(true); await page.locator('[data-pause]').click(); await page.locator('[data-timeline]').fill('500'); await expect(page.locator('[data-time]')).not.toHaveText('0');
});

test('launch Neon Tactics within bounded swarm limits', async ({ page }) => {
  await page.goto('/'); await page.locator('#app canvas').first().waitFor(); await launch(page, 16, 'TacticsScene'); const count = await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('TacticsScene') as { count: number }).count); expect(count).toBeGreaterThan(100); expect(count).toBeLessThanOrEqual(1000);
});

async function launch(page: Page, index: number, key: string) { await page.evaluate(({ index }) => { const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { updateGameSelection(change: number): void; handleSpace(): void }; for (let step = 0; step < index; step++) lobby.updateGameSelection(1); lobby.handleSpace(); }, { index }); await page.waitForTimeout(220); await page.evaluate(() => ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void }).handleSpace()); await expect.poll(() => page.evaluate(sceneKey => Boolean((window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive(sceneKey)), key), { timeout: 10000 }).toBe(true); }
