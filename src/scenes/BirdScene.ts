import Phaser from 'phaser';

export default class BirdScene extends Phaser.Scene {
  private bird!: Phaser.GameObjects.Rectangle;
  private pipes!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private timer = 0;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super('BirdScene');
  }

  create() {
    this.score = 0;
    this.timer = 0;

    // BG
    this.add.rectangle(320, 240, 640, 480, 0x050510);
    this.add.grid(320, 240, 640, 480, 32, 32, 0x112233, 0.1);

    // UI
    this.add.text(320, 20, 'BRAVE BIRD: NOCTURNAL', { fontFamily: 'Courier', fontSize: '24px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(320, 100, '0', { fontFamily: 'Courier', fontSize: '80px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.2);
    this.add.text(20, 450, 'SPACE / CLICK: FLAP | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '14px', color: '#aaaaaa' });

    // Bird
    this.bird = this.add.rectangle(150, 240, 24, 24, 0xffff00);
    this.physics.add.existing(this.bird);
    const body = this.bird.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(1200);
    body.setCollideWorldBounds(false);

    // Trail
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
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene'));

    // Collisions
    this.physics.add.collider(this.bird, this.pipes, () => this.endGame());
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
      if (this.timer > 1600) {
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
                  this.cameras.main.shake(100, 0.001);
              }
          }
      });
  }

  spawnPipes() {
      const gap = 140;
      const pos = Phaser.Math.Between(100, 350);

      const top = this.add.rectangle(740, pos - gap/2 - 240, 60, 480, 0x33aa33);
      const bot = this.add.rectangle(740, pos + gap/2 + 240, 60, 480, 0x33aa33);
      
      // Neon glow
      top.setStrokeStyle(2, 0x00ff00, 0.8);
      bot.setStrokeStyle(2, 0x00ff00, 0.8);

      this.physics.add.existing(top);
      this.physics.add.existing(bot);

      (top.body as Phaser.Physics.Arcade.Body).setVelocityX(-180);
      (top.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      (bot.body as Phaser.Physics.Arcade.Body).setVelocityX(-180);
      (bot.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

      this.pipes.add(top);
      this.pipes.add(bot);
  }

  endGame() {
      this.physics.pause();
      this.cameras.main.shake(400, 0.03);
      this.bird.setFillStyle(0xff0000);
      
      const banner = this.add.rectangle(320, 240, 640, 120, 0x000000, 0.8);
      this.add.text(320, 240, `FLIGHT TERMINATED\nSCORE: ${Math.floor(this.score)}\nCLICK TO REBOOT`, { fontFamily: 'Courier', fontSize: '28px', color: '#ffff00', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
      banner.setInteractive().on('pointerdown', () => this.scene.restart());
  }
}
