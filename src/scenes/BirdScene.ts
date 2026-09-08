import Phaser from 'phaser';
import { VFXManager } from '../engine/VFXManager';
import { InputManager } from '../engine/InputManager';

export default class BirdScene extends Phaser.Scene {
  private bird!: Phaser.Physics.Arcade.Image;
  private pipes!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private timer = 0;
  private pipeGap = 140;
  private pipeSpeed = 180;
  private spawnInterval = 1600;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private difficulty = 'NORMAL';

  constructor() {
    super('BirdScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.pipeGap = 180; this.pipeSpeed = 140; this.spawnInterval = 2000; break;
      case 'NORMAL': this.pipeGap = 140; this.pipeSpeed = 180; this.spawnInterval = 1600; break;
      case 'HARD': this.pipeGap = 110; this.pipeSpeed = 240; this.spawnInterval = 1200; break;
      case 'EXPERT': this.pipeGap = 85; this.pipeSpeed = 320; this.spawnInterval = 900; break;
    }

    this.score = 0;
    this.timer = 0;

    // BG
    this.drawNightSky();

    // UI
    this.add.text(320, 18, 'BRAVE BIRD // NIGHT FLIGHT', { fontFamily: 'Courier', fontSize: '18px', color: '#f2daa0', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(320, 75, '0', { fontFamily: 'Courier', fontSize: '54px', color: '#fff3d0' }).setOrigin(0.5).setAlpha(0.25);
    this.add.text(20, 450, 'SPACE / CLICK: FLAP | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '14px', color: '#aaaaaa' });

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(628, 42, this.difficulty, {
      fontFamily: 'Courier',
      fontSize: '13px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Bird
    this.createFlightTextures();
    this.bird = this.physics.add.image(150, 240, 'brave-bird');
    const body = this.bird.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(1200);
    body.setCollideWorldBounds(false);

    // Trail
    if (!this.textures.exists('spark')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff); g.fillRect(0, 0, 4, 4); g.generateTexture('spark', 4, 4); g.destroy();
    }

    this.particles = this.add.particles(0, 0, 'spark', {
        speed: 20,
        scale: { start: 1, end: 0 },
        lifespan: 500,
        alpha: 0.5,
        emitting: false
    });
    this.particles.startFollow(this.bird);

    this.pipes = this.physics.add.group();

    // Input
    this.input.on('pointerdown', () => this.flap());
    this.input.keyboard?.on('keydown-SPACE', () => this.flap());
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { scene: this.scene.key });
    });
    InputManager.setLegacyGamepadKeyboardBridge(true, this.scene.key);
    this.events.once('shutdown', () => InputManager.setLegacyGamepadKeyboardBridge(false, this.scene.key));

    // Collisions
    this.physics.add.collider(this.bird, this.pipes, () => this.endGame());
  }

  private drawNightSky() {
      const g = this.add.graphics().setDepth(-2);
      g.fillGradientStyle(0x101b32, 0x101b32, 0x321c31, 0x321c31).fillRect(0, 0, 640, 480);
      g.fillStyle(0xd8c8a1, .55).fillCircle(500, 130, 58);
      g.fillStyle(0x17233a).fillCircle(518, 116, 55);
      for (let i = 0; i < 48; i++) g.fillStyle(i % 7 ? 0x9caec0 : 0xf3e4c4, i % 7 ? .35 : .75).fillCircle((i * 89 + 31) % 640, 52 + (i * 53) % 300, i % 7 ? 1 : 1.5);
      g.fillStyle(0x0b1522).fillRect(0, 420, 640, 60);
      for (let x = 0; x < 640; x += 34) g.fillStyle(0x111d2a).fillTriangle(x, 420, x + 18, 382 - x % 47, x + 38, 420);
      g.fillStyle(0x070b13, .85).fillRect(0, 0, 640, 48);
  }

  private createFlightTextures() {
      if (!this.textures.exists('brave-bird')) {
          const g = this.add.graphics();
          g.fillStyle(0x151b28, .6).fillEllipse(17, 20, 28, 8);
          g.fillStyle(0xcc893e).fillEllipse(14, 13, 24, 17);
          g.fillStyle(0xf1be58).fillTriangle(5, 14, 15, 6, 16, 17);
          g.fillStyle(0xffdf78).fillTriangle(22, 11, 32, 15, 22, 17);
          g.fillStyle(0xf5ead2).fillCircle(20, 10, 5).fillStyle(0x17202b).fillCircle(22, 9, 2);
          g.lineStyle(1, 0xf6cf75).strokeEllipse(14, 13, 24, 17);
          g.generateTexture('brave-bird', 34, 26); g.destroy();
      }
      for (const top of [true, false]) {
          const key = top ? 'night-pipe-top' : 'night-pipe-bottom';
          if (this.textures.exists(key)) continue;
          const g = this.add.graphics();
          g.fillStyle(0x183642).fillRect(7, 0, 46, 480);
          g.fillStyle(0x2d6770).fillRect(9, 0, 6, 480);
          for (let y = 18; y < 480; y += 34) g.fillStyle(0x0f2933, .8).fillRect(17, y, 32, 3);
          g.fillStyle(0x102631).fillRoundedRect(0, top ? 458 : 0, 60, 22, 5);
          g.fillStyle(0x5c9b9d).fillRect(3, top ? 458 : 18, 54, 3);
          g.lineStyle(2, 0x7bc1b9, .8).strokeRect(7, 0, 46, 480);
          g.generateTexture(key, 60, 480); g.destroy();
      }
  }

  flap() {
      if (this.bird.y < 0) return;
      (this.bird.body as Phaser.Physics.Arcade.Body).setVelocityY(-350);
      this.particles.emitParticle(5);
      
      this.tweens.add({
          targets: this.bird,
          angle: -30,
          duration: 100
      });
  }

  update(_time: number, delta: number) {
      this.timer += delta;
      if (this.timer > this.spawnInterval) {
          this.timer = 0;
          this.spawnPipes();
      }

      // Rotate bird based on velocity
      const body = this.bird.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y > 0 && this.bird.angle < 90) {
          this.bird.angle += 3;
      }

      if (this.bird.y > 520 || this.bird.y < -50) this.endGame();

      this.pipes.getChildren().forEach((p: any) => {
          if (p.x < -100) p.destroy();
          if (p.x < 150 && !p.passed) {
              p.passed = true;
              this.score += 0.5; // Gate is 2 pipes
              this.scoreText.setText(Math.floor(this.score).toString());
              if (Math.floor(this.score) % 1 === 0) {
                  VFXManager.screenShake(this, 0.001, 100);
              }
          }
      });
  }

  spawnPipes() {
      const gap = this.pipeGap;
      const pos = Phaser.Math.Between(100, 350);

      const top = this.physics.add.image(740, pos - gap/2 - 240, 'night-pipe-top');
      const bot = this.physics.add.image(740, pos + gap/2 + 240, 'night-pipe-bottom');

      const topBody = top.body as Phaser.Physics.Arcade.Body;
      topBody.setVelocityX(-this.pipeSpeed);
      topBody.setAllowGravity(false);
      topBody.setImmovable(true); // CRITICAL: Prevent bird from pushing pipe!

      const botBody = bot.body as Phaser.Physics.Arcade.Body;
      botBody.setVelocityX(-this.pipeSpeed);
      botBody.setAllowGravity(false);
      botBody.setImmovable(true); // CRITICAL: Prevent bird from pushing pipe!

      this.pipes.add(top);
      this.pipes.add(bot);
  }

  endGame() {
      this.physics.pause();
      VFXManager.screenShake(this, 0.03, 400);
      this.bird.setTint(0xff6b5f);
      
      this.scene.pause();
      this.scene.launch('GameOverScene', { scene: this.scene.key, title: 'FLIGHT TERMINATED', score: this.score, difficulty: this.difficulty, submitScore: true, color: '#ffff00' });
  }
}
