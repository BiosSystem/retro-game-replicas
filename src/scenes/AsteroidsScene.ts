import Phaser from 'phaser';

export default class AsteroidsScene extends Phaser.Scene {
  private ship!: Phaser.Physics.Arcade.Image;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private asteroidCount = 5;
  private maxSpeed = 100;
  private difficulty = 'NORMAL';

  constructor() {
    super('AsteroidsScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.asteroidCount = 3; this.maxSpeed = 60; break;
      case 'NORMAL': this.asteroidCount = 5; this.maxSpeed = 110; break;
      case 'HARD': this.asteroidCount = 8; this.maxSpeed = 180; break;
      case 'EXPERT': this.asteroidCount = 12; this.maxSpeed = 260; break;
    }

    this.add.text(320, 20, 'ASTRO DRIFT - ARROWS TO MOVE - SPACE TO SHOOT - ESC TO LOBBY', { fontSize: '12px', color: '#00ff00' }).setOrigin(0.5);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 10, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    if (!this.textures.exists('ship')) {
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0x00ff00);
      graphics.strokeTriangle(0, -15, -10, 10, 10, 10);
      graphics.generateTexture('ship', 30, 30);
      graphics.destroy();
    }

    if (!this.textures.exists('asteroid')) {
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0xffffff);
      graphics.strokeCircle(20, 20, 18);
      graphics.generateTexture('asteroid', 40, 40);
      graphics.destroy();
    }

    if (!this.textures.exists('bullet')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x00ff00, 1);
      graphics.fillRect(0, 0, 4, 4);
      graphics.generateTexture('bullet', 4, 4);
      graphics.destroy();
    }

    this.ship = this.physics.add.image(320, 240, 'ship');
    this.ship.setCollideWorldBounds(false); // We want wrapping!
    this.ship.setDamping(true);
    this.ship.setDrag(0.98);
    this.ship.setMaxVelocity(300);

    this.asteroids = this.physics.add.group();
    this.bullets = this.physics.add.group();

    for (let i = 0; i < this.asteroidCount; i++) {
      this.spawnAsteroid();
    }

    this.physics.add.collider(this.bullets, this.asteroids, this.hitAsteroid as any, undefined, this);
    this.physics.add.collider(this.ship, this.asteroids, () => { this.scene.restart({ difficulty: this.difficulty }); }, undefined, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on('keydown-SPACE', () => { this.fireBullet(); });
    this.input.keyboard?.on('keydown-ESC', () => { this.scene.start('LobbyScene'); });
  }

  spawnAsteroid() {
    const x = Phaser.Math.Between(0, 640);
    const y = Phaser.Math.Between(0, 480);
    const asteroid = this.asteroids.create(x, y, 'asteroid');
    asteroid.setVelocity(Phaser.Math.Between(-this.maxSpeed, this.maxSpeed), Phaser.Math.Between(-this.maxSpeed, this.maxSpeed));
    asteroid.setBounce(1, 1);
  }

  fireBullet() {
    const bullet = this.bullets.create(this.ship.x, this.ship.y, 'bullet');
    const angle = this.ship.rotation - Math.PI / 2;
    this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
  }

  hitAsteroid(bullet: Phaser.GameObjects.GameObject, asteroid: Phaser.GameObjects.GameObject) {
    bullet.destroy();
    asteroid.destroy();
    this.spawnAsteroid();
    this.cameras.main.shake(100, 0.01);
  }

  update() {
    this.physics.world.wrap(this.ship, 16);
    this.physics.world.wrap(this.asteroids, 20);
    this.physics.world.wrap(this.bullets, 2);

    if (this.cursors.left.isDown) this.ship.setAngularVelocity(-200);
    else if (this.cursors.right.isDown) this.ship.setAngularVelocity(200);
    else this.ship.setAngularVelocity(0);

    if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, 200, (this.ship.body as Phaser.Physics.Arcade.Body).acceleration);
    } else {
        this.ship.setAcceleration(0);
    }
  }
}
