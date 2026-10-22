import Phaser from "phaser";
import { InputManager } from "../engine/InputManager";
import { mountGameScene } from "../ui/menu/SceneLifecycle";
import { SpatialAudioField } from "../audio/spatial/SpatialAudioField";
import { cabinetAudioManager } from "../core/audio/CabinetAudioManager";
import {
  canOccupy,
  castRay,
  wallPattern,
} from "../games/raycaster/RaycasterSystems";
import {
  generateArcadeHall,
  nearestCabinet,
  validatePresence,
  type ArcadeCabinet,
  type ArcadeHall,
  type PresenceState,
} from "./ArcadeHallSystems";
interface Billboard {
  x: number;
  y: number;
  kind: "CABINET" | "REMOTE";
  label: string;
  color: number;
}
export default class MetaArcadeScene extends Phaser.Scene {
  private view!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hall!: ArcadeHall;
  private x = 2;
  private y = 2;
  private angle = 0;
  private fireHeld = false;
  private z = new Float32Array(160);
  private readonly audioField = new SpatialAudioField();
  private readonly remotes = new Map<string, PresenceState>();
  constructor() {
    super("MetaArcadeScene");
  }
  create() {
    this.hall = generateArcadeHall();
    this.x = this.hall.dungeon.spawn.x;
    this.y = this.hall.dungeon.spawn.y;
    this.view = this.add.graphics();
    this.hud = this.add
      .text(12, 43, "", {
        fontFamily: "Courier",
        fontSize: "13px",
        color: "#ffffff",
      })
      .setDepth(30);
    this.add
      .text(320, 16, "BIOSSYSTEM META-ARCADE // PROCEDURAL HALL", {
        fontFamily: "Courier",
        fontSize: "17px",
        color: "#00ffcc",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.add
      .text(628, 462, "W/S MOVE  A/D TURN  SPACE ENTER CABINET  ESC PAUSE", {
        fontFamily: "Courier",
        fontSize: "9px",
        color: "#88aaaa",
      })
      .setOrigin(1, 0.5)
      .setDepth(30);
    this.audioField.initialize(
      this.hall.cabinets.map((cabinet) => ({
        id: cabinet.id,
        x: cabinet.x,
        y: cabinet.y,
        frequency: cabinet.frequency,
      })),
    );
    window.addEventListener("arcade-hub-presence", this.receivePresence);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("arcade-hub-presence", this.receivePresence);
      this.audioField.destroy();
    });
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    void cabinetAudioManager.play("MetaArcadeScene");
  }
  update(_time: number, delta: number) {
    const dt = Math.min(50, delta) / 1000;
    const turn =
      InputManager.isP1Down("LEFT") === InputManager.isP1Down("RIGHT")
        ? 0
        : InputManager.isP1Down("LEFT")
          ? -1
          : 1;
    const move =
      InputManager.isP1Down("UP") === InputManager.isP1Down("DOWN")
        ? 0
        : InputManager.isP1Down("UP")
          ? 1
          : -0.65;
    this.angle += turn * dt * 2;
    const nx = this.x + Math.cos(this.angle) * move * dt * 2.5;
    const ny = this.y + Math.sin(this.angle) * move * dt * 2.5;
    if (canOccupy(this.hall.dungeon, nx, this.y)) this.x = nx;
    if (canOccupy(this.hall.dungeon, this.x, ny)) this.y = ny;
    const fire = InputManager.isP1Down("FIRE");
    const near = nearestCabinet(this.hall.cabinets, this.x, this.y);
    if (fire && !this.fireHeld && near) void this.enter(near);
    this.fireHeld = fire;
    this.audioField.update(this.x, this.y, this.angle);
    window.dispatchEvent(
      new CustomEvent("arcade-hub-local", {
        detail: { x: this.x, y: this.y, angle: this.angle },
      }),
    );
    this.render(near);
  }
  private render(near?: ArcadeCabinet) {
    this.view
      .clear()
      .fillGradientStyle(0x120625, 0x07152d, 0x24103d, 0x0b1628)
      .fillRect(0, 0, 640, 240)
      .fillGradientStyle(0x10182a, 0x10182a, 0x02050b, 0x02050b)
      .fillRect(0, 240, 640, 240);
    for (let lane = -8; lane <= 8; lane++) this.view.lineStyle(1, lane % 2 ? 0x1b6681 : 0x7e2d88, .18).lineBetween(320, 240, 320 + lane * 78, 452);
    for (let depth = 1; depth <= 9; depth++) { const y = 240 + 205 / depth; this.view.lineStyle(1, 0x45a6b5, .13).lineBetween(0, y, 640, y); }
    for (let light = 0; light < 5; light++) this.view.fillStyle(light % 2 ? 0xff49c8 : 0x42ffe4, .1).fillRoundedRect(52 + light * 128, 72, 74, 6, 3);
    for (let ray = 0; ray < 160; ray++) {
      const rayAngle = this.angle - Math.PI / 6 + ((ray / 160) * Math.PI) / 3;
      const hit = castRay(this.hall.dungeon, this.x, this.y, rayAngle);
      const distance = hit.distance * Math.cos(rayAngle - this.angle);
      this.z[ray] = distance;
      const height = Math.min(480, 480 / distance);
      const shade =
        wallPattern(hit.mapX, hit.mapY, hit.textureX, 0.5, 0x4d455441) *
        Math.max(0.2, 1 - distance / 20);
      this.view
        .fillStyle(
          (Math.floor(20 + shade * 30) << 16) |
            (Math.floor(30 + shade * 80) << 8) |
            Math.floor(70 + shade * 150),
        )
        .fillRect(ray * 4, (480 - height) / 2, 5, height);
      if (ray % 20 === 0) this.view.fillStyle(0x7beeff, .08).fillRect(ray * 4, (480 - height) / 2, 2, height);
    }
    const sprites: Billboard[] = this.hall.cabinets.map((cabinet) => ({
      x: cabinet.x,
      y: cabinet.y,
      kind: "CABINET",
      label: cabinet.label,
      color: 0x00ffcc,
    }));
    for (const remote of this.remotes.values())
      sprites.push({
        x: remote.x,
        y: remote.y,
        kind: "REMOTE",
        label: remote.peerId,
        color: 0xff2ec4,
      });
    this.renderSprites(sprites);
    this.hud.setText(
      `${near ? `SPACE: ${near.label}` : "EXPLORE THE ARCADE"}  PEERS ${this.remotes.size}`,
    );
  }
  private renderSprites(sprites: Billboard[]) {
    const visible = sprites
      .map((sprite) => ({
        sprite,
        distance: Math.hypot(sprite.x - this.x, sprite.y - this.y),
        angle: wrap(
          Math.atan2(sprite.y - this.y, sprite.x - this.x) - this.angle,
        ),
      }))
      .filter((item) => Math.abs(item.angle) < Math.PI / 4)
      .sort((a, b) => b.distance - a.distance);
    for (const item of visible) {
      const sx = 320 + (item.angle / (Math.PI / 6)) * 320;
      const ray = Math.max(0, Math.min(159, Math.floor(sx / 4)));
      if (item.distance > this.z[ray] + 0.3) continue;
      const size = Math.min(180, 170 / Math.max(0.4, item.distance));
      if (item.sprite.kind === "CABINET")
        this.view
          .fillStyle(item.sprite.color, .12)
          .fillCircle(sx, 240, size * .72)
          .fillStyle(0x080b16)
          .fillRoundedRect(sx - size * .46, 240 - size * .56, size * .92, size * 1.05, Math.max(2, size * .06))
          .lineStyle(3, item.sprite.color)
          .strokeRoundedRect(sx - size * .46, 240 - size * .56, size * .92, size * 1.05, Math.max(2, size * .06))
          .fillStyle(item.sprite.color, 0.6)
          .fillRect(sx - size * .34, 240 - size * .43, size * .68, size * .12)
          .fillStyle(0x10283a).fillRect(sx - size * .32, 240 - size * .25, size * .64, size * .34)
          .fillStyle(0xcaffff, .84).fillRect(sx - size * .25, 240 - size * .19, size * .5, size * .1)
          .fillStyle(0x11192b).fillRect(sx - size * .34, 240 + size * .16, size * .68, size * .18)
          .fillStyle(item.sprite.color, .92).fillCircle(sx - size * .13, 240 + size * .25, Math.max(2, size * .035)).fillCircle(sx + size * .13, 240 + size * .25, Math.max(2, size * .035));
      else
        this.view
          .fillStyle(item.sprite.color, .14).fillCircle(sx, 240, size * .42)
          .fillStyle(item.sprite.color).fillCircle(sx, 240 - size * .13, size * .15)
          .fillRoundedRect(sx - size * .12, 240, size * .24, size * .4, Math.max(2, size * .05))
          .fillStyle(0xeaffff, .9).fillRect(sx - size * .08, 240 - size * .16, size * .16, Math.max(2, size * .035));
    }
  }
  private async enter(cabinet: ArcadeCabinet) {
    await mountGameScene(
      {
        has: (key) => Boolean(this.scene.manager.keys[key]),
        add: (key, SceneClass) => this.scene.add(key, SceneClass, false),
        start: (key, data) => this.scene.start(key, data),
      },
      cabinet.scene,
      { difficulty: "NORMAL", mode: "SOLO" },
    );
  }
  private receivePresence = (event: Event) => {
    const state = validatePresence((event as CustomEvent).detail);
    if (state) this.remotes.set(state.peerId, state);
  };
}
function wrap(value: number) {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
