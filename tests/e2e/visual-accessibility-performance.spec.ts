import { expect, test } from "@playwright/test";

const scenes = [
  { index: 18, key: "DanmakuScene", dense: true },
  { index: 26, key: "SingularityScene", dense: false },
] as const;

test("retain motion-safe contrast and bounded frame cadence under low-quality high load", async ({
  page,
}, testInfo) => {
  test.setTimeout(45_000);
  await page.addInitScript(() => {
    sessionStorage.setItem("bios_post_complete", "true");
    localStorage.setItem("bios_arcade_free_play", "true");
    localStorage.setItem("arcade_reduced_motion", "true");
    localStorage.setItem("arcade_crt_quality", "LOW");
    localStorage.setItem("arcade_telemetry", "true");
  });
  await page.goto("/");
  await page.locator("#app canvas").first().waitFor();
  await expect(page.locator("html")).toHaveClass(/motion-reduced/);
  await expect(page.locator("html")).toHaveAttribute("data-crt-quality", "low");
  const hostP95 = await sampleFrameP95(page, 60);
  const frameBudget = Math.max(45, Math.min(75, hostP95 * 1.35));
  testInfo.annotations.push({
    type: "host-frame-budget",
    description: `baseline ${hostP95.toFixed(1)} ms; budget ${frameBudget.toFixed(1)} ms`,
  });

  for (const target of scenes) {
    await page.evaluate((index) => {
      const game = (window as any).game;
      game.scene.start("LobbyScene");
      const lobby = game.scene.getScene("LobbyScene");
      lobby.selectedGameIndex = index;
      lobby.handleSpace();
      lobby.handleSpace();
    }, target.index);
    await expect
      .poll(() =>
        page.evaluate(
          (key) => (window as any).game.scene.isActive(key),
          target.key,
        ),
      )
      .toBe(true);

    if (target.dense)
      await page.evaluate(() => {
        const scene = (window as any).game.scene.getScene("DanmakuScene");
        scene.projectiles.clear();
        for (let index = 0; index < 512; index++) {
          const angle = index * 2.399963;
          scene.projectiles.spawn({
            x: 320 + Math.cos(angle) * (90 + (index % 130)),
            y: 230 + Math.sin(angle) * (70 + (index % 110)),
            vx: Math.cos(angle) * 24,
            vy: Math.sin(angle) * 24,
            life: 4,
            kind: index % 4,
          });
        }
        scene.collide();
        if (scene.cameras.main.shakeEffect.isRunning)
          throw new Error("Reduced motion allowed camera shake");
      });

    const metrics = await page.evaluate(async () => {
      const deltas: number[] = [];
      let previous = performance.now();
      await new Promise<void>((resolve) => {
        const sample = (now: number) => {
          deltas.push(now - previous);
          previous = now;
          if (deltas.length === 90) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      const pixels = await new Promise<Uint8ClampedArray>((resolve) => {
        (window as any).game.renderer.snapshot((image: HTMLImageElement) => {
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          const context = canvas.getContext("2d")!;
          context.drawImage(image, 0, 0);
          resolve(context.getImageData(0, 0, 640, 480).data);
        });
      });
      let dark = 0,
        bright = 0;
      for (let offset = 0; offset < pixels.length; offset += 16) {
        const luma =
          pixels[offset] * 0.2126 +
          pixels[offset + 1] * 0.7152 +
          pixels[offset + 2] * 0.0722;
        if (luma < 36) dark++;
        if (luma > 118) bright++;
      }
      const ordered = deltas.slice(5).sort((a, b) => a - b);
      return {
        p95FrameMs: ordered[Math.ceil(ordered.length * 0.95) - 1],
        dark,
        bright,
      };
    });
    expect(
      metrics.p95FrameMs,
      `${target.key} LOW-quality p95; idle host ${hostP95.toFixed(1)} ms`,
    ).toBeLessThan(frameBudget);
    expect(
      metrics.dark,
      `${target.key} needs dark silhouette separation`,
    ).toBeGreaterThan(1000);
    expect(
      metrics.bright,
      `${target.key} needs bright silhouette separation`,
    ).toBeGreaterThan(40);
  }
});

async function sampleFrameP95(
  page: import("@playwright/test").Page,
  count: number,
) {
  return page.evaluate(async (sampleCount) => {
    const deltas: number[] = [];
    let previous = performance.now();
    await new Promise<void>((resolve) => {
      const sample = (now: number) => {
        deltas.push(now - previous);
        previous = now;
        if (deltas.length === sampleCount) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const ordered = deltas.slice(5).sort((a, b) => a - b);
    return ordered[Math.ceil(ordered.length * 0.95) - 1];
  }, count);
}
