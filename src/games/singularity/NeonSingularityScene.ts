import Phaser from "phaser";
import { AudioEngine } from "../../engine/AudioEngine";
import { InputManager } from "../../engine/InputManager";
import { compileNeuralTerrainPipeline } from "../../engine/neural/NeuralTerrain";
import { WebXrSessionController } from "../../engine/xr/WebXrSession";
import { probeBroadcastSupport } from "../../engine/broadcasting/WebCodecsBroadcaster";
import { compilePathTracingPipeline } from "../../graphics/pathtracing/PathTracingCompute";
import {
  singularityCore,
  singularityDistributedDiagnostics,
} from "./SingularitySystems";

export default class NeonSingularityScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private seed = 127;
  private core = singularityCore(this.seed);
  constructor() {
    super("SingularityScene");
  }
  create() {
    this.seed = 127;
    this.core = singularityCore(this.seed);
    this.gfx = this.add.graphics();
    this.hud = this.add
      .text(12, 43, "", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#ffffff",
        lineSpacing: 4,
      })
      .setDepth(4);
    this.add
      .text(320, 18, "THE SINGULARITY // INFINITE GENERATED WORLDS", {
        fontFamily: "Courier",
        fontSize: "17px",
        color: "#ff66dd",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.add
      .text(320, 460, "SPACE NEW WORLD  O NEON OS  X XR  ESC PAUSE", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#88aacc",
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.seed++;
      this.core = singularityCore(this.seed);
      this.draw();
      AudioEngine.playEffect("POWER_UP");
    });
    this.input.keyboard?.on("keydown-O", () => this.scene.start("OsScene"));
    this.input.keyboard?.on("keydown-X", () => void this.enterXr());
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    InputManager.setLegacyGamepadKeyboardBridge(true, this.scene.key);
    this.events.once("shutdown", () =>
      InputManager.setLegacyGamepadKeyboardBridge(false, this.scene.key),
    );
    this.draw();
    AudioEngine.playTrack("odyssey");
  }
  private draw() {
    const g = this.gfx.clear(),
      frame = this.core.frame,
      scaleX = 640 / frame.width,
      scaleY = 360 / frame.height;
    g.fillGradientStyle(0x020613, 0x0a1530, 0x18102c, 0x061827).fillRect(0, 0, 640, 480);
    g.fillStyle(0x061324, .92).fillRect(8, 56, 624, 366).lineStyle(2, 0x4e9ec4, .64).strokeRect(8, 56, 624, 366);
    for (let pixel = 0; pixel < frame.width * frame.height; pixel++) {
      const offset = pixel * 3,
        tone = (value: number) =>
          Math.max(0, Math.min(255, Math.round(Math.pow(1 - Math.exp(-value), .62) * 255))),
        color = Phaser.Display.Color.GetColor(
          tone(frame.color[offset] as number),
          tone(frame.color[offset + 1] as number),
          tone(frame.color[offset + 2] as number),
        );
      g.fillStyle(color).fillRect(
        10 + (pixel % frame.width) * scaleX,
        59 + Math.floor(pixel / frame.width) * scaleY,
        Math.ceil(scaleX),
        Math.ceil(scaleY),
      );
    }
    for (let index = 0; index < 64; index++) {
      const x = index % 16,
        y = Math.floor(index / 16),
        biome = this.core.terrain.biome[index] as number,
        mineral = this.core.terrain.mineral[index] as number;
      g.fillStyle(
        [0x111429, 0x6f8fa8, 0x2fa85e, 0xd6a94e, 0xd73a3a][biome] as number,
        0.55 + mineral / 600,
      ).fillRect(20 + x * 8, 365 + y * 8, 7, 7);
    }
    g.fillStyle(0x06152a, .88).fillRoundedRect(14, 358, 150, 54, 6).lineStyle(1, 0x57c7e8, .62).strokeRoundedRect(14, 358, 150, 54, 6)
      .fillStyle(0xb4efff, .78).fillRect(20, 360, 128, 2);
    g.fillStyle(0x030812, .68).fillRoundedRect(470, 365, 142, 46, 18).lineStyle(2, 0xff44cc, .7)
      .strokeEllipse(540, 388, 92, 36).lineStyle(1, 0x00ffff, .82).strokeEllipse(540, 388, 62, 62)
      .lineStyle(1, 0xffffff, .72).lineBetween(534, 388, 546, 388).lineBetween(540, 382, 540, 394);
    this.hud.setText(
      `WORLD ${this.seed}  TERRAIN ${this.core.terrain.checksum.toString(16).padStart(8, "0")}  LIGHT ${this.core.lightChecksum.toString(16).padStart(8, "0")}\nNEURAL FIXED-POINT  PATH CPU REFERENCE  QUANTUM BRANCH ${this.core.quantumBranch}  ARCH ${this.core.architectures}`,
    );
  }
  private async enterXr() {
    const support = await WebXrSessionController.support();
    if (!support.vr) {
      this.hud.setText(`${this.hud.text}\nXR UNAVAILABLE`);
      return;
    }
    const controller = new WebXrSessionController();
    await controller.start("immersive-vr", 90);
  }
  async singularityDiagnostics() {
    const distributed = await singularityDistributedDiagnostics(this.seed),
      [terrainGpu, pathGpu, broadcast, xr] = await Promise.all([
        compileNeuralTerrainPipeline(),
        compilePathTracingPipeline(),
        probeBroadcastSupport(640, 480),
        WebXrSessionController.support(),
      ]);
    return {
      ...distributed,
      terrainGpu,
      pathGpu,
      broadcast: broadcast.supported,
      xr,
    };
  }
}
