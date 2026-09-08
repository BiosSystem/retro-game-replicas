import Phaser from "phaser";
import { VFXManager } from "../../engine/VFXManager";
import {
  AiDirector,
  type DirectorDecision,
} from "../../ai/director/AiDirector";
import { AudioEngine } from "../../engine/AudioEngine";
import { ProjectileEcs } from "../../engine/ecs/ProjectileEcs";
import { FrameTelemetry } from "../../engine/FrameTelemetry";
import { InputManager } from "../../engine/InputManager";
import { solveFabrik, type Joint } from "../../graphics/kinematics/Kinematics";
import { visualDensity } from "../../graphics/ArcadeVisualTheme";
import {
  emitFibonacciSpiral,
  emitHomingFan,
  emitPolygon,
  scriptedBossPhase,
} from "./DanmakuPatterns";
import { ArcadeHud } from "../../ui/arcade/NeonUi";

export default class NeonDanmakuScene extends Phaser.Scene {
  readonly projectiles = new ProjectileEcs(100_000);
  private readonly director = new AiDirector();
  private readonly telemetry = new FrameTelemetry(120);
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: ArcadeHud;
  private playerX = 320;
  private playerY = 430;
  private bossX = 320;
  private bossY = 92;
  private stage = 1;
  private score = 0;
  private lives = 3;
  private elapsed = 0;
  private nextWave = 0;
  private phase = 0;
  private decision: DirectorDecision = {
    density: 0.3,
    speed: 0.35,
    powerUpChance: 0.1,
    pattern: "SPIRAL",
    pressure: 0.5,
  };
  private shots = 0;
  private hits = 0;
  private damage = 0;
  constructor() {
    super("DanmakuScene");
  }

  private drawArena() {
    const g = this.gfx;
    g.fillGradientStyle(0x10091c, 0x10091c, 0x030712, 0x030712).fillRect(
      0,
      44,
      640,
      436,
    );
    for (const x of [24, 592]) {
      g.fillStyle(0x211830)
        .fillRect(x, 44, 24, 436)
        .fillStyle(0x3e2b49)
        .fillRect(x + 4, 44, 3, 436);
      for (let y = 64; y < 470; y += 56)
        g.fillStyle(0x674257, 0.6)
          .fillTriangle(x + 12, y, x + 20, y + 12, x + 12, y + 24)
          .fillTriangle(x + 12, y, x + 4, y + 12, x + 12, y + 24);
    }
    g.lineStyle(2, 0x453453, 0.4)
      .strokeCircle(this.bossX, this.bossY, 72)
      .strokeCircle(this.bossX, this.bossY, 62);
  }
  create() {
    this.projectiles.clear();
    this.playerX = 320;
    this.playerY = 430;
    this.stage = 1;
    this.score = 0;
    this.lives = 3;
    this.elapsed = 0;
    this.nextWave = 0;
    this.phase = 0;
    this.gfx = this.add.graphics();
    this.hud = new ArcadeHud(this, 8, 8, 624, 0xff2ec4);
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    AudioEngine.playTrack("danmaku");
  }
  update(time: number, delta: number) {
    const dt = Math.min(50, delta) / 1000;
    this.elapsed += dt;
    this.telemetry.record(delta);
    const dx =
        Number(InputManager.isP1Down("RIGHT")) -
        Number(InputManager.isP1Down("LEFT")),
      dy =
        Number(InputManager.isP1Down("DOWN")) -
        Number(InputManager.isP1Down("UP"));
    const focus = InputManager.isP1Down("FIRE") ? 0.45 : 1;
    this.playerX = Phaser.Math.Clamp(
      this.playerX + dx * 220 * focus * dt,
      12,
      628,
    );
    this.playerY = Phaser.Math.Clamp(
      this.playerY + dy * 220 * focus * dt,
      48,
      468,
    );
    this.decision = this.director.update(time, {
      damageRate: Math.min(1, this.damage / Math.max(1, this.elapsed / 10)),
      accuracy: this.hits / Math.max(1, this.shots),
      movementEntropy: Math.min(1, (Math.abs(dx) + Math.abs(dy)) * 0.5),
      nearMissRate: Math.min(1, this.projectiles.activeCount / 18000),
      lives: this.lives,
      stage: this.stage,
    });
    if (this.elapsed >= this.nextWave) {
      this.emitWave();
      this.nextWave =
        this.elapsed + Math.max(0.08, 0.32 - this.decision.density * 0.2);
    }
    this.projectiles.update(dt, this.playerX, this.playerY);
    this.collide();
    if (this.elapsed > this.stage * 12) {
      this.stage++;
      this.phase = scriptedBossPhase(this.stage);
      AudioEngine.playEffect("STAGE_CLEAR");
    }
    this.draw(delta);
  }
  seedDensePattern(count = 25_000) {
    this.projectiles.clear();
    const bounded = Math.max(0, Math.min(100_000, Math.floor(count)));
    for (let i = 0; i < bounded; i++) {
      const angle = i * 2.399963229728653;
      const radius = 16 + (i % 180);
      this.projectiles.spawn({
        x: this.bossX + Math.cos(angle) * radius,
        y: this.bossY + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 18,
        vy: Math.sin(angle) * 18 + 20,
        life: 20,
        kind: (i % 3) as 0 | 1 | 2,
      });
    }
    return this.projectiles.activeCount;
  }
  private emitWave() {
    const count = 8 + Math.floor(this.decision.density * 36),
      speed = 48 + this.decision.speed * 115,
      phase = this.elapsed * 0.7;
    const kind =
      this.phase === 0
        ? this.decision.pattern
        : (["SPIRAL", "POLYGON", "HOMING", "MIXED"] as const)[this.phase];
    if (kind === "POLYGON")
      emitPolygon(
        this.projectiles,
        this.bossX,
        this.bossY,
        5 + (this.stage % 5),
        Math.max(1, Math.floor(count / 7)),
        speed,
        phase,
      );
    else if (kind === "HOMING")
      emitHomingFan(
        this.projectiles,
        this.bossX,
        this.bossY,
        count,
        speed,
        Math.PI / 2,
      );
    else {
      emitFibonacciSpiral(
        this.projectiles,
        this.bossX,
        this.bossY,
        count,
        speed,
        phase,
      );
      if (kind === "MIXED")
        emitHomingFan(
          this.projectiles,
          this.bossX,
          this.bossY,
          Math.ceil(count / 4),
          speed * 0.7,
        );
    }
    this.shots += count;
  }
  private collide() {
    for (let i = 0; i < this.projectiles.capacity; i++) {
      if (!this.projectiles.active[i]) continue;
      const distance = Math.hypot(
        this.projectiles.x[i] - this.playerX,
        this.projectiles.y[i] - this.playerY,
      );
      if (distance < 7) {
        this.projectiles.kill(i);
        this.lives--;
        this.damage++;
        VFXManager.playHit(this, this.playerX, this.playerY, 0x00ffcc);
        VFXManager.screenShake(this, 0.006, 100);
        AudioEngine.playEffect("EXPLOSION");
        if (this.lives <= 0) {
          this.lives = 3;
          this.score = Math.max(0, this.score - 1000);
        }
      } else if (distance < 18) this.score++;
    }
  }
  private draw(delta: number) {
    const frame = this.telemetry.snapshot(),
      density = visualDensity(document.documentElement.dataset.quality),
      renderBudget = Math.max(
        1800,
        Math.floor((delta > 20 ? 6000 : 16000) * density),
      ),
      stride = Math.max(
        1,
        Math.ceil(this.projectiles.activeCount / renderBudget),
      );
    this.gfx.clear().fillStyle(0x03020c).fillRect(0, 0, 640, 480);
    this.drawArena();
    this.gfx.lineStyle(1, 0x441177, 0.12);
    for (let y = 40; y < 480; y += 32) this.gfx.lineBetween(0, y, 640, y);
    for (let i = 0; i < this.projectiles.capacity; i += stride)
      if (this.projectiles.active[i]) {
        const x = this.projectiles.x[i],
          y = this.projectiles.y[i],
          kind = this.projectiles.kind[i];
        if (kind === 2)
          this.gfx
            .fillStyle(0xff3355, 0.96)
            .fillTriangle(x, y - 4, x - 3.5, y + 3, x + 3.5, y + 3);
        else if (kind === 1)
          this.gfx.fillStyle(0x00ffcc, 0.94).fillRect(x - 2, y - 2, 4, 4);
        else this.gfx.fillStyle(0xff2ec4, 0.92).fillCircle(x, y, 2.4);
      }
    this.drawBoss();
    this.gfx
      .fillStyle(0x173847)
      .fillTriangle(
        this.playerX,
        this.playerY - 13,
        this.playerX - 13,
        this.playerY + 10,
        this.playerX + 13,
        this.playerY + 10,
      )
      .fillStyle(0xc2fff2)
      .fillTriangle(
        this.playerX,
        this.playerY - 10,
        this.playerX - 5,
        this.playerY + 6,
        this.playerX + 5,
        this.playerY + 6,
      );
    this.gfx
      .lineStyle(1, 0x00ffcc, 0.7)
      .strokeCircle(this.playerX, this.playerY, 3)
      .lineStyle(1, 0x00ffcc, 0.22)
      .strokeCircle(this.playerX, this.playerY, 10);
    this.hud.set({
      score: this.score,
      stage: this.stage,
      health: (this.lives / 3) * 100,
      combo: Math.max(1, Math.round(this.decision.pressure * 8)),
      status: `${this.decision.pattern}  ${this.projectiles.activeCount} SHOTS  ${frame.fps.toFixed(0)} FPS`,
    });
  }
  private drawBoss() {
    const center = { x: this.bossX, y: this.bossY };
    const pulse = 1 + Math.sin(this.elapsed * 4) * 0.04;
    this.gfx
      .lineStyle(1, 0xff2ec4, 0.16 + this.decision.pressure * 0.16)
      .strokeCircle(center.x, center.y, 40 * pulse)
      .fillStyle(0x160925, 0.82)
      .fillCircle(center.x, center.y, 33)
      .fillStyle(0x33115e)
      .fillCircle(center.x, center.y, 29)
      .lineStyle(2, 0xb660bd)
      .strokeCircle(center.x, center.y, 29);
    for (let plate = 0; plate < 4; plate++) {
      const angle = plate * (Math.PI / 2) + this.elapsed * 0.22,
        x = center.x + Math.cos(angle) * 25,
        y = center.y + Math.sin(angle) * 25;
      this.gfx
        .fillStyle(plate % 2 ? 0x652b79 : 0x8f356e, 0.9)
        .fillTriangle(
          x + Math.cos(angle) * 8,
          y + Math.sin(angle) * 8,
          x + Math.cos(angle + 2.15) * 7,
          y + Math.sin(angle + 2.15) * 7,
          x + Math.cos(angle - 2.15) * 7,
          y + Math.sin(angle - 2.15) * 7,
        );
    }
    this.gfx
      .fillStyle(0xd6b4d9)
      .fillEllipse(center.x, center.y, 32, 14)
      .fillStyle(0x200e35)
      .fillCircle(center.x, center.y, 6)
      .fillStyle(0xfff4ff, 0.9)
      .fillCircle(center.x - 2, center.y - 2, 1.5);
    this.gfx.lineStyle(4, 0x8f356e);
    for (let limb = 0; limb < 8; limb++) {
      const angle = (limb / 8) * Math.PI * 2 + this.elapsed * 0.3,
        target = {
          x: center.x + Math.cos(angle) * (55 + this.decision.pressure * 28),
          y: center.y + Math.sin(angle) * 42,
        };
      const joints: Joint[] = [
        center,
        {
          x: center.x + Math.cos(angle) * 28,
          y: center.y + Math.sin(angle) * 28,
        },
        target,
      ];
      const solved = solveFabrik(joints, [34, 38], target, 4);
      this.gfx
        .beginPath()
        .moveTo(solved[0].x, solved[0].y)
        .lineTo(solved[1].x, solved[1].y)
        .lineTo(solved[2].x, solved[2].y)
        .strokePath()
        .fillStyle(0xff2ec4, 0.75)
        .fillCircle(solved[2].x, solved[2].y, 2.5);
    }
  }
}
