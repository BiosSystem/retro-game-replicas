import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { SaveManager } from '../../engine/SaveManager';
import { VFXManager } from '../../engine/VFXManager';
import { fractureSizes, predictIntercept, unlockedWeapons, type WeaponMode } from './AsteroidSystems';

export default class NeonAsteroidsScene extends Phaser.Scene {
  private ship!: Phaser.Physics.Arcade.Image;
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
  private hud!: Phaser.GameObjects.Text;
  private stagePending = false;

  constructor() { super('AsteroidsScene'); }

  create(data: { difficulty?: string }) {
    this.difficulty = data?.difficulty ?? 'NORMAL';
    this.score = 0; this.stage = 1; this.mineralCount = 0; this.weapon = 'SPREAD'; this.shield = false; this.stagePending = false;
    this.createTextures();
    this.add.grid(320, 240, 640, 480, 32, 32, 0x02000c, 1, 0x632cff, 0.1);
    this.add.text(320, 18, 'NEON VECTOR ASTEROIDS', { fontFamily: 'Courier', fontSize: '20px', color: '#ff2ec4', fontStyle: 'bold' }).setOrigin(0.5);
    this.hud = this.add.text(12, 12, '', { fontFamily: 'Courier', fontSize: '13px', color: '#00ffcc' });
    this.add.text(628, 12, 'ARROWS THRUST  SPACE FIRE  Q WEAPON  ESC PAUSE', { fontFamily: 'Courier', fontSize: '10px', color: '#8888aa' }).setOrigin(1, 0);

    this.ship = this.physics.add.image(320, 260, 'vector-ship').setDamping(true).setDrag(0.985).setMaxVelocity(320);
    this.asteroids = this.physics.add.group(); this.bullets = this.physics.add.group(); this.minerals = this.physics.add.group();
    this.ufos = this.physics.add.group(); this.hostileShots = this.physics.add.group();
    this.physics.add.overlap(this.bullets, this.asteroids, this.hitAsteroid as never, undefined, this);
    this.physics.add.overlap(this.bullets, this.ufos, this.hitUfo as never, undefined, this);
    this.physics.add.overlap(this.ship, this.minerals, this.collectMineral as never, undefined, this);
    this.physics.add.overlap(this.ship, this.asteroids, this.damageShip as never, undefined, this);
    this.physics.add.overlap(this.ship, this.hostileShots, this.damageShip as never, undefined, this);
    this.spawnStage();
    this.time.addEvent({ delay: 9000, loop: true, callback: this.spawnUfo, callbackScope: this });
    this.time.addEvent({ delay: 1400, loop: true, callback: this.ufoFire, callbackScope: this });
    this.input.keyboard?.on('keydown-SPACE', () => this.fire());
    this.input.keyboard?.on('keydown-Q', () => this.cycleWeapon());
    this.input.keyboard?.on('keydown-ESC', () => { this.scene.pause(); this.scene.launch('PauseScene', { scene: this.scene.key }); });
    this.events.once('shutdown', () => AudioEngine.stopTrack());
    AudioEngine.playTrack('vector');
    this.updateHud();
  }

  update() {
    this.physics.world.wrap([this.ship, this.asteroids, this.bullets, this.minerals, this.ufos, this.hostileShots], 24);
    if (InputManager.isP1Down('LEFT')) this.ship.setAngularVelocity(-210); else if (InputManager.isP1Down('RIGHT')) this.ship.setAngularVelocity(210); else this.ship.setAngularVelocity(0);
    if (InputManager.isP1Down('UP')) this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, 235, (this.ship.body as Phaser.Physics.Arcade.Body).acceleration); else this.ship.setAcceleration(0);
    if (this.asteroids.countActive() === 0 && !this.stagePending) {
      this.stagePending = true; this.stage += 1; AudioEngine.playEffect('STAGE_CLEAR');
      this.time.delayedCall(800, () => { this.spawnStage(); this.stagePending = false; });
    }
  }

  private spawnStage() { for (let index = 0; index < Math.min(12, 3 + this.stage); index++) this.spawnAsteroid(3); this.updateHud(); }
  private spawnAsteroid(size: number, x = Phaser.Math.Between(30, 610), y = Phaser.Math.Between(50, 430)) {
    const asteroid = this.asteroids.create(x, y, 'vector-asteroid') as Phaser.Physics.Arcade.Image;
    asteroid.setData('size', size).setScale(size * 0.38).setCircle(18).setVelocity(Phaser.Math.Between(-70, 70) * (1 + this.stage * 0.08), Phaser.Math.Between(-70, 70) * (1 + this.stage * 0.08)).setAngularVelocity(Phaser.Math.Between(-70, 70));
  }

  private fire() {
    if (this.weapon === 'EMP') { this.empBlast(); return; }
    const offsets = this.weapon === 'SPREAD' ? [-0.14, 0, 0.14] : [0];
    for (const offset of offsets) {
      const bullet = this.bullets.create(this.ship.x, this.ship.y, this.weapon === 'LASER' ? 'vector-laser' : 'vector-shot') as Phaser.Physics.Arcade.Image;
      this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2 + offset, this.weapon === 'LASER' ? 720 : 480, (bullet.body as Phaser.Physics.Arcade.Body).velocity);
      bullet.setData('damage', this.weapon === 'LASER' ? 2 : 1);
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
    this.score += 50 * size; VFXManager.playExplosion(this, x, y, 0xff2ec4); AudioEngine.playEffect('EXPLOSION'); this.updateHud();
  }

  private collectMineral(_ship: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject) {
    target.destroy(); this.mineralCount += 1; this.score += 25; if (this.mineralCount % 7 === 0) { this.shield = true; this.ship.setTint(0x00ffff); }
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
    this.physics.moveTo(shot, aim.x, aim.y, 260); this.time.delayedCall(2200, () => shot.destroy());
  }
  private hitUfo(projectile: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject) { const ufo = target as Phaser.Physics.Arcade.Image; projectile.destroy(); target.destroy(); this.score += 500; VFXManager.playExplosion(this, ufo.x, ufo.y, 0xffff00); this.updateHud(); }

  private damageShip(_ship: Phaser.GameObjects.GameObject, hazard: Phaser.GameObjects.GameObject) {
    hazard.destroy();
    if (this.shield) { this.shield = false; this.ship.clearTint(); VFXManager.playExplosion(this, this.ship.x, this.ship.y, 0x00ffff); return; }
    this.physics.pause(); AudioEngine.playEffect('EXPLOSION'); SaveManager.submitScore('AsteroidsScene', this.difficulty, this.score);
    const panel = this.add.text(320, 240, `VECTOR CORE LOST\nSCORE ${this.score}\nCLICK TO REBOOT`, { fontFamily: 'Courier', fontSize: '28px', color: '#ff2ec4', align: 'center', backgroundColor: '#000000cc', padding: { x: 20, y: 14 } }).setOrigin(0.5).setInteractive();
    panel.on('pointerdown', () => this.scene.restart({ difficulty: this.difficulty }));
  }

  private updateHud() { this.hud?.setText(`SCORE ${this.score}  STAGE ${this.stage}  MINERALS ${this.mineralCount}  ${this.weapon}${this.shield ? '  SHIELD' : ''}`); }

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
