import Phaser from "phaser";
import { AudioEngine } from "../../engine/AudioEngine";
import { InputManager } from "../../engine/InputManager";
import {
  stepRelativisticCombat,
  type RelativisticState,
} from "../../engine/physics/relativistic";
import { compileNeuralTexturePipeline } from "../../graphics/neural/NeuralTexture";
import { compileHorizonLensingPipeline } from "../../graphics/pathtracing/HorizonLensing";
import { horizonCore, horizonCryptoDiagnostics } from "./HorizonSystems";

export default class NeonEventHorizonScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private seed = 149;
  private core = horizonCore(this.seed);
  private ship: RelativisticState = this.core.state;
  constructor() {
    super("HorizonScene");
  }
  create() {
    this.seed = 149;
    this.core = horizonCore(this.seed);
    this.ship = {
      x: 310,
      y: 0,
      vx: 620,
      vy: 80,
      coordinateTime: 0,
      properTime: 0,
      frequencyShift: 1,
    };
    this.gfx = this.add.graphics();
    this.hud = this.add
      .text(10, 42, "", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#ffffff",
        lineSpacing: 4,
      })
      .setDepth(4);
    this.add
      .text(320, 18, "NEON EVENT HORIZON // RELATIVISTIC COMBAT", {
        fontFamily: "Courier",
        fontSize: "17px",
        color: "#ff7755",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.add
      .text(320, 460, "WASD THRUST  SPACE FIRE  ESC PAUSE", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#89aacc",
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.input.keyboard?.on("keydown-SPACE", () =>
      AudioEngine.playEffect("LASER"),
    );
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    AudioEngine.playTrack("space");
  }
  update(_time: number, delta: number) {
    const thrust =
        Number(InputManager.isDown("KeyW")) -
        Number(InputManager.isDown("KeyS")),
      turn =
        Number(InputManager.isDown("KeyD")) -
        Number(InputManager.isDown("KeyA"));
    this.ship = stepRelativisticCombat(
      this.ship,
      { thrust, turn },
      delta / 1000,
      { x: 0, y: 0, mass: 300_000 },
    );
    this.draw();
  }
  private draw() {
    const g = this.gfx.clear(),
      centerX = 320,
      centerY = 246,
      properRatio = this.ship.coordinateTime
        ? this.ship.properTime / this.ship.coordinateTime
        : 1;
    g.fillGradientStyle(0x020510, 0x10163a, 0x3a102a, 0x06152b).fillRect(
      0,
      0,
      640,
      480,
    );
    for (let star = 0; star < 74; star++) { const x = (star * 83) % 640, y = 67 + (star * 47) % 348, size = star % 11 ? 1 : 2; g.fillStyle(star % 5 ? 0xa4d7ff : 0xffb96e, .26 + (star % 3) * .15).fillCircle(x, y, size); }
    g.fillStyle(0x40192a, .14).fillEllipse(centerX, centerY, 408, 184).fillStyle(0xdb4b39, .08).fillEllipse(centerX, centerY, 314, 126);
    for (let ring = 12; ring > 0; ring--) {
      const radius = 26 + ring * 13,
        bend = 1 + 20 / radius;
      g.lineStyle(
        2 + (ring % 2),
        Phaser.Display.Color.GetColor(255, 40 + ring * 12, 10 + ring * 7),
        0.12 + ring * 0.035,
      ).strokeEllipse(centerX, centerY, radius * 2 * bend, radius * 0.62);
    }
    g.fillStyle(0x000000)
      .fillCircle(centerX, centerY, 52)
      .lineStyle(3, 0xffcc66, 0.8).strokeCircle(centerX, centerY, 57)
      .lineStyle(1, 0xfff1c1, .62).strokeCircle(centerX, centerY, 64);
    const texture = this.core.texture;
    for (let index = 0; index < 96; index++) {
      const tx = index % 12,
        ty = Math.floor(index / 12),
        source = (ty * texture.width + tx) * 4,
        color = Phaser.Display.Color.GetColor(
          texture.pixels[source] as number,
          texture.pixels[source + 1] as number,
          texture.pixels[source + 2] as number,
        );
      g.fillStyle(color, 0.75).fillRect(24 + tx * 6, 366 + ty * 6, 5, 5);
    }
    const angle = Math.atan2(this.ship.y, this.ship.x),
      orbit = 150 + Math.sin(this.ship.coordinateTime) * 22,
      shipX = centerX + Math.cos(angle) * orbit,
      shipY = centerY + Math.sin(angle) * orbit * 0.45;
    g.fillStyle(0x00ffff, .13).fillCircle(shipX, shipY, 24)
      .fillStyle(0x0b2540, .96).fillTriangle(shipX + 13, shipY, shipX - 9, shipY - 8, shipX - 9, shipY + 8)
      .lineStyle(2, 0x64ffff, .95).strokeTriangle(shipX + 13, shipY, shipX - 9, shipY - 8, shipX - 9, shipY + 8)
      .fillStyle(0xf4ffff, .9).fillRect(shipX - 4, shipY - 2, 7, 4)
      .fillStyle(0xff7b4e, .84).fillTriangle(shipX - 9, shipY - 4, shipX - 18, shipY, shipX - 9, shipY + 4);
    this.hud.setText(
      `SPEED ${(Math.hypot(this.ship.vx, this.ship.vy) / 10).toFixed(1)}% c  PROPER ${this.ship.properTime.toFixed(2)}  COORD ${this.ship.coordinateTime.toFixed(2)}\nTIME FACTOR ${properRatio.toFixed(3)}  DOPPLER ${this.ship.frequencyShift.toFixed(2)}x  SHARD ${this.core.shard.owners.join("+")}  PQ OTS READY`,
    );
  }
  async horizonDiagnostics() {
    const [diagnostics, neuralGpu, lensingGpu] = await Promise.all([
      horizonCryptoDiagnostics(this.seed),
      compileNeuralTexturePipeline(),
      compileHorizonLensingPipeline(),
    ]);
    return { ...diagnostics, neuralGpu, lensingGpu };
  }
}
