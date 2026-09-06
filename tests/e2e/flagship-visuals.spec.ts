import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const flagships = [
  { index: 2, scene: 'AsteroidsScene', name: 'neon-vector' },
  { index: 3, scene: 'BreakoutScene', name: 'neon-breaker' },
  { index: 11, scene: 'RacerScene', name: 'cyber-racer' },
  { index: 12, scene: 'RaycasterScene', name: 'cyber-caster' },
  { index: 17, scene: 'LabyrinthScene', name: 'neon-labyrinth' },
  { index: 18, scene: 'DanmakuScene', name: 'neon-danmaku' },
  { index: 19, scene: 'KombatScene', name: 'neon-kombat' },
  { index: 28, scene: 'EpochScene', name: 'neon-epoch' },
  { index: 29, scene: 'RelayScene', name: 'neon-relay' },
  { index: 30, scene: 'SpiralScene', name: 'prism-spiral' },
] as const;

test('priority visual scenes lazy-load and render clean raw frames', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    sessionStorage.setItem('bios_post_complete', 'true');
    localStorage.setItem('bios_arcade_free_play', 'true');
    localStorage.setItem('arcade_reduced_motion', 'true');
  });
  await page.goto('/');
  const canvas = page.locator('#app canvas').first();
  await canvas.waitFor();

  for (const flagship of flagships) {
    await page.evaluate(index => {
      const game = (window as typeof window & { game: { scene: { getScene(key: string): unknown; start(key: string): void } } }).game;
      game.scene.start('LobbyScene');
      const lobby = game.scene.getScene('LobbyScene') as { selectedGameIndex: number; handleSpace(): void };
      lobby.selectedGameIndex = index;
      lobby.handleSpace();
      lobby.handleSpace();
    }, flagship.index);
    await expect.poll(() => page.evaluate(scene => {
      const game = (window as typeof window & { game: { scene: { getScene(key: string): { scene: { isActive(): boolean } } } } }).game;
      try { return game.scene.getScene(scene).scene.isActive(); } catch { return false; }
    }, flagship.scene)).toBe(true);
    await page.keyboard.down('ArrowUp');
    await page.keyboard.down('Space');
    await page.waitForTimeout(750);
    await page.keyboard.up('Space');
    await page.keyboard.up('ArrowUp');
    const frame = await page.evaluate(() => new Promise<string>(resolve => {
      const game = (window as typeof window & { game: { renderer: { snapshot(callback: (image: HTMLImageElement) => void): void } } }).game;
      game.renderer.snapshot(image => resolve(image.src));
    }));
    const buffer = Buffer.from(frame.split(',')[1], 'base64');
    expect(buffer.readUInt32BE(16)).toBe(640);
    expect(buffer.readUInt32BE(20)).toBe(480);
    const capturePath = testInfo.outputPath(`${flagship.name}-raw-frame.png`);
    await writeFile(capturePath, buffer);
    await testInfo.attach(`${flagship.name}-raw-frame`, { path: capturePath, contentType: 'image/png' });

    if (flagship.scene === 'DanmakuScene' || flagship.scene === 'RaycasterScene') {
      const shaking = await page.evaluate(key => {
        const game = (window as any).game;
        const scene = game.scene.getScene(key);
        if (key === 'DanmakuScene') {
          scene.projectiles.clear();
          scene.projectiles.spawn({ x: scene.playerX, y: scene.playerY, vx: 0, vy: 0, life: 1, kind: 0 });
          const lives = scene.lives;
          scene.collide();
          if (scene.lives === lives) throw new Error('Collision fixture did not hit the player');
        } else scene.fire();
        return scene.cameras.main.shakeEffect.isRunning;
      }, flagship.scene);
      expect(shaking, `${flagship.scene} must honor reduced motion during impacts`).toBe(false);
    }
  }

  expect(errors).toEqual([]);
});
