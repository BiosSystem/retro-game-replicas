import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bios_arcade_free_play', 'true'));
});

test('launch every registered arcade scene without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const scenes = await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { games: Array<{ scene: string }> };
    return lobby.games.map(game => game.scene);
  });
  expect(scenes).toHaveLength(27);

  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    await launchFromLobby(page, index);
    await expect.poll(() => page.evaluate(key => {
      return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive(key);
    }, scene), { timeout: 10000, message: `Launch ${scene}` }).toBe(true);
    await page.waitForTimeout(80);
  }

  expect(errors).toEqual([]);
});

test('drive a keyboard-owned game from semantic touch controls', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 1 }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const pad = page.getByRole('group', { name: 'Arcade touch controls' });
  await expect(pad).toBeVisible();
  await expect(pad.getByRole('button')).toHaveCount(5);
  const cabinet = await page.locator('.arcade-cabinet').boundingBox();
  expect(cabinet?.width).toBeLessThanOrEqual(390);
  expect(cabinet?.height).toBeLessThanOrEqual(844);
  await launchFromLobby(page, 0);
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene');
  })).toBe(true);
  await pad.getByRole('button', { name: 'Move up' }).hover();
  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('SnakeScene') as { nextDirection: string }).nextDirection;
  })).toBe('UP');
  await page.mouse.up();
});

test('drive a keyboard-owned game from a connected gamepad', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const controller = {
      axes: [0, -1, 0, 0],
      buttons,
      connected: true,
      hapticActuators: [],
      id: 'Xbox Wireless Controller',
      index: 0,
      mapping: 'standard',
      timestamp: 1,
      vibrationActuator: null,
    };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [controller] });
  });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await launchFromLobby(page, 0);
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene');
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('SnakeScene') as { nextDirection: string }).nextDirection;
  })).toBe('UP');
});

test('navigate a paused legacy game from a connected gamepad without duplicate input', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const controller = {
      axes: [0, 0, 0, 0],
      buttons,
      connected: true,
      hapticActuators: [],
      id: 'Xbox Wireless Controller',
      index: 0,
      mapping: 'standard',
      timestamp: 1,
      vibrationActuator: null,
    };
    Object.assign(window, { arcadeTestController: controller });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [controller] });
  });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await launchFromLobby(page, 0);
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene');
  })).toBe(true);

  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[9] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('PauseScene');
  })).toBe(true);

  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { axes: number[]; buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[9] = { pressed: false, touched: false, value: 0 };
    controller.axes[1] = -1;
  });
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('PauseScene') as { gamepadState: { up: boolean } }).gamepadState.up;
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('PauseScene') as { selectedIndex: number }).selectedIndex;
  })).toBe(3);

  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { axes: number[]; buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.axes[1] = 0;
    controller.buttons[1] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene');
  })).toBe(true);

  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { axes: number[]; buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[1] = { pressed: false, touched: false, value: 0 };
    controller.axes[1] = -1;
  });
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('SnakeScene') as { nextDirection: string }).nextDirection;
  })).toBe('UP');
});

test('enter and submit high-score initials from a connected gamepad', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const controller = {
      axes: [0, 0, 0, 0],
      buttons,
      connected: true,
      hapticActuators: [],
      id: 'Xbox Wireless Controller',
      index: 0,
      mapping: 'standard',
      timestamp: 1,
      vibrationActuator: null,
    };
    Object.assign(window, { arcadeTestController: controller });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [controller] });
  });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await launchFromLobby(page, 0);
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene');
  })).toBe(true);
  await page.evaluate(() => {
    const manager = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene;
    const snake = manager.getScene('SnakeScene') as { scene: { pause(): void; launch(key: string, data: unknown): void } };
    snake.scene.pause();
    snake.scene.launch('NameEntryScene', { scene: 'SnakeScene', difficulty: 'EASY', score: 4242, restartData: { difficulty: 'EASY' } });
  });
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('NameEntryScene');
  })).toBe(true);

  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { axes: number[] } }).arcadeTestController;
    controller.axes[1] = -1;
  });
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('NameEntryScene') as { initials: string[] }).initials.join('');
  })).toBe('BAA');
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { axes: number[] } }).arcadeTestController;
    controller.axes[1] = 0;
    controller.axes[0] = 1;
  });
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('NameEntryScene') as { currentIndex: number }).currentIndex;
  })).toBe(1);
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { axes: number[]; buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.axes[0] = 0;
    controller.buttons[0] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => {
    return ((window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('NameEntryScene') as { currentIndex: number }).currentIndex;
  })).toBe(2);
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[0] = { pressed: false, touched: false, value: 0 };
  });
  await page.waitForTimeout(80);
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[0] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('NameEntryScene');
  })).toBe(false);
  await expect.poll(() => page.evaluate(() => {
    return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene');
  })).toBe(true);
});

test('restart a finished game from the shared controller game-over overlay', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const controller = { axes: [0, 0, 0, 0], buttons, connected: true, hapticActuators: [], id: 'Xbox Wireless Controller', index: 0, mapping: 'standard', timestamp: 1, vibrationActuator: null };
    Object.assign(window, { arcadeTestController: controller });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [controller] });
  });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await launchFromLobby(page, 0);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene'))).toBe(true);
  await page.evaluate(() => {
    const manager = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene;
    const snake = manager.getScene('SnakeScene') as { scene: { pause(): void; launch(key: string, data: unknown): void } };
    snake.scene.pause();
    snake.scene.launch('GameOverScene', { scene: 'SnakeScene', title: 'TEST COMPLETE', difficulty: 'EASY' });
  });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('GameOverScene'))).toBe(true);
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[0] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('GameOverScene'))).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene'))).toBe(true);
});

test('open and dismiss the achievements overlay from a connected gamepad', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const controller = { axes: [0, 0, 0, 0], buttons, connected: true, hapticActuators: [], id: 'Xbox Wireless Controller', index: 0, mapping: 'standard', timestamp: 1, vibrationActuator: null };
    Object.assign(window, { arcadeTestController: controller });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [controller] });
  });
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[3] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('AchievementsScene'))).toBe(true);
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[3] = { pressed: false, touched: false, value: 0 };
    controller.buttons[1] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('AchievementsScene'))).toBe(false);
});

async function launchFromLobby(page: import('@playwright/test').Page, index: number) {
  await page.evaluate(({ index }) => {
    const manager = (window as typeof window & { game: { scene: { stop(key: string): void; start(key: string): void; getScene(key: string): unknown; getScenes(activeOnly?: boolean): Array<{ scene: { key: string } }> } } }).game.scene;
    for (const active of manager.getScenes(true)) if (active.scene.key !== 'LobbyScene') manager.stop(active.scene.key);
    manager.start('LobbyScene');
    const lobby = manager.getScene('LobbyScene') as { selectedGameIndex: number; handleSpace(): void };
    lobby.selectedGameIndex = index;
    lobby.handleSpace();
  }, { index });
  await page.waitForTimeout(220);
  await page.evaluate(() => {
    const lobby = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('LobbyScene') as { handleSpace(): void };
    lobby.handleSpace();
  });
}
