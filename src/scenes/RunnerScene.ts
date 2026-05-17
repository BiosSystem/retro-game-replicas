import Phaser from 'phaser';

export default class RunnerScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private speed = 300;
  private spawnTimer = 0;
  private bg1!: Phaser.GameObjects.TileSprite;
  private bg2!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('RunnerScene');
  }

  create() {
    this.score = 0;
    this.speed = 300;
    this.spawnTimer = 0;

    // Parallax BG
    this.bg1 = this.add.tileSprite(320, 240, 640, 480, 'bg_city').setTint(0x112233);
    this.bg2 = this.add.tileSprite(320, 240, 640, 480, 'bg_trees').setTint(0x224455);
    
    // Create textures if missing
    const g = this.add.graphics();
    g.fillStyle(0x111122); g.fillRect(0, 0, 64, 64); g.generateTexture('bg_city', 64, 64); g.clear();
    g.fillStyle(0x112222); g.fillRect(0, 0, 64, 64); g.generateTexture('bg_trees', 64, 64); g.destroy();

    // Ground
    const ground = this.add.rectangle(320, 440, 640, 80, 0x336677);
    this.physics.add.existing(ground, true);

    // Player
    this.player = this.add.rectangle(100, 380, 30, 50, 0x00ffcc);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(1500);

    this.obstacles = this.physics.add.group();

    // UI
    this.add.text(320, 20, 'PIXEL RUNNER', { fontFamily: 'Courier', fontSize: '24px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', { fontFamily: 'Courier', fontSize: '20px', color: '#ffffff' });
    this.add.text(20, 50, 'UP / SPACE: JUMP | DOWN: DUCK | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '14px', color: '#aaaaaa' });

    // Collisions
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, this.obstacles, () => this.endGame());

    // Input
    this.input.keyboard?.on('keydown-SPACE', () => this.jump());
    this.input.keyboard?.on('keydown-UP', () => this.jump());
    this.input.keyboard?.on('keydown-DOWN', () => this.duck(true));
    this.input.keyboard?.on('keyup-DOWN', () => this.duck(false));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene'));
  }

  jump() {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body.touching.down) {
          body.setVelocityY(-650);
          this.cameras.main.shake(100, 0.001);
      }
  }

  duck(down: boolean) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (down) {
          this.player.setSize(30, 25);
          this.player.setDisplaySize(30, 25);
          if (!body.touching.down) body.setVelocityY(800); // Fast fall
      } else {
          this.player.setSize(30, 50);
          this.player.setDisplaySize(30, 50);
      }
  }

  update(_time: number, delta: number) {
      // Scroll BG
      this.bg1.tilePositionX += delta * 0.05 * (this.speed / 300);
      this.bg2.tilePositionX += delta * 0.1 * (this.speed / 300);

      this.score += delta * 0.01 * (this.speed / 300);
      this.scoreText.setText('SCORE: ' + Math.floor(this.score));
      this.speed += delta * 0.005; // Speed ramp

      this.spawnTimer += delta;
      if (this.spawnTimer > Math.max(800, 2000 - this.speed)) {
          this.spawnTimer = 0;
          this.spawnObstacle();
      }

      // Cleanup passed obstacles
      this.obstacles.getChildren().forEach((obs: any) => {
          if (obs.x < -50) obs.destroy();
      });
  }

  spawnObstacle() {
      const isHigh = Phaser.Math.Between(0, 1) === 1;
      const y = isHigh ? 330 : 385;
      const h = isHigh ? 20 : 30;
      const color = isHigh ? 0xff0055 : 0xffaa00;

      const obs = this.add.rectangle(700, y, 25, h, color);
      this.physics.add.existing(obs, true); // Static body but we move it manually or via velocity
      (obs.body as Phaser.Physics.Arcade.Body).setVelocityX(-this.speed);
      
      this.obstacles.add(obs);
  }

  endGame() {
      this.physics.pause();
      this.cameras.main.shake(300, 0.02);
      const banner = this.add.rectangle(320, 240, 640, 100, 0x000000, 0.8);
      this.add.text(320, 240, `GAME OVER\nFINAL SCORE: ${Math.floor(this.score)}\nCLICK TO RESTART`, { fontFamily: 'Courier', fontSize: '28px', color: '#ff0055', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
      banner.setInteractive().on('pointerdown', () => this.scene.restart());
  }
}
