import Phaser from "phaser";
import { VFXManager } from "../../engine/VFXManager";
import { AudioEngine } from "../../engine/AudioEngine";
import { InputManager } from "../../engine/InputManager";
import type { ArcadeMode } from "../../multiplayer/CoopSession";
import {
  canOccupy,
  castRay,
  generateBspDungeon,
  wallPattern,
  type Dungeon,
} from "./RaycasterSystems";
import { ArcadeHud } from "../../ui/arcade/NeonUi";

interface SpriteEntity {
  x: number;
  y: number;
  kind: "ENEMY" | "CORE" | "EXIT";
  health: number;
  hitUntil: number;
}
export default class NeonCyberCasterScene extends Phaser.Scene {
  private view!: Phaser.GameObjects.Graphics;
  private hud!: ArcadeHud;
  private dungeon!: Dungeon;
  private entities: SpriteEntity[] = [];
  private x = 2.5;
  private y = 2.5;
  private angle = 0;
  private level = 1;
  private score = 0;
  private health = 100;
  private fireHeld = false;
  private muzzleUntil = 0;
  private damageUntil = 0;
  private weaponKick = 0;
  private difficulty = "NORMAL";
  private mode: ArcadeMode = "SOLO";
  private readonly rays = 160;
  private readonly fov = Math.PI / 3;
  private zBuffer = new Float32Array(160);
  constructor() {
    super("RaycasterScene");
  }
  create(data: {
    difficulty?: string;
    mode?: ArcadeMode;
    level?: number;
    score?: number;
  }) {
    this.difficulty = data.difficulty ?? "NORMAL";
    this.mode = data.mode ?? "SOLO";
    this.level = data.level ?? 1;
    this.score = data.score ?? 0;
    this.health = 100;
    this.fireHeld = false;
    this.muzzleUntil = 0;
    this.damageUntil = 0;
    this.weaponKick = 0;
    this.dungeon = generateBspDungeon(this.level);
    this.x = this.dungeon.spawn.x;
    this.y = this.dungeon.spawn.y;
    this.angle = 0;
    this.entities = this.makeEntities();
    this.view = this.add.graphics();
    this.hud = new ArcadeHud(this, 8, 8, 624, 0x00ffcc);
    this.add
      .text(628, 48, "MOVE W/S  TURN A/D  FIRE SPACE  ESC PAUSE", {
        fontFamily: "Courier",
        fontSize: "9px",
        color: "#779999",
      })
      .setOrigin(1, 0)
      .setDepth(20);
    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.pause();
      this.scene.launch("PauseScene", { scene: this.scene.key });
    });
    AudioEngine.playTrack("caster");
  }
  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    this.weaponKick = Math.max(0, this.weaponKick - dt * 8);
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
          : -0.7;
    this.angle += turn * dt * 2.1;
    const speed = move * dt * (this.difficulty === "EXPERT" ? 3.1 : 2.6);
    const nextX = this.x + Math.cos(this.angle) * speed;
    const nextY = this.y + Math.sin(this.angle) * speed;
    if (canOccupy(this.dungeon, nextX, this.y)) this.x = nextX;
    if (canOccupy(this.dungeon, this.x, nextY)) this.y = nextY;
    const fire = InputManager.isP1Down("FIRE");
    if (fire && !this.fireHeld) this.fire();
    this.fireHeld = fire;
    this.updateEnemies(dt);
    this.renderWorld();
    this.hud.set({
      score: this.score,
      stage: this.level,
      health: this.health,
      status: `HOSTILES ${this.entities.filter((entity) => entity.kind === "ENEMY").length}`,
    });
    if (this.health <= 0) this.finish();
  }
  private renderWorld() {
    const width = 640;
    const height = 480;
    const strip = width / this.rays;
    this.view
      .clear()
      .fillStyle(0x08021a)
      .fillRect(0, 0, width, height / 2)
      .fillStyle(0x080b12)
      .fillRect(0, height / 2, width, height / 2);
    this.renderSurfaces();
    for (let ray = 0; ray < this.rays; ray++) {
      const rayAngle = this.angle - this.fov / 2 + (ray / this.rays) * this.fov;
      const hit = castRay(this.dungeon, this.x, this.y, rayAngle);
      const corrected = hit.distance * Math.cos(rayAngle - this.angle);
      this.zBuffer[ray] = corrected;
      const wallHeight = Math.min(height, height / corrected);
      const top = (height - wallHeight) / 2;
      const shade =
        wallPattern(hit.mapX, hit.mapY, hit.textureX, 0.5, this.level) *
        Math.max(0.18, 1 - corrected / 18) *
        (hit.side ? 0.75 : 1);
      const red = Math.floor(20 + shade * 40);
      const green = Math.floor(60 + shade * 170);
      const blue = Math.floor(80 + shade * 175);
      this.view
        .fillStyle((red << 16) | (green << 8) | blue)
        .fillRect(ray * strip, top, Math.ceil(strip + 1), wallHeight);
      for (let band = 0; band < 8; band++) {
        const bandY = top + (band / 8) * wallHeight;
        const pattern = wallPattern(
          hit.mapX,
          hit.mapY,
          hit.textureX,
          band / 8,
          this.level,
        );
        if (pattern < 0.55)
          this.view
            .fillStyle(0x02070a, 0.4)
            .fillRect(
              ray * strip,
              bandY,
              Math.ceil(strip + 1),
              Math.max(1, wallHeight / 40),
            );
      }
    }
    this.renderSprites();
    this.renderWeapon();
    this.view
      .lineStyle(1, 0x00ffcc, 0.5)
      .strokeCircle(320, 240, 5)
      .lineBetween(312, 240, 328, 240)
      .lineBetween(320, 232, 320, 248);
    if (this.time.now < this.damageUntil)
      this.view
        .lineStyle(8, 0xff3355, 0.34)
        .strokeRect(5, 5, 630, 470)
        .fillStyle(0xff2244, 0.06)
        .fillRect(0, 0, 640, 480);
  }
  private renderSurfaces() {
    const g = this.view;
    g.fillGradientStyle(0x080c1c, 0x080c1c, 0x14252c, 0x14252c).fillRect(
      0,
      240,
      640,
      240,
    );
    for (let index = -4; index <= 4; index++) {
      g.lineStyle(1, 0x388583, 0.28).lineBetween(
        320,
        240,
        320 + index * 170,
        480,
      );
    }
    for (let depth = 1; depth <= 12; depth++) {
      const y = 240 + 240 / depth;
      g.lineStyle(1, 0x478b94, 0.28).lineBetween(0, y, 640, y);
    }
    g.lineStyle(2, 0x23444d, 0.4)
      .lineBetween(0, 50, 320, 240)
      .lineBetween(640, 50, 320, 240);
  }

  private renderWeapon() {
    const g = this.view;
    const kick = this.weaponKick * 8;
    if (this.time.now < this.muzzleUntil)
      g.fillStyle(0xfff2a8, 0.26)
        .fillCircle(320, 365 + kick, 22)
        .fillStyle(0xffffff, 0.95)
        .fillTriangle(320, 347 + kick, 311, 373 + kick, 329, 373 + kick)
        .fillStyle(0x00ffcc, 0.8)
        .fillTriangle(320, 354 + kick, 315, 371 + kick, 325, 371 + kick);
    g.fillStyle(0x101524)
      .fillTriangle(286, 480, 309, 373 + kick, 320, 480)
      .fillTriangle(354, 480, 331, 373 + kick, 320, 480);
    g.fillStyle(0x3c5362).fillRoundedRect(305, 378 + kick, 30, 94, 5);
    g.fillStyle(0x14232e).fillRect(311, 376 + kick, 18, 71);
    g.fillStyle(0x93d8da).fillRect(314, 378 + kick, 12, 4);
    g.fillStyle(0x00c9b0)
      .fillRect(307, 420 + kick, 3, 29)
      .fillRect(330, 420 + kick, 3, 29);
  }

  private renderSprites() {
    const visible = this.entities
      .map((entity) => {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        return {
          entity,
          distance: Math.hypot(dx, dy),
          relative: wrapAngle(Math.atan2(dy, dx) - this.angle),
        };
      })
      .filter((item) => Math.abs(item.relative) < this.fov * 0.65)
      .sort((a, b) => b.distance - a.distance);
    for (const item of visible) {
      const screenX = 320 + (item.relative / (this.fov / 2)) * 320;
      const ray = Math.max(
        0,
        Math.min(this.rays - 1, Math.floor((screenX / 640) * this.rays)),
      );
      const depth = item.distance * Math.cos(item.relative);
      if (depth > this.zBuffer[ray] + 0.4) continue;
      const size = Math.min(220, 210 / Math.max(0.3, depth));
      const alpha = Math.max(0.25, 1 - item.distance / 20);
      const top = 240 - size / 2;
      if (item.entity.kind === "ENEMY") {
        const hit = this.time.now < item.entity.hitUntil;
        this.view
          .fillStyle(hit ? 0xd8fbff : 0x57162e, alpha)
          .fillRoundedRect(
            screenX - size * 0.34,
            top + size * 0.22,
            size * 0.68,
            size * 0.55,
            size * 0.09,
          );
        this.view
          .fillStyle(hit ? 0xffffff : 0xb94258, alpha)
          .fillTriangle(
            screenX,
            top,
            screenX - size * 0.3,
            top + size * 0.32,
            screenX + size * 0.3,
            top + size * 0.32,
          );
        this.view
          .fillStyle(hit ? 0x00ffcc : 0x77233f, alpha)
          .fillTriangle(
            screenX - size * 0.28,
            top + size * 0.2,
            screenX - size * 0.48,
            top + size * 0.42,
            screenX - size * 0.23,
            top + size * 0.36,
          )
          .fillTriangle(
            screenX + size * 0.28,
            top + size * 0.2,
            screenX + size * 0.48,
            top + size * 0.42,
            screenX + size * 0.23,
            top + size * 0.36,
          );
        this.view
          .fillStyle(0x281428, alpha)
          .fillRect(
            screenX - size * 0.32,
            top + size * 0.74,
            size * 0.23,
            size * 0.26,
          )
          .fillRect(
            screenX + size * 0.09,
            top + size * 0.74,
            size * 0.23,
            size * 0.26,
          );
        this.view
          .fillStyle(0xffd8bd, alpha)
          .fillRect(
            screenX - size * 0.22,
            top + size * 0.35,
            size * 0.14,
            size * 0.07,
          )
          .fillRect(
            screenX + size * 0.08,
            top + size * 0.35,
            size * 0.14,
            size * 0.07,
          );
        this.view
          .lineStyle(Math.max(1, size * 0.018), 0xff6580, alpha)
          .lineBetween(
            screenX - size * 0.22,
            top + size * 0.58,
            screenX + size * 0.22,
            top + size * 0.58,
          );
      } else if (item.entity.kind === "CORE") {
        this.view
          .fillStyle(0xd89725, alpha)
          .fillTriangle(
            screenX,
            top + size * 0.15,
            screenX - size * 0.3,
            240,
            screenX,
            top + size * 0.85,
          );
        this.view
          .fillStyle(0xffe788, alpha)
          .fillTriangle(
            screenX,
            top + size * 0.15,
            screenX + size * 0.3,
            240,
            screenX,
            top + size * 0.85,
          );
        this.view
          .fillStyle(0xffffff, alpha)
          .fillCircle(screenX, 240, size * 0.06);
      } else {
        const unlocked = !this.entities.some(
          (entity) => entity.kind === "ENEMY",
        );
        this.view
          .fillStyle(0x082b28, alpha)
          .fillRoundedRect(
            screenX - size * 0.35,
            top,
            size * 0.7,
            size,
            size * 0.08,
          );
        this.view
          .lineStyle(
            Math.max(2, size * 0.04),
            unlocked ? 0x00ff88 : 0xcfac57,
            alpha,
          )
          .strokeRoundedRect(
            screenX - size * 0.35,
            top,
            size * 0.7,
            size,
            size * 0.08,
          );
        this.view
          .lineStyle(Math.max(1, size * 0.018), 0x8fffe0, alpha)
          .lineBetween(screenX, top + size * 0.15, screenX, top + size * 0.85);
      }
    }
  }
  private fire() {
    const candidates = this.entities
      .filter((entity) => entity.kind === "ENEMY")
      .map((entity) => ({
        entity,
        distance: Math.hypot(entity.x - this.x, entity.y - this.y),
        angle: Math.abs(
          wrapAngle(
            Math.atan2(entity.y - this.y, entity.x - this.x) - this.angle,
          ),
        ),
      }))
      .filter((candidate) => candidate.angle < 0.08)
      .sort((a, b) => a.distance - b.distance);
    const target = candidates[0];
    this.muzzleUntil = this.time.now + 75;
    this.weaponKick = 1;
    if (
      target &&
      target.distance <
        castRay(this.dungeon, this.x, this.y, this.angle).distance
    ) {
      target.entity.health--;
      target.entity.hitUntil = this.time.now + 110;
      this.score += 50;
      VFXManager.playHit(this, 320, 220, 0x00ffcc);
      if (target.entity.health <= 0) {
        this.entities = this.entities.filter(
          (entity) => entity !== target.entity,
        );
        this.score += 250;
        AudioEngine.playEffect("EXPLOSION");
      } else AudioEngine.playEffect("LASER");
    } else AudioEngine.playEffect("LASER");
    VFXManager.screenShake(this, 0.003, 45);
  }
  private updateEnemies(dt: number) {
    for (const enemy of this.entities.filter(
      (entity) => entity.kind === "ENEMY",
    )) {
      const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (distance < 7 && distance > 0.7) {
        const speed = dt * (0.45 + this.level * 0.025);
        const nx = enemy.x + ((this.x - enemy.x) / distance) * speed;
        const ny = enemy.y + ((this.y - enemy.y) / distance) * speed;
        if (canOccupy(this.dungeon, nx, enemy.y, 0.12)) enemy.x = nx;
        if (canOccupy(this.dungeon, enemy.x, ny, 0.12)) enemy.y = ny;
      }
      if (distance < 0.75) {
        this.health -= dt * (8 + this.level);
        this.damageUntil = this.time.now + 90;
      }
    }
    for (const entity of [...this.entities])
      if (Math.hypot(entity.x - this.x, entity.y - this.y) < 0.55) {
        if (entity.kind === "CORE") {
          this.health = Math.min(100, this.health + 25);
          this.score += 100;
          this.entities = this.entities.filter(
            (candidate) => candidate !== entity,
          );
          AudioEngine.playEffect("POWER_UP");
        } else if (
          entity.kind === "EXIT" &&
          !this.entities.some((candidate) => candidate.kind === "ENEMY")
        )
          this.scene.restart({
            difficulty: this.difficulty,
            mode: this.mode,
            level: this.level + 1,
            score: this.score + 500,
          });
      }
  }
  private makeEntities() {
    const entities: SpriteEntity[] = [];
    for (let index = 1; index < this.dungeon.rooms.length; index++) {
      const room = this.dungeon.rooms[index];
      const x = room.x + room.width / 2;
      const y = room.y + room.height / 2;
      entities.push({
        x,
        y,
        kind: index % 3 === 0 ? "CORE" : "ENEMY",
        health: 1 + Math.floor(this.level / 4),
        hitUntil: 0,
      });
    }
    entities.push({
      ...this.dungeon.exit,
      kind: "EXIT",
      health: 1,
      hitUntil: 0,
    });
    return entities;
  }
  private finish() {
    this.scene.pause();
    this.scene.launch("GameOverScene", {
      scene: this.scene.key,
      title: `SYSTEM BREACH\nLEVEL ${this.level}`,
      score: this.score,
      difficulty: `${this.difficulty}-${this.mode}`,
      restartData: { difficulty: this.difficulty, mode: this.mode },
      submitScore: true,
      color: "#ff2255",
    });
  }
}
function wrapAngle(value: number) {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
