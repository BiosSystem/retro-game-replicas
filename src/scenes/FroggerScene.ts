import Phaser from 'phaser';

const TILE = 32;

export default class FroggerScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cars!: Phaser.Physics.Arcade.Group;
  private logs!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isMoving = false;
  private onLog: any = null;

  constructor() {
    super('FroggerScene');
  }

  create() {
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

    // UI
    this.add.text(320, 16, 'FROGGIE CROSSER', { fontFamily: 'Courier', fontSize: '20px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(20, 16, 'SCORE: 0', { fontFamily: 'Courier', fontSize: '18px', color: '#ffffff' });
    this.add.text(20, 460, 'ARROWS: MOVE | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '14px', color: '#aaaaaa' });

    // Groups
    this.cars = this.physics.add.group();
    this.logs = this.physics.add.group();

    this.spawnRoad();
    this.spawnRiver();

    // Player
    this.player = this.add.rectangle(320, 448, 24, 24, 0x00ff00);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // Input
    this.input.keyboard?.on('keydown-UP', () => this.move(0, -TILE));
    this.input.keyboard?.on('keydown-DOWN', () => this.move(0, TILE));
    this.input.keyboard?.on('keydown-LEFT', () => this.move(-TILE, 0));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move(TILE, 0));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene'));
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
              (car.body as Phaser.Physics.Arcade.Body).setVelocityX(l.speed);
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
              (log.body as Phaser.Physics.Arcade.Body).setVelocityX(l.speed);
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
      this.cameras.main.shake(300, 0.02);
      
      const banner = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.85).setInteractive();
      this.add.text(320, 240, `${reason}\nFINAL SCORE: ${this.score}\nCLICK TO RESTART`, { fontFamily: 'Courier', fontSize: '28px', color: '#ff0055', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
      banner.on('pointerdown', () => this.scene.restart());
  }
}
