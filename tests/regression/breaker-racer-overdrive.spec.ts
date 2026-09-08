import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bios_arcade_free_play", "true");
    localStorage.setItem("arcade_visual_mode", "OVERDRIVE_2026");
  });
});

test("boot Neon Breaker and advance a live ball through the shared cabinet flow", async ({
  page,
}) => {
  await launchFromLobby(page, 3, "BreakoutScene");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as typeof window & {
            game: { scene: { getScene(key: string): unknown } };
          }
        ).game.scene.getScene("BreakoutScene") as {
          balls: { countActive(): number };
        };
        return scene.balls.countActive();
      }),
    )
    .toBeGreaterThan(0);
});

test("render distinct Breaker power-ups and freeze their motion-safe transforms", async ({
  page,
}) => {
  await launchFromLobby(page, 3, "BreakoutScene");
  const textures = await page.evaluate(() => {
    const scene = (window as any).game.scene.getScene("BreakoutScene");
    (["LASER", "MULTI", "STICKY", "SLOW"] as const).forEach((type, index) =>
      scene.spawnDrop(180 + index * 80, 180, type),
    );
    return scene.drops.getChildren().map((drop: any) => drop.texture.key);
  });
  expect(new Set(textures).size).toBe(4);
  await page.waitForTimeout(120);
  const animated = await page.evaluate(() => {
    const scene = (window as any).game.scene.getScene("BreakoutScene");
    return scene.drops
      .getChildren()
      .some(
        (drop: any) =>
          Math.abs(drop.rotation) > 0.01 || Math.abs(drop.scaleX - 1) > 0.01,
      );
  });
  expect(animated).toBe(true);
  await page.evaluate(() =>
    document.documentElement.classList.add("motion-reduced"),
  );
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (window as any).game.scene.getScene("BreakoutScene");
        return scene.drops
          .getChildren()
          .every(
            (drop: any) =>
              drop.rotation === 0 && drop.scaleX === 1 && drop.scaleY === 1,
          );
      }),
    )
    .toBe(true);
});

test("boot Cyber-Racer and advance deterministic throttle progression", async ({
  page,
}) => {
  await launchFromLobby(page, 11, "RacerScene");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(220);
  await page.keyboard.up("KeyW");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (
          window as typeof window & {
            game: { scene: { getScene(key: string): unknown } };
          }
        ).game.scene.getScene("RacerScene") as {
          speed: number;
          distance: number;
        };
        return { speed: scene.speed, distance: scene.distance };
      }),
    )
    .toMatchObject({ speed: expect.any(Number), distance: expect.any(Number) });
  const progress = await page.evaluate(() => {
    const scene = (
      window as typeof window & {
        game: { scene: { getScene(key: string): unknown } };
      }
    ).game.scene.getScene("RacerScene") as { speed: number; distance: number };
    return { speed: scene.speed, distance: scene.distance };
  });
  expect(progress.speed).toBeGreaterThan(0);
  expect(progress.distance).toBeGreaterThan(0);
});

async function launchFromLobby(page: Page, index: number, scene: string) {
  await page.goto("/");
  await page.locator("#app canvas").first().waitFor();
  await page.evaluate(
    ({ index }) => {
      const lobby = (
        window as typeof window & {
          game: { scene: { getScene(key: string): unknown } };
        }
      ).game.scene.getScene("LobbyScene") as {
        selectedGameIndex: number;
        handleSpace(): void;
      };
      lobby.selectedGameIndex = index;
      lobby.handleSpace();
    },
    { index },
  );
  await page.waitForTimeout(220);
  await page.evaluate(() =>
    (
      (
        window as typeof window & {
          game: { scene: { getScene(key: string): unknown } };
        }
      ).game.scene.getScene("LobbyScene") as { handleSpace(): void }
    ).handleSpace(),
  );
  await expect
    .poll(
      () =>
        page.evaluate(
          (key) =>
            (
              window as typeof window & {
                game: { scene: { isActive(key: string): boolean } };
              }
            ).game.scene.isActive(key),
          scene,
        ),
      { timeout: 10000 },
    )
    .toBe(true);
}
