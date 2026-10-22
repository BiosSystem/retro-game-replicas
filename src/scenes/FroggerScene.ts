import Phaser from 'phaser';
import { VFXManager } from '../engine/VFXManager';
import { InputManager } from '../engine/InputManager';

const TILE = 32;

export default class FroggerScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cars!: Phaser.Physics.Arcade.Group;
  private logs!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isMoving = false;
  private onLog: any = null;
  private speedMult = 1.0;
  private difficulty = 'NORMAL';
  private materials!: Phaser.GameObjects.Graphics;

  constructor() {
    super('FroggerScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.speedMult = 0.7; break;
      case 'NORMAL': this.speedMult = 1.0; break;
      case 'HARD': this.speedMult = 1.4; break;
      case 'EXPERT': this.speedMult = 2.0; break;
    }

    this.score = 0;
    this.isMoving = false;
    this.onLog = null;

    // BG Setup
    this.add.rectangle(320, 240, 640, 480, 0x111111); // Base
    this.add.rectangle(320, 160, 640, 192, 0x003366); // River (Y: 64 to 256)
    this.add.rectangle(320, 352, 640, 160, 0x222222); // Road (Y: 272 to 432)
    
    // Safe zones
    this.add.rectangle(320, 48, 640, 32, 0x114411); // Goal
    this.add.rectangle(320, 264, 640, 32, 0x332211); // Median
    this.add.rectangle(320, 448, 640, 32, 0x332211); // Start
    const scenery = this.add.graphics();
    scenery.lineStyle(1, 0x71b9bf, .22);
    for (let y = 78; y < 245; y += 16) for (let x = (y * 7) % 41; x < 640; x += 57) scenery.lineBetween(x, y, x + 19, y);
    for (let y = 288; y < 432; y += 32) for (let x = 0; x < 640; x += 48) scenery.fillStyle(0xa8b4b2, .25).fillRect(x, y, 22, 2);
    for (const y of [40, 444]) for (let x = 8; x < 640; x += 24) {
      scenery.fillStyle(0x496346).fillTriangle(x, y + 10, x + 3, y, x + 6, y + 10);
      scenery.fillStyle(0x80975f).fillRect(x + 2, y + 6, 2, 5);
    }

    // UI
    this.add.text(320, 16, 'FROGGIE CROSSER', { fontFamily: 'Courier', fontSize: '20px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(12, 12, 'SCORE: 0', { fontFamily: 'Courier', fontSize: '13px', color: '#ffffff' });
    this.add.text(20, 460, 'ARROWS: MOVE | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '14px', color: '#aaaaaa' });

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(628, 12, this.difficulty, {
      fontFamily: 'Courier',
      fontSize: '13px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Groups
    this.cars = this.physics.add.group();
    this.logs = this.physics.add.group();

    this.spawnRoad();
    this.spawnRiver();

    // Player
    this.player = this.add.rectangle(320, 448, 24, 24, 0x00ff00);
    this.player.setFillStyle(0x00ff00, 0);
    this.materials = this.add.graphics().setDepth(2);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // Input
    this.input.keyboard?.on('keydown-UP', () => this.move(0, -TILE));
    this.input.keyboard?.on('keydown-DOWN', () => this.move(0, TILE));
    this.input.keyboard?.on('keydown-LEFT', () => this.move(-TILE, 0));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move(TILE, 0));
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { scene: this.scene.key });
    });
    InputManager.setLegacyGamepadKeyboardBridge(true, this.scene.key);
    this.events.once('shutdown', () => InputManager.setLegacyGamepadKeyboardBridge(false, this.scene.key));
  }

  move(dx: number, dy: number) {
      if (this.isMoving) return;
      this.isMoving = true;
      this.onLog = null;

      this.tweens.add({
          targets: this.player,
          x: this.player.x + dx,
          y: this.player.y + dy,
          duration: 100,
          onUpdate: () => {
              // CRITICAL: Update physics body during tween animation!
              (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
          },
          onComplete: () => {
              this.isMoving = false;
              (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
              this.checkPosition();
          }
      });
  }

  spawnRoad() {
      const lanes = [
          { y: 400, speed: -120, color: 0xff0055 },
          { y: 368, speed: 150, color: 0xffff00 },
          { y: 336, speed: -90, color: 0x00ffff },
          { y: 304, speed: 200, color: 0xff8800 },
          { y: 272, speed: -160, color: 0xff00ff }
      ];

      lanes.forEach(l => {
          for (let i = 0; i < 3; i++) {
              const car = this.add.rectangle(i * 250, l.y, 40, 20, l.color);
              this.physics.add.existing(car);
              (car.body as Phaser.Physics.Arcade.Body).setVelocityX(l.speed * this.speedMult);
              (car.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
              this.cars.add(car);
          }
      });
  }

  spawnRiver() {
      const lanes = [
          { y: 232, speed: 110, w: 90 },
          { y: 200, speed: -140, w: 120 },
          { y: 168, speed: 180, w: 80 },
          { y: 136, speed: -100, w: 150 },
          { y: 104, speed: 130, w: 100 },
          { y: 72, speed: -170, w: 90 }
      ];

      lanes.forEach(l => {
          for (let i = 0; i < 3; i++) {
              const log = this.add.rectangle(i * 280, l.y, l.w, 22, 0x885533);
              log.setStrokeStyle(1, 0xaa7755);
              this.physics.add.existing(log);
              (log.body as Phaser.Physics.Arcade.Body).setVelocityX(l.speed * this.speedMult);
              (log.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
              this.logs.add(log);
          }
      });
  }

  update(_time: number, delta: number) {
      // Wrap obstacles
      this.cars.getChildren().forEach((c: any) => {
          if (c.body.velocity.x > 0 && c.x > 680) c.x = -40;
          if (c.body.velocity.x < 0 && c.x < -40) c.x = 680;
      });

      this.logs.getChildren().forEach((l: any) => {
          if (l.body.velocity.x > 0 && l.x > 720) l.x = -80;
          if (l.body.velocity.x < 0 && l.x < -80) l.x = 720;
      });

      // Drifting on log
      if (this.onLog && !this.isMoving) {
          this.player.x += this.onLog.body.velocity.x * (delta / 1000);
          (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
          if (this.player.x < 0 || this.player.x > 640) this.endGame('OUT OF BOUNDS');
      }

      this.drawMaterials();

      // Check active collisions
      if (!this.isMoving) {
          this.physics.overlap(this.player, this.cars, () => this.endGame('SPLAT!'));
          
          // River check
          if (this.player.y >= 64 && this.player.y <= 248) {
              let on = false;
              this.physics.overlap(this.player, this.logs, (_p, l) => {
                  on = true;
                  this.onLog = l;
              });
              if (!on) this.endGame('SPLASH!');
          }
      }
  }

  private drawMaterials() {
      const g = this.materials.clear();
      for (const object of this.cars.getChildren()) {
          const car = object as Phaser.GameObjects.Rectangle;
          const facing = (car.body as Phaser.Physics.Arcade.Body).velocity.x < 0 ? -1 : 1;
          g.fillStyle(0x0b1420).fillRect(car.x - 10, car.y - 12, 8, 3).fillRect(car.x + 6, car.y - 12, 8, 3).fillRect(car.x - 10, car.y + 9, 8, 3).fillRect(car.x + 6, car.y + 9, 8, 3);
          g.fillStyle(0x23374c).fillRoundedRect(car.x - 8, car.y - 7, 18, 14, 3);
          g.fillStyle(0x9cc5ce).fillRect(car.x - 6, car.y - 5, 5, 10);
          g.fillStyle(0xffe7b0).fillRect(car.x + facing * 18 - 1, car.y - 7, 3, 4).fillRect(car.x + facing * 18 - 1, car.y + 3, 3, 4);
      }
      for (const object of this.logs.getChildren()) {
          const log = object as Phaser.GameObjects.Rectangle;
          g.lineStyle(1, 0xd1a772, .7).lineBetween(log.x - log.width / 2 + 6, log.y - 5, log.x + log.width / 2 - 6, log.y - 5);
          g.lineStyle(2, 0x503a2e).lineBetween(log.x - log.width / 2 + 5, log.y + 5, log.x + log.width / 2 - 8, log.y + 5);
          g.lineStyle(1, 0xe1b57b).strokeEllipse(log.x + log.width / 2 - 5, log.y, 6, 17);
      }
      const { x, y } = this.player;
      g.fillStyle(0x071b16, .65).fillEllipse(x, y + 8, 26, 8);
      g.fillStyle(0x548747).fillRoundedRect(x - 12, y - 5, 6, 15, 3).fillRoundedRect(x + 6, y - 5, 6, 15, 3);
      g.fillStyle(0x9ad47b).fillEllipse(x, y, 16, 21);
      g.fillStyle(0xd4eaa3).fillEllipse(x, y + 3, 9, 12);
      for (const side of [-1, 1]) {
          g.fillStyle(0xccebab).fillCircle(x + side * 6, y - 8, 5);
          g.fillStyle(0x132b28).fillCircle(x + side * 6, y - 9, 2);
      }
  }

  checkPosition() {
      // Goal check
      if (this.player.y <= 56) {
          this.score += 500;
          this.scoreText.setText('SCORE: ' + this.score);
          this.cameras.main.flash(200, 0, 255, 0);
          this.player.setPosition(320, 448);
          (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
          this.onLog = null;
      }
  }

  endGame(reason: string) {
      this.physics.pause();
      VFXManager.screenShake(this, 0.02, 300);
      
      this.scene.pause();
      this.scene.launch('GameOverScene', { scene: this.scene.key, title: reason, score: this.score, difficulty: this.difficulty, submitScore: true, color: '#ff0055' });
  }
}
