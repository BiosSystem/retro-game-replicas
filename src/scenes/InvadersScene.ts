import Phaser from 'phaser';

export default class InvadersScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private aliens!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private alienBullets!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super('InvadersScene');
  }

  create() {
    this.score = 0;
    this.add.text(320, 20, 'SPACE DEFENDERS - ARROWS TO MOVE - SPACE TO SHOOT - ESC TO LOBBY', { fontSize: '10px', color: '#00ff00' }).setOrigin(0.5);
    this.scoreText = this.add.text(10, 10, 'SCORE: 0', { fontSize: '20px', color: '#ffffff' });

    // Generate textures once if missing
    if (!this.textures.exists('player')) {
      const playerG = this.add.graphics();
      playerG.lineStyle(2, 0x00ff00);
      playerG.strokeRect(0, 0, 30, 20);
      playerG.generateTexture('player', 30, 20);
      playerG.destroy();
    }

    if (!this.textures.exists('alien')) {
      const alienG = this.add.graphics();
      alienG.lineStyle(2, 0xffffff);
      alienG.strokeCircle(15, 15, 10);
      alienG.generateTexture('alien', 30, 30);
      alienG.destroy();
    }

    if (!this.textures.exists('inv_bullet')) {
      const g = this.add.graphics();
      g.fillStyle(0x00ff00, 1);
      g.fillRect(0, 0, 4, 10);
      g.generateTexture('inv_bullet', 4, 10);
      g.destroy();
    }

    if (!this.textures.exists('alien_bullet')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 10);
      g.generateTexture('alien_bullet', 4, 10);
      g.destroy();
    }

    this.player = this.physics.add.image(320, 450, 'player');
    this.player.setCollideWorldBounds(true);

    this.aliens = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.alienBullets = this.physics.add.group();

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        this.aliens.create(100 + c * 50, 80 + r * 40, 'alien');
      }
    }

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on('keydown-SPACE', () => { this.fireBullet(); });
    this.input.keyboard?.on('keydown-ESC', () => { this.scene.start('LobbyScene'); });

    this.physics.add.overlap(this.bullets, this.aliens, this.hitAlien as any, undefined, this);
    this.physics.add.overlap(this.player, this.alienBullets, () => { this.scene.restart(); }, undefined, this);

    this.time.addEvent({ delay: 1000, callback: this.alienShoot, callbackScope: this, loop: true });
  }

  fireBullet() {
    const bullet = this.bullets.create(this.player.x, this.player.y - 10, 'inv_bullet');
    bullet.setVelocityY(-400);
  }

  alienShoot() {
    const alien = this.aliens.getChildren()[Phaser.Math.Between(0, this.aliens.getLength() - 1)] as any;
    if (alien) {
      const b = this.alienBullets.create(alien.x, alien.y + 10, 'alien_bullet');
      b.setVelocityY(200);
    }
  }

  hitAlien(bullet: any, alien: any) {
    bullet.destroy();
    alien.destroy();
    this.score += 20;
    this.scoreText.setText('SCORE: ' + this.score);
    this.cameras.main.shake(100, 0.005);
  }

  update() {
    if (this.cursors.left.isDown) this.player.setVelocityX(-300);
    else if (this.cursors.right.isDown) this.player.setVelocityX(300);
    else this.player.setVelocityX(0);

    this.aliens.getChildren().forEach((a: any) => {
      a.x += Math.sin(this.time.now / 1000) * 2;
      // CRITICAL: Update physics body after modifying X directly!
      a.body.updateFromGameObject();
    });

    if (this.aliens.getLength() === 0) this.scene.restart();
  }
}
