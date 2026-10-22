import Phaser from "phaser";
import { AudioEngine } from "../../engine/AudioEngine";
import {
  buildFlowField,
  dispatchUnits,
  fogMask,
  generateTacticsMap,
} from "./TacticsSystems";
import { TacticsBrain } from "./TacticsBrain";
export default class NeonTacticsScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private map = generateTacticsMap();
  private units = new Float32Array(1000 * 4);
  private count = 160;
  private selected = new Uint8Array(1000);
  private target = { x: 40, y: 26 };
  private resources = 500;
  private bases: { x: number; y: number; enemy: boolean }[] = [
    { x: 4, y: 4, enemy: false },
    { x: 43, y: 27, enemy: true },
  ];
  private drag?: { x: number; y: number };
  private brain = new TacticsBrain();
  private aiAt = 0;
  constructor() {
    super("TacticsScene");
  }
  create() {
    this.map = generateTacticsMap();
    this.count = 160;
    this.resources = 500;
    for (let i = 0; i < this.count; i++) {
      this.units[i * 4] = 3 + (i % 12) * 0.18;
      this.units[i * 4 + 1] = 3 + Math.floor(i / 12) * 0.18;
      this.units[i * 4 + 2] = 0;
      this.units[i * 4 + 3] = 0;
    }
    this.gfx = this.add.graphics();
    this.hud = this.add
      .text(10, 43, "", {
        fontFamily: "Courier",
        fontSize: "12px",
        color: "#d6ece9",
      })
      .setDepth(5);
    this.add
      .text(320, 17, "NEON TACTICS // SIGNAL FRONT", {
        fontFamily: "Courier",
        fontSize: "18px",
        color: "#9ee5df",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(320, 466, "DRAG SELECT   CLICK MOVE   B BUILD   ESC PAUSE", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#7f9fa4",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.drag = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) =>
      this.release(pointer),
    );
    this.input.keyboard?.on("keydown-B", () => this.buildBase());
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    AudioEngine.playTrack("tactics");
  }
  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const field = buildFlowField(this.map, this.target);
    dispatchUnits(this.units, field.directions, this.map.width, this.count);
    for (let i = 0; i < this.count; i++) {
      const o = i * 4;
      if (this.selected[i]) {
        this.units[o] += this.units[o + 2] * dt * 2.3;
        this.units[o + 1] += this.units[o + 3] * dt * 2.3;
      }
      const cell =
        Math.floor(this.units[o + 1]) * this.map.width +
        Math.floor(this.units[o]);
      if (this.map.resources[cell] > 0) {
        const gathered = Math.min(1, this.map.resources[cell]);
        this.map.resources[cell] -= gathered;
        this.resources += gathered;
      }
    }
    if (this.time.now >= this.aiAt) {
      const action = this.brain.decide(
        [
          this.resources / 1000,
          this.count / 1000,
          this.bases.length / 8,
          this.target.x / 48,
          this.target.y / 32,
          0,
        ],
        this.count / 1000,
      );
      if (action === 0) this.target = { x: 4, y: 4 };
      if (action === 1) this.target = { x: 24, y: 16 };
      if (action === 2 && this.count < 1000) this.spawn(8);
      this.aiAt = this.time.now + 800;
    }
    this.draw();
  }
  private release(pointer: Phaser.Input.Pointer) {
    if (!this.drag) return;
    const ox = 8,
      oy = 72,
      sx = 13,
      sy = 12,
      minX = (Math.min(this.drag.x, pointer.x) - ox) / sx,
      maxX = (Math.max(this.drag.x, pointer.x) - ox) / sx,
      minY = (Math.min(this.drag.y, pointer.y) - oy) / sy,
      maxY = (Math.max(this.drag.y, pointer.y) - oy) / sy;
    let selected = 0;
    for (let i = 0; i < this.count; i++) {
      const x = this.units[i * 4],
        y = this.units[i * 4 + 1];
      this.selected[i] =
        x >= minX && x <= maxX && y >= minY && y <= maxY ? 1 : 0;
      selected += this.selected[i];
    }
    if (selected === 0)
      this.target = {
        x: Phaser.Math.Clamp(
          Math.floor((pointer.x - ox) / sx),
          0,
          this.map.width - 1,
        ),
        y: Phaser.Math.Clamp(
          Math.floor((pointer.y - oy) / sy),
          0,
          this.map.height - 1,
        ),
      };
    this.drag = undefined;
  }
  private buildBase() {
    if (this.resources < 200 || this.bases.length >= 8) return;
    this.resources -= 200;
    this.bases.push({ x: this.target.x, y: this.target.y, enemy: false });
    this.spawn(12);
    AudioEngine.playEffect("POWER_UP");
  }
  private spawn(amount: number) {
    for (let n = 0; n < amount && this.count < 1000; n++, this.count++) {
      this.units[this.count * 4] = 4 + (n % 4) * 0.2;
      this.units[this.count * 4 + 1] = 4 + Math.floor(n / 4) * 0.2;
    }
  }
  private draw() {
    const sx = 13,
      sy = 12,
      ox = 8,
      oy = 72,
      visible = fogMask(this.map, this.units, this.count, 5),
      g = this.gfx;
    g.clear()
      .fillGradientStyle(0x07111d, 0x07111d, 0x03070d, 0x03070d)
      .fillRect(0, 0, 640, 480)
      .fillStyle(0x0b1825)
      .fillRoundedRect(5, 68, 630, 392, 8);
    for (let y = 0; y < this.map.height; y++)
      for (let x = 0; x < this.map.width; x++) {
        const cell = y * this.map.width + x,
          px = ox + x * sx,
          py = oy + y * sy;
        if (!visible[cell]) {
          g.fillStyle((x + y) % 2 ? 0x08131f : 0x0a1724).fillRect(
            px,
            py,
            sx - 1,
            sy - 1,
          );
          continue;
        }
        if (this.map.terrain[cell])
          g.fillStyle(0x244459)
            .fillRect(px, py, sx - 1, sy - 1)
            .fillStyle(0x547181, 0.35)
            .fillRect(px + 2, py + 2, sx - 5, 2)
            .lineStyle(1, 0x7ca1ad, .14).lineBetween(px + 2, py + sy - 3, px + sx - 3, py + 3);
        else {
          g.fillStyle(0x102638).fillRect(px, py, sx - 1, sy - 1);
          if (this.map.resources[cell])
            g.fillStyle(0xffd85c, .12).fillCircle(px + 6, py + 6, 8)
              .fillStyle(0xd6c45e)
              .fillTriangle(px + 6, py + 2, px + 10, py + 6, px + 6, py + 10)
              .fillTriangle(px + 6, py + 2, px + 2, py + 6, px + 6, py + 10);
        }
      }
    for (const base of this.bases) {
      const x = ox + base.x * sx,
        y = oy + base.y * sy,
        color = base.enemy ? 0xe05b68 : 0x55c5bb;
      g.fillStyle(color, .12).fillCircle(x, y, 19)
        .lineStyle(1, color, .38).strokeCircle(x, y, 16)
        .fillStyle(0x071019)
        .fillRoundedRect(x - 10, y - 10, 22, 22, 4)
        .fillStyle(color)
        .fillTriangle(x, y - 9, x - 8, y + 7, x + 8, y + 7)
        .fillStyle(0xdce8e2)
        .fillRect(x - 3, y - 2, 6, 5)
        .lineStyle(1, color, .9).lineBetween(x, y - 10, x, y - 16).strokeCircle(x, y - 18, 2);
    }
    for (let i = 0; i < this.count; i++) {
      const o = i * 4,
        x = ox + this.units[o] * sx,
        y = oy + this.units[o + 1] * sy,
        selected = this.selected[i],
        color = selected ? 0xffe88d : i % 5 ? 0x59c9dc : 0xc078ff,
        size = i % 5 ? 3 : 4;
      if (selected) g.lineStyle(1, 0xffe88d, .72).strokeCircle(x, y, 6);
      g.fillStyle(color, .14).fillCircle(x, y, 6).fillStyle(color, .94).fillTriangle(x, y - size, x - size, y + size, x + size, y + size).fillStyle(0xeaffff, .78).fillRect(x - 1, y - 1, 2, 2);
    }
    const tx = ox + this.target.x * sx,
      ty = oy + this.target.y * sy;
    g.lineStyle(1, 0xe1cf6d, 0.8)
      .strokeCircle(tx, ty, 8)
      .lineBetween(tx - 11, ty, tx + 11, ty)
      .lineBetween(tx, ty - 11, tx, ty + 11);
    g.fillStyle(0x040914, 0.9).fillRect(0, 0, 640, 67);
    this.hud.setText(
      `UNITS ${this.count}   CREDITS ${Math.floor(this.resources)}   OUTPOSTS ${this.bases.length}`,
    );
  }
}
