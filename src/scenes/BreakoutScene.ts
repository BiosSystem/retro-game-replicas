import Phaser from 'phaser';

export default class BreakoutScene extends Phaser.Scene {
  private paddle!: Phaser.Physics.Arcade.Image;
  private ball!: Phaser.Physics.Arcade.Image;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super('BreakoutScene');
  }

  create() {
    this.add.text(320, 20, 'BRICK BREAKER - ARROWS TO MOVE - ESC TO LOBBY', { fontSize: '12px', color: '#00ff00' }).setOrigin(0.5);
    this.scoreText = this.add.text(320, 50, 'SCORE: 0', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

    this.paddle = this.physics.add.image(320, 440, '');
    const paddleGraphics = this.add.graphics();
    paddleGraphics.fillStyle(0x00ffff, 1);
    paddleGraphics.fillRect(0, 0, 100, 15);
    paddleGraphics.generateTexture('paddle', 100, 15);
    paddleGraphics.destroy();
    this.paddle.setTexture('paddle');
    this.paddle.setImmovable(true);
    (this.paddle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.ball = this.physics.add.image(320, 410, '');
    const ballGraphics = this.add.graphics();
    ballGraphics.fillStyle(0xffffff, 1);
    ballGraphics.fillCircle(8, 8, 8);
    ballGraphics.generateTexture('ball', 16, 16);
    ballGraphics.destroy();
    this.ball.setTexture('ball');
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(1);
    this.ball.setVelocity(200, -200);

    this.bricks = this.physics.add.staticGroup();
    const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff];
    
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        const brick = this.bricks.create(80 + c * 70, 100 + r * 30, '');
        const brickGraphics = this.add.graphics();
        brickGraphics.fillStyle(colors[r], 1);
        brickGraphics.fillRect(0, 0, 60, 20);
        brickGraphics.generateTexture('brick' + r, 60, 20);
        brickGraphics.destroy();
        brick.setTexture('brick' + r);
      }
    }

    this.physics.add.collider(this.ball, this.paddle, this.hitPaddle as any, undefined, this);
    this.physics.add.collider(this.ball, this.bricks, this.hitBrick as any, undefined, this);

    this.input.keyboard?.on('keydown-ESC', () => { this.scene.start('LobbyScene'); });
  }

  hitPaddle(ball: Phaser.Physics.Arcade.Image, paddle: Phaser.Physics.Arcade.Image) {
    let diff = 0;
    if (ball.x < paddle.x) {
      diff = paddle.x - ball.x;
      ball.setVelocityX(-10 * diff);
    } else if (ball.x > paddle.x) {
      diff = ball.x - paddle.x;
      ball.setVelocityX(10 * diff);
    } else {
      ball.setVelocityX(2 + Math.random() * 8);
    }
    this.cameras.main.shake(100, 0.002);
  }

  hitBrick(_ball: any, brick: any) {
    brick.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText('SCORE: ' + this.score);
    this.cameras.main.shake(100, 0.005);
    
    if (this.bricks.countActive() === 0) {
      this.scene.restart();
    }
  }

  update() {
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors?.left.isDown) this.paddle.setVelocityX(-400);
    else if (cursors?.right.isDown) this.paddle.setVelocityX(400);
    else this.paddle.setVelocityX(0);

    if (this.ball.y > 480) {
      this.scene.restart();
    }
  }
}
