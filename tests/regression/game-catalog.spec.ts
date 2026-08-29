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
  expect(scenes).toHaveLength(29);

  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    await launchFromLobby(page, index);
    await expect.poll(() => page.evaluate(key => {
      return (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive(key);
    }, scene), { timeout: 20000, message: `Launch ${scene}` }).toBe(true);
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

test('retain active launch settings when restarting from Pause', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await launchFromLobby(page, 2);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('AsteroidsScene'))).toBe(true);
  await page.evaluate(() => {
    const manager = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene;
    const source = manager.getScene('AsteroidsScene') as { scene: { restart(data: object): void; pause(): void; launch(key: string, data: object): void } };
    source.scene.restart({ difficulty: 'EXPERT', mode: 'COOP' });
    source.scene.pause();
    source.scene.launch('PauseScene', { scene: 'AsteroidsScene' });
  });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('PauseScene'))).toBe(true);
  await page.evaluate(() => {
    const pause = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('PauseScene') as unknown as { selectedIndex: number; select(): void };
    pause.selectedIndex = 1;
    pause.select();
  });
  await expect.poll(() => page.evaluate(() => {
    const source = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene.getScene('AsteroidsScene') as { difficulty: string; mode: string };
    return { difficulty: source.difficulty, mode: source.mode };
  })).toEqual({ difficulty: 'EXPERT', mode: 'COOP' });
});

test('open Pause with Escape in an advanced scene without returning to the lobby', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await launchFromLobby(page, 25);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('HorizonScene'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('PauseScene'))).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('LobbyScene'))).toBe(false);
});

test('close an open utility panel before pausing the active game', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  await launchFromLobby(page, 0);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene'))).toBe(true);
  await page.evaluate(() => { (document.querySelector<HTMLElement>('.save-state-panel')!).hidden = false; });
  await page.keyboard.press('Escape');
  await expect.poll(() => page.locator('.save-state-panel').evaluate(element => (element as HTMLElement).hidden)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('PauseScene'))).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene'))).toBe(true);
});

test('do not pause gameplay through an open utility panel from controller Start', async ({ page }) => {
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
  await page.evaluate(() => { (document.querySelector<HTMLElement>('.save-state-panel')!).hidden = false; });
  await page.evaluate(() => {
    const controller = (window as typeof window & { arcadeTestController: { buttons: Array<{ pressed: boolean; touched: boolean; value: number }> } }).arcadeTestController;
    controller.buttons[9] = { pressed: true, touched: true, value: 1 };
  });
  await page.waitForTimeout(150);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('PauseScene'))).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene'))).toBe(true);
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

test('quit a finished game from the shared controller game-over overlay', async ({ page }) => {
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
    controller.buttons[1] = { pressed: true, touched: true, value: 1 };
  });
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('GameOverScene'))).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('LobbyScene'))).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('SnakeScene'))).toBe(false);
});

test('do not pause the shared game-over overlay from controller Start', async ({ page }) => {
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
    controller.buttons[9] = { pressed: true, touched: true, value: 1 };
  });
  await page.waitForTimeout(150);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('GameOverScene'))).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('PauseScene'))).toBe(false);
});

test('route classic replica endings through the shared game-over overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app canvas').first().waitFor();
  const endings = [
    { index: 0, scene: 'SnakeScene', method: 'triggerGameOver' },
    { index: 5, scene: 'InvadersScene', method: 'triggerGameOver' },
    { index: 6, scene: 'TetrisScene', method: 'triggerGameOver' },
  ];

  for (const ending of endings) {
    await launchFromLobby(page, ending.index);
    await expect.poll(() => page.evaluate(scene => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive(scene), ending.scene)).toBe(true);
    await expect(page.evaluate(({ scene, method }) => {
      const manager = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene;
      const game = manager.getScene(scene) as unknown as Record<string, unknown>;
      return `${scene}:${typeof game[method]}`;
    }, ending)).resolves.toBe(`${ending.scene}:function`);
    await page.evaluate(({ scene, method }) => {
      const manager = (window as typeof window & { game: { scene: { getScene(key: string): unknown } } }).game.scene;
      const game = manager.getScene(scene) as unknown as Record<string, () => void>;
      game[method]();
    }, ending);
    await expect.poll(() => page.evaluate(() => (window as typeof window & { game: { scene: { isActive(key: string): boolean } } }).game.scene.isActive('GameOverScene'))).toBe(true);
    await page.evaluate(scene => {
      const manager = (window as typeof window & { game: { scene: { stop(key: string): void } } }).game.scene;
      manager.stop('GameOverScene');
      manager.stop(scene);
    }, ending.scene);
  }
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
