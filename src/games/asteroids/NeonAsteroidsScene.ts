import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { VFXManager } from '../../engine/VFXManager';
import { fractureSizes, predictIntercept, unlockedWeapons, type WeaponMode } from './AsteroidSystems';
import { CoopSession, type ArcadeMode } from '../../multiplayer/CoopSession';
import type { PlayerId } from '../../multiplayer/MultiInput';
import { ProceduralStageGenerator, type StageDefinition } from '../../generators/ProceduralStageGenerator';
import { ArcadeHud } from '../../ui/arcade/NeonUi';
import { NeonVectorRollbackAdapter } from '../neon-vector/NeonVectorRollbackAdapter';
import type { NetInputFrame } from '../../net/InputCodec';

export default class NeonAsteroidsScene extends Phaser.Scene {
  private ship!: Phaser.Physics.Arcade.Image;
  private ship2: Phaser.Physics.Arcade.Image | null = null;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private minerals!: Phaser.Physics.Arcade.Group;
  private ufos!: Phaser.Physics.Arcade.Group;
  private hostileShots!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private stage = 1;
  private mineralCount = 0;
  private weapon: WeaponMode = 'SPREAD';
  private shield = false;
  private difficulty = 'NORMAL';
  private hud!: ArcadeHud;
  private stagePending = false;
  private mode: ArcadeMode = 'SOLO';
  private session!: CoopSession;
  private generator = new ProceduralStageGenerator(0x4e454f4e);
  private stageDefinition!: StageDefinition;
  private fireHeld: Record<PlayerId, boolean> = { 1: false, 2: false };
  private versusAdapter: NeonVectorRollbackAdapter | null = null;

  constructor() { super('AsteroidsScene'); }

  create(data: { difficulty?: string; mode?: ArcadeMode }) {
    this.difficulty = data?.difficulty ?? 'NORMAL';
    this.mode = data?.mode ?? 'SOLO';
    this.versusAdapter = this.mode === 'VERSUS' ? new NeonVectorRollbackAdapter() : null;
    this.session = new CoopSession(this.mode);
    this.score = 0; this.stage = 1; this.mineralCount = 0; this.weapon = 'SPREAD'; this.shield = false; this.stagePending = false;
    this.createTextures();
    this.add.grid(320, 240, 640, 480, 32, 32, 0x02000c, 1, 0x632cff, 0.1);
    this.add.text(320, 18, 'NEON VECTOR ASTEROIDS', { fontFamily: 'Courier', fontSize: '20px', color: '#ff2ec4', fontStyle: 'bold' }).setOrigin(0.5);
    this.hud = new ArcadeHud(this, 8, 38, 624, 0xff2ec4);
    this.add.text(628, 12, 'ARROWS THRUST  SPACE FIRE  Q WEAPON  ESC PAUSE', { fontFamily: 'Courier', fontSize: '10px', color: '#8888aa' }).setOrigin(1, 0);

    this.ship = this.physics.add.image(320, 260, 'vector-ship').setDamping(true).setDrag(0.985).setMaxVelocity(320);
    this.ship.setData('player', 1);
    this.ship2 = this.mode === 'SOLO' ? null : this.physics.add.image(360, 260, 'vector-ship').setTint(this.mode === 'VERSUS' ? 0xff2ec4 : 0xffff00).setDamping(true).setDrag(0.985).setMaxVelocity(320).setData('player', 2);
    this.asteroids = this.physics.add.group(); this.bullets = this.physics.add.group(); this.minerals = this.physics.add.group();
    this.ufos = this.physics.add.group(); this.hostileShots = this.physics.add.group();
    this.physics.add.overlap(this.bullets, this.asteroids, this.hitAsteroid as never, undefined, this);
    this.physics.add.overlap(this.bullets, this.ufos, this.hitUfo as never, undefined, this);
    this.physics.add.overlap(this.ship, this.minerals, this.collectMineral as never, undefined, this);
    this.physics.add.overlap(this.ship, this.asteroids, this.damageShip as never, undefined, this);
    this.physics.add.overlap(this.ship, this.hostileShots, this.damageShip as never, undefined, this);
    if (this.ship2) {
      this.physics.add.overlap(this.ship2, this.minerals, this.collectMineral as never, undefined, this);
      this.physics.add.overlap(this.ship2, this.asteroids, this.damageShip as never, undefined, this);
      this.physics.add.overlap(this.ship2, this.hostileShots, this.damageShip as never, undefined, this);
      this.physics.add.collider(this.ship, this.ship2);
    }
    this.spawnStage();
    this.time.addEvent({ delay: 9000, loop: true, callback: this.spawnUfo, callbackScope: this });
    this.time.addEvent({ delay: 1400, loop: true, callback: this.ufoFire, callbackScope: this });
    this.input.keyboard?.on('keydown-Q', () => this.cycleWeapon());
    this.input.keyboard?.on('keydown-ESC', () => { this.scene.pause(); this.scene.launch('PauseScene', { scene: this.scene.key }); });
    this.events.once('shutdown', () => AudioEngine.stopTrack());
    const receiveRemote = (event: Event) => { const input = (event as CustomEvent<NetInputFrame>).detail; if (this.versusAdapter && input) this.versusAdapter.receive(input); };
    window.addEventListener('arcade-neon-vector-remote', receiveRemote); this.events.once('shutdown', () => window.removeEventListener('arcade-neon-vector-remote', receiveRemote));
    AudioEngine.playTrack('vector');
    this.updateHud();
  }

  update() {
    this.physics.world.wrap([this.ship, ...(this.ship2 ? [this.ship2] : []), this.asteroids, this.bullets, this.minerals, this.ufos, this.hostileShots], 24);
    this.moveShip(this.ship, 1);
    if (this.ship2?.active) this.moveShip(this.ship2, 2);
    if (this.versusAdapter && this.ship2?.active) { const view = this.versusAdapter.opponentView(); this.ship2.setTint(view.tint); this.ship2.setPosition(Phaser.Math.Linear(this.ship2.x, 320 + view.x, .2), Phaser.Math.Linear(this.ship2.y, 240 + view.y, .2)); }
    if (this.asteroids.countActive() === 0 && !this.stagePending) {
      this.stagePending = true; this.stage += 1; AudioEngine.playEffect('STAGE_CLEAR');
      this.time.delayedCall(800, () => { this.spawnStage(); this.stagePending = false; });
    }
  }

  private spawnStage() {
    this.stageDefinition = this.generator.generate(this.stage);
    if (this.stageDefinition.skin) { this.ship.setTint(parseInt(this.stageDefinition.skin.primary.slice(1), 16)); this.ship2?.setTint(parseInt(this.stageDefinition.skin.secondary.slice(1), 16)); }
    const count = Math.min(14, this.stageDefinition.hazards.length);
    for (let index = 0; index < count; index++) this.spawnAsteroid(this.stageDefinition.boss && index === 0 ? 4 : 3);
    this.updateHud();
  }
  private spawnAsteroid(size: number, x = Phaser.Math.Between(30, 610), y = Phaser.Math.Between(50, 430)) {
    const asteroid = this.asteroids.create(x, y, 'vector-asteroid') as Phaser.Physics.Arcade.Image;
    const speed = this.stageDefinition?.enemySpeed ?? 1;
    asteroid.setData('size', size).setScale(size * 0.38).setCircle(18).setVelocity(Phaser.Math.Between(-70, 70) * speed, Phaser.Math.Between(-70, 70) * speed).setAngularVelocity(Phaser.Math.Between(-70, 70));
  }

  private fire(ship: Phaser.Physics.Arcade.Image, player: PlayerId) {
    if (this.weapon === 'EMP') { this.empBlast(); return; }
    const offsets = this.weapon === 'SPREAD' ? [-0.14, 0, 0.14] : [0];
    for (const offset of offsets) {
      const bullet = this.bullets.create(ship.x, ship.y, this.weapon === 'LASER' ? 'vector-laser' : 'vector-shot') as Phaser.Physics.Arcade.Image;
      this.physics.velocityFromRotation(ship.rotation - Math.PI / 2 + offset, this.weapon === 'LASER' ? 720 : 480, (bullet.body as Phaser.Physics.Arcade.Body).velocity);
      bullet.setData('damage', this.weapon === 'LASER' ? 2 : 1).setData('player', player);
      this.time.delayedCall(900, () => bullet.destroy());
    }
    AudioEngine.playEffect('LASER');
  }

  private hitAsteroid(projectile: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject) {
    const asteroid = target as Phaser.Physics.Arcade.Image;
    const size = Number(asteroid.getData('size'));
    const x = asteroid.x; const y = asteroid.y;
    projectile.destroy(); asteroid.destroy();
    for (const childSize of fractureSizes(size)) this.spawnAsteroid(childSize, x + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-12, 12));
    const mineral = this.minerals.create(x, y, 'vector-mineral') as Phaser.Physics.Arcade.Image;
    mineral.setVelocity(Phaser.Math.Between(-45, 45), Phaser.Math.Between(-45, 45)).setAngularVelocity(100);
    const player = Number((projectile as Phaser.Physics.Arcade.Image).getData('player')) === 2 ? 2 : 1;
    this.session.score(player, 50 * size, this.time.now); this.score = this.session.totalScore();
    VFXManager.playExplosion(this, x, y, 0xff2ec4); AudioEngine.playEffect('EXPLOSION'); this.updateHud();
  }

  private collectMineral(_ship: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject) {
    const player = Number((_ship as Phaser.Physics.Arcade.Image).getData('player')) === 2 ? 2 : 1;
    target.destroy(); this.mineralCount += 1; this.session.score(player, 25, this.time.now); this.score = this.session.totalScore(); if (this.mineralCount % 7 === 0) { this.shield = true; this.ship.setTint(0x00ffff); this.ship2?.setTint(0x00ffff); }
    AudioEngine.playEffect('COIN'); this.updateHud();
  }

  private cycleWeapon() { const modes = unlockedWeapons(this.mineralCount); this.weapon = modes[(modes.indexOf(this.weapon) + 1) % modes.length]; AudioEngine.playEffect('POWER_UP'); this.updateHud(); }
  private empBlast() {
    if (this.mineralCount < 12) return;
    this.mineralCount -= 12;
    for (const target of [...this.asteroids.getChildren(), ...this.ufos.getChildren(), ...this.hostileShots.getChildren()]) { const body = target as Phaser.Physics.Arcade.Image; VFXManager.playExplosion(this, body.x, body.y, 0x00ffff); target.destroy(); }
    AudioEngine.playEffect('EXPLOSION'); VFXManager.screenShake(this, 0.025, 350); this.weapon = 'SPREAD'; this.updateHud();
  }

  private spawnUfo() { const ufo = this.ufos.create(-20, Phaser.Math.Between(80, 300), 'vector-ufo') as Phaser.Physics.Arcade.Image; ufo.setVelocityX(90 + this.stage * 8); }
  private ufoFire() {
    const ufo = this.ufos.getFirstAlive() as Phaser.Physics.Arcade.Image | null; if (!ufo) return;
    const velocity = (this.ship.body as Phaser.Physics.Arcade.Body).velocity;
    const aim = predictIntercept(ufo, this.ship, velocity, 260);
    const shot = this.hostileShots.create(ufo.x, ufo.y, 'vector-hostile') as Phaser.Physics.Arcade.Image;
    const projectileSpeed = this.stageDefinition?.modifier === 'FAST_BULLETS' ? 390 : 260;
    this.physics.moveTo(shot, aim.x, aim.y, projectileSpeed); this.time.delayedCall(2200, () => shot.destroy());
  }
  private hitUfo(projectile: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject) { const ufo = target as Phaser.Physics.Arcade.Image; projectile.destroy(); target.destroy(); this.score += 500; VFXManager.playExplosion(this, ufo.x, ufo.y, 0xffff00); this.updateHud(); }

  private damageShip(shipObject: Phaser.GameObjects.GameObject, hazard: Phaser.GameObjects.GameObject) {
    hazard.destroy();
    const damaged = shipObject as Phaser.Physics.Arcade.Image;
    if (this.shield) { this.shield = false; this.ship.clearTint(); this.ship2?.clearTint(); VFXManager.playExplosion(this, damaged.x, damaged.y, 0x00ffff); return; }
    const player = Number(damaged.getData('player')) === 2 ? 2 : 1;
    if (this.session.loseLife(player) > 0) { damaged.setPosition(player === 1 ? 300 : 340, 260).setVelocity(0).setTint(player === 2 ? 0xffff00 : 0xffffff); return; }
    damaged.disableBody(true, true);
    const remaining = [this.ship, this.ship2].some(candidate => candidate?.active);
    if (remaining) { this.updateHud(); return; }
    this.physics.pause(); AudioEngine.playEffect('EXPLOSION'); this.scene.pause();
    this.scene.launch('GameOverScene', { scene: this.scene.key, title: 'VECTOR CORE LOST', score: this.score, difficulty: `${this.difficulty}-${this.mode}`, restartData: { difficulty: this.difficulty, mode: this.mode }, submitScore: true, color: '#ff2ec4' });
  }

  private updateHud() { const state = this.session?.snapshot(); this.hud?.set({ score: this.score, stage: this.stage, health: ((state?.lives[1] ?? 3) + (this.ship2 ? state?.lives[2] ?? 3 : 0)) / (this.ship2 ? 6 : 3) * 100, combo: state?.multiplier, status: `${this.mode}  MIN ${this.mineralCount}  ${this.weapon}${this.shield ? ' SHIELD' : ''}` }); }

  private moveShip(ship: Phaser.Physics.Arcade.Image, player: PlayerId) {
    const inverted = this.stageDefinition?.modifier === 'INVERTED_CONTROLS' ? -1 : 1;
    if (player === 1 ? InputManager.isP1Down('LEFT') : InputManager.isP2Down('LEFT')) ship.setAngularVelocity(-210 * inverted);
    else if (player === 1 ? InputManager.isP1Down('RIGHT') : InputManager.isP2Down('RIGHT')) ship.setAngularVelocity(210 * inverted); else ship.setAngularVelocity(0);
    if (player === 1 ? InputManager.isP1Down('UP') : InputManager.isP2Down('UP')) this.physics.velocityFromRotation(ship.rotation - Math.PI / 2, 235, (ship.body as Phaser.Physics.Arcade.Body).acceleration); else ship.setAcceleration(0);
    const firing = player === 1 ? InputManager.isP1Down('FIRE') : InputManager.isP2Down('FIRE');
    if (firing && !this.fireHeld[player]) this.fire(ship, player);
    this.fireHeld[player] = firing;
  }

  private createTextures() {
    const create = (key: string, draw: (graphics: Phaser.GameObjects.Graphics) => void, width: number, height: number) => { if (this.textures.exists(key)) return; const graphics = this.add.graphics(); draw(graphics); graphics.generateTexture(key, width, height); graphics.destroy(); };
    create('vector-ship', g => { g.lineStyle(2, 0x00ffff).strokeTriangle(16, 0, 3, 30, 16, 23).strokeTriangle(16, 0, 29, 30, 16, 23); }, 32, 32);
    create('vector-asteroid', g => { g.lineStyle(2, 0xff2ec4).strokePoints([new Phaser.Math.Vector2(20,1), new Phaser.Math.Vector2(37,10), new Phaser.Math.Vector2(34,29), new Phaser.Math.Vector2(19,39), new Phaser.Math.Vector2(3,31), new Phaser.Math.Vector2(1,12)], true); }, 40, 40);
    create('vector-shot', g => g.fillStyle(0x00ffff).fillCircle(3, 3, 3), 6, 6);
    create('vector-laser', g => g.fillStyle(0xffffff).fillRect(0, 0, 3, 18), 3, 18);
    create('vector-hostile', g => g.fillStyle(0xff2255).fillCircle(4, 4, 4), 8, 8);
    create('vector-mineral', g => g.lineStyle(2, 0xffff00).strokeTriangle(6, 0, 12, 12, 0, 12), 12, 12);
    create('vector-ufo', g => { g.lineStyle(2, 0xffff00).strokeEllipse(20, 12, 38, 12); g.strokeTriangle(10, 10, 20, 1, 30, 10); }, 40, 24);
  }
}
