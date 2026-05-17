import Phaser from 'phaser';

export default class AsteroidsScene extends Phaser.Scene {
  private ship!: Phaser.Physics.Arcade.Image;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('AsteroidsScene');
  }

  create() {
    this.add.text(320, 20, 'ASTRO DRIFT - ARROWS TO MOVE - SPACE TO SHOOT - ESC TO LOBBY', { fontSize: '12px', color: '#00ff00' }).setOrigin(0.5);

    this.ship = this.physics.add.image(320, 240, ''); // Using a placeholder triangle via graphics later
    this.ship.setCollideWorldBounds(true);
    this.ship.setDrag(0.99);
    this.ship.setMaxVelocity(300);

    // Create a simple ship shape
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x00ff00);
    graphics.strokeTriangle(0, -15, -10, 10, 10, 10);
    graphics.generateTexture('ship', 30, 30);
    graphics.destroy();
    this.ship.setTexture('ship');

    this.asteroids = this.physics.add.group();
    this.bullets = this.physics.add.group();

    for(let i=0; i<5; i++) {
        this.spawnAsteroid();
    }

    this.physics.add.collider(this.bullets, this.asteroids, this.hitAsteroid as any, undefined, this);
    this.physics.add.collider(this.ship, this.asteroids, () => { this.scene.restart(); }, undefined, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on('keydown-SPACE', () => { this.fireBullet(); });
    this.input.keyboard?.on('keydown-ESC', () => { this.scene.start('LobbyScene'); });
  }

  spawnAsteroid() {
    const x = Phaser.Math.Between(0, 640);
    const y = Phaser.Math.Between(0, 480);
    const asteroid = this.asteroids.create(x, y, '');
    
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeCircle(0, 0, 20);
    graphics.generateTexture('asteroid', 40, 40);
    graphics.destroy();
    asteroid.setTexture('asteroid');
    
    asteroid.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
    asteroid.setBounce(1, 1);
  }

  fireBullet() {
    const bullet = this.bullets.create(this.ship.x, this.ship.y, '');
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(0, 0, 4, 4);
    graphics.generateTexture('bullet', 4, 4);
    graphics.destroy();
    bullet.setTexture('bullet');

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
