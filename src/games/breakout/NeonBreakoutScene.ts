import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { VFXManager } from '../../engine/VFXManager';
import type { ArcadeMode } from '../../multiplayer/CoopSession';
import { playModAudioEvent } from '../../audio/patches/ModAudioBridge';
import { arcadeModRuntime } from '../../mods/ModRuntime';
import { generateBrickField, reflectFromPaddle, type BreakoutPowerUp } from './BreakoutSystems';
import { breakoutSensors, GhostBrain } from '../../ai/neural/GhostBrain';

export default class NeonBreakoutScene extends Phaser.Scene {
  private paddle!: Phaser.Physics.Arcade.Image;
  private balls!: Phaser.Physics.Arcade.Group;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private drops!: Phaser.Physics.Arcade.Group;
  private lasers!: Phaser.Physics.Arcade.Group;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0; private stage = 1; private lives = 3; private ballSpeed = 330; private paddleSpeed = 430;
  private difficulty = 'NORMAL'; private mode: ArcadeMode = 'SOLO'; private fireHeld = false; private laserUntil = 0; private stickyUntil = 0; private finished = false; private stagePending = false;
  private ghost!: GhostBrain; private ghostEnabled = false; private ghostDecisionAt = 0; private ghostSteer = 0;

  constructor() { super('BreakoutScene'); }

  create(data: { difficulty?: string; mode?: ArcadeMode }) {
    this.difficulty = data?.difficulty ?? 'NORMAL'; this.mode = data?.mode ?? 'SOLO';
    const speed = { EASY: 260, NORMAL: 330, HARD: 410, EXPERT: 490 }[this.difficulty] ?? 330;
    this.ballSpeed = speed; this.paddleSpeed = this.difficulty === 'EXPERT' ? 390 : 430; this.score = 0; this.stage = 1; this.lives = 3; this.finished = false; this.stagePending = false; this.laserUntil = 0; this.stickyUntil = 0;
    this.createTextures(); this.add.grid(320, 240, 640, 480, 32, 32, 0x02070d, 1, 0x00ffaa, 0.08);
    this.add.text(320, 15, 'NEON BREAKER // VECTOR BREAKOUT', { fontFamily: 'Courier', fontSize: '19px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(12, 40, '', { fontFamily: 'Courier', fontSize: '13px', color: '#ffffff' });
    this.add.text(628, 42, 'MOVE A/D OR ARROWS  FIRE SPACE/ENTER  G GHOST  ESC PAUSE', { fontFamily: 'Courier', fontSize: '9px', color: '#779999' }).setOrigin(1, 0);
    this.paddle = this.physics.add.image(320, 442, 'neon-paddle').setImmovable(true).setCollideWorldBounds(true); (this.paddle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.balls = this.physics.add.group({ allowGravity: false }); this.bricks = this.physics.add.staticGroup(); this.drops = this.physics.add.group({ allowGravity: false }); this.lasers = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(this.balls, this.paddle, this.hitPaddle as never, undefined, this); this.physics.add.collider(this.balls, this.bricks, this.hitBrick as never, undefined, this);
    this.physics.add.overlap(this.drops, this.paddle, this.collectDrop as never, undefined, this); this.physics.add.overlap(this.lasers, this.bricks, this.laserHit as never, undefined, this);
    this.ghost = new GhostBrain('retro_breakout_ghost_v1', localStorage); this.ghostEnabled = false; this.ghostDecisionAt = 0; this.ghostSteer = 0;
    this.spawnStage(); this.spawnBall(); this.input.keyboard?.on('keydown-G', () => { this.ghostEnabled = !this.ghostEnabled; this.updateHud(); }); this.input.keyboard?.on('keydown-ESC', () => { this.scene.pause(); this.scene.launch('PauseScene', { scene: this.scene.key }); }); this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ghost.save()); this.updateHud();
  }

  update() {
    if (this.finished) return;
    const left = InputManager.isP1Down('LEFT'); const right = InputManager.isP1Down('RIGHT'); const fire = InputManager.isP1Down('FIRE');
    const trackedBall = this.balls.getFirstAlive() as Phaser.Physics.Arcade.Image | null;
    if (this.ghostEnabled && trackedBall && this.time.now >= this.ghostDecisionAt) { const body = trackedBall.body as Phaser.Physics.Arcade.Body; const alignment = 1 - Math.min(1, Math.abs(trackedBall.x - this.paddle.x) / 320); this.ghostSteer = this.ghost.decide(breakoutSensors(this.paddle.x, trackedBall.x, trackedBall.y, body.velocity.x, body.velocity.y), body.velocity.y > 0 ? alignment : alignment * 0.15); this.ghostDecisionAt = this.time.now + 80; }
    this.paddle.setVelocityX(this.ghostEnabled ? this.ghostSteer * this.paddleSpeed : left === right ? 0 : left ? -this.paddleSpeed : this.paddleSpeed);
    for (const child of this.balls.getChildren()) { const ball = child as Phaser.Physics.Arcade.Image; if (ball.getData('stuck')) ball.setPosition(this.paddle.x + Number(ball.getData('stickOffset') ?? 0), this.paddle.y - 18); if (ball.y > 500) ball.destroy(); }
    if (fire && !this.fireHeld) { this.releaseSticky(); if (this.time.now < this.laserUntil) this.fireLasers(); }
    this.fireHeld = fire;
    for (const child of this.drops.getChildren()) if ((child as Phaser.Physics.Arcade.Image).y > 510) child.destroy();
    for (const child of this.lasers.getChildren()) if ((child as Phaser.Physics.Arcade.Image).y < -20) child.destroy();
    if (this.balls.countActive() === 0) this.loseLife();
  }

  private spawnStage() {
    this.bricks.clear(true, true); const field = generateBrickField(this.stage); const patches = arcadeModRuntime.stagePatches(); const skin = patches.find(patch => patch.skin)?.skin;
    for (const patch of patches) for (const hazard of patch.hazards) { const row = hazard.lane % field.rows; const column = Math.min(field.columns - 1, Math.floor(hazard.offset * field.columns)); const brick = field.bricks.find(candidate => candidate.row === row && candidate.column === column); if (!brick) continue; brick.kind = hazard.kind === 'WALL' ? 'WALL' : 'NORMAL'; brick.hp = hazard.kind === 'DRONE' ? 3 : hazard.kind === 'SPIKE' ? 2 : 999; brick.color = skin ? parseInt((column + row) % 2 ? skin.primary.slice(1) : skin.secondary.slice(1), 16) : brick.color; }
    for (const spec of field.bricks) { const brick = this.bricks.create(64 + spec.column * 64, 88 + spec.row * 25, 'neon-brick') as Phaser.Physics.Arcade.Image; brick.setTint(spec.color).setData('hp', spec.hp).setData('kind', spec.kind).setData('drop', spec.drop ?? '').setData('maxHp', spec.hp); if (spec.kind === 'WALL') brick.setAlpha(0.55); if (spec.kind === 'BOSS') brick.setScale(1.45, 1.15).refreshBody(); }
    if (field.bricks.some(brick => brick.kind === 'BOSS')) playModAudioEvent('BOSS_ENTRY', this.stage);
    this.updateHud();
  }

  private spawnBall(x = this.paddle?.x ?? 320, y = 410, vx = this.ballSpeed * 0.45, vy = -this.ballSpeed) { const ball = this.balls.create(x, y, 'neon-ball') as Phaser.Physics.Arcade.Image; ball.setBounce(1).setCollideWorldBounds(true).setVelocity(vx, vy); const body = ball.body as Phaser.Physics.Arcade.Body; body.setAllowGravity(false).setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, 640, 540)); return ball; }
  private hitPaddle(ball: Phaser.Physics.Arcade.Image) { if (this.time.now < this.stickyUntil) { ball.setVelocity(0).setData('stuck', true).setData('stickOffset', Phaser.Math.Clamp(ball.x - this.paddle.x, -42, 42)); return; } const body = this.paddle.body as Phaser.Physics.Arcade.Body; const reflected = reflectFromPaddle({ ballX: ball.x, paddleX: this.paddle.x, paddleWidth: this.paddle.displayWidth, paddleVelocity: body.velocity.x, speed: this.ballSpeed }); ball.setVelocity(reflected.vx, reflected.vy); VFXManager.playHit(this, ball.x, ball.y); AudioEngine.playTone(180 + Math.abs(reflected.hit) * 260, 'square', 0.045); }

  private hitBrick(ball: Phaser.Physics.Arcade.Image, brick: Phaser.Physics.Arcade.Image) { this.damageBrick(brick); const velocity = (ball.body as Phaser.Physics.Arcade.Body).velocity; if (Math.abs(velocity.y) < this.ballSpeed * 0.3) ball.setVelocityY((velocity.y < 0 ? -1 : 1) * this.ballSpeed * 0.45); }
  private laserHit(laser: Phaser.Physics.Arcade.Image, brick: Phaser.Physics.Arcade.Image) { laser.destroy(); this.damageBrick(brick); }
  private damageBrick(brick: Phaser.Physics.Arcade.Image) {
    if (brick.getData('kind') === 'WALL') { VFXManager.playHit(this, brick.x, brick.y, 0x668899); return; }
    const hp = Number(brick.getData('hp')) - 1; brick.setData('hp', hp); VFXManager.playExplosion(this, brick.x, brick.y, Number(brick.tintTopLeft)); VFXManager.screenShake(this, brick.getData('kind') === 'BOSS' ? 0.012 : 0.003, 90);
    if (hp > 0) { brick.setAlpha(0.35 + 0.65 * hp / Number(brick.getData('maxHp'))); return; }
    const drop = brick.getData('drop') as BreakoutPowerUp | ''; if (drop) this.spawnDrop(brick.x, brick.y, drop); brick.disableBody(true, true); this.score += brick.getData('kind') === 'BOSS' ? 1000 : 25 * this.stage; AudioEngine.playEffect('EXPLOSION'); this.updateHud();
    if (!this.stagePending && !this.bricks.getChildren().some(child => (child as Phaser.Physics.Arcade.Image).active && (child as Phaser.Physics.Arcade.Image).getData('kind') !== 'WALL')) { this.stagePending = true; this.stage += 1; AudioEngine.playEffect('STAGE_CLEAR'); playModAudioEvent('STAGE_CLEAR', this.stage); this.time.delayedCall(450, () => { this.spawnStage(); this.stagePending = false; }); }
  }

  private spawnDrop(x: number, y: number, type: BreakoutPowerUp) { const colors: Record<BreakoutPowerUp, number> = { LASER: 0xff2255, MULTI: 0x00ffff, STICKY: 0xffff00, SLOW: 0x66ff66 }; const drop = this.drops.create(x, y, 'neon-drop') as Phaser.Physics.Arcade.Image; drop.setTint(colors[type]).setData('type', type).setVelocityY(115); }
  private collectDrop(dropObject: Phaser.GameObjects.GameObject) { const drop = dropObject as Phaser.Physics.Arcade.Image; const type = drop.getData('type') as BreakoutPowerUp; drop.destroy(); if (type === 'LASER') this.laserUntil = this.time.now + 12000; if (type === 'STICKY') this.stickyUntil = this.time.now + 12000; if (type === 'MULTI') this.addMultiBall(); if (type === 'SLOW') this.slowBalls(); AudioEngine.playEffect('POWER_UP'); playModAudioEvent('POWER_UP', this.stage); VFXManager.floatingText(this, this.paddle.x, this.paddle.y - 30, type, '#ffff00'); this.updateHud(); }
  private addMultiBall() { const originals = this.balls.getChildren().slice(0, 2) as Phaser.Physics.Arcade.Image[]; for (const ball of originals) { const body = ball.body as Phaser.Physics.Arcade.Body; this.spawnBall(ball.x, ball.y, -body.velocity.x || this.ballSpeed * 0.55, body.velocity.y || -this.ballSpeed); } }
  private slowBalls() { for (const child of this.balls.getChildren()) (child as Phaser.Physics.Arcade.Image).setVelocity((child.body as Phaser.Physics.Arcade.Body).velocity.x * 0.68, (child.body as Phaser.Physics.Arcade.Body).velocity.y * 0.68); this.time.delayedCall(7000, () => { for (const child of this.balls.getChildren()) (child as Phaser.Physics.Arcade.Image).setVelocity((child.body as Phaser.Physics.Arcade.Body).velocity.x / 0.68, (child.body as Phaser.Physics.Arcade.Body).velocity.y / 0.68); }); }
  private releaseSticky() { for (const child of this.balls.getChildren()) { const ball = child as Phaser.Physics.Arcade.Image; if (ball.getData('stuck')) ball.setData('stuck', false).setVelocity(this.ballSpeed * 0.35, -this.ballSpeed); } }
  private fireLasers() { for (const offset of [-34, 34]) { const laser = this.lasers.create(this.paddle.x + offset, this.paddle.y - 12, 'neon-laser') as Phaser.Physics.Arcade.Image; laser.setVelocityY(-620); } AudioEngine.playEffect('LASER'); }
  private loseLife() { this.lives -= 1; if (this.lives > 0) { this.spawnBall(); this.updateHud(); return; } this.finish(); }
  private finish() { this.finished = true; this.ghost.save(); this.physics.pause(); const scoreKey = `${this.difficulty}-${this.mode}`; this.scene.pause(); this.scene.launch('GameOverScene', { scene: this.scene.key, title: `CORE BREACH\nSTAGE ${this.stage}`, score: this.score, difficulty: scoreKey, restartData: { difficulty: this.difficulty, mode: this.mode }, submitScore: true, color: '#ff2255' }); }
  private updateHud() { const power = `${this.time.now < this.laserUntil ? ' LASER' : ''}${this.time.now < this.stickyUntil ? ' STICKY' : ''}`; this.scoreText?.setText(`SCORE ${this.score}  STAGE ${this.stage}  LIVES ${this.lives}  ${this.mode}  GHOST ${this.ghostEnabled ? 'ON' : 'OFF'}${power}`); }
  private createTextures() { const make = (key: string, width: number, height: number, draw: (graphics: Phaser.GameObjects.Graphics) => void) => { if (this.textures.exists(key)) return; const graphics = this.add.graphics(); draw(graphics); graphics.generateTexture(key, width, height); graphics.destroy(); }; make('neon-paddle', 108, 16, g => g.fillStyle(0x00ffcc).fillRoundedRect(0, 0, 108, 16, 7)); make('neon-ball', 14, 14, g => g.fillStyle(0xffffff).fillCircle(7, 7, 7)); make('neon-brick', 58, 18, g => g.fillStyle(0xffffff).fillRoundedRect(0, 0, 58, 18, 3)); make('neon-drop', 18, 18, g => g.lineStyle(2, 0xffffff).strokeCircle(9, 9, 7).lineBetween(4, 9, 14, 9)); make('neon-laser', 4, 16, g => g.fillStyle(0xffffff).fillRect(0, 0, 4, 16)); }
}
