import Phaser from 'phaser';

export default class BreakoutScene extends Phaser.Scene {
  private paddle!: Phaser.Physics.Arcade.Image;
  private ball!: Phaser.Physics.Arcade.Image;
  private bricks!: Phaser.Physics.Arcade.StaticGroup;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private ballSpeed = 220;
  private paddleSpeed = 400;
  private paddleMult = 10;
  private difficulty = 'NORMAL';

  constructor() {
    super('BreakoutScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.ballSpeed = 150; this.paddleSpeed = 450; this.paddleMult = 8; break;
      case 'NORMAL': this.ballSpeed = 220; this.paddleSpeed = 400; this.paddleMult = 10; break;
      case 'HARD': this.ballSpeed = 320; this.paddleSpeed = 380; this.paddleMult = 12; break;
      case 'EXPERT': this.ballSpeed = 450; this.paddleSpeed = 350; this.paddleMult = 15; break;
    }

    this.score = 0;
    this.add.text(320, 20, 'BRICK BREAKER - ARROWS TO MOVE - ESC TO LOBBY', { fontSize: '12px', color: '#00ff00' }).setOrigin(0.5);
    this.scoreText = this.add.text(320, 50, 'SCORE: 0', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 10, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Create textures once if missing
    if (!this.textures.exists('paddle')) {
      const paddleGraphics = this.add.graphics();
      paddleGraphics.fillStyle(0x00ffff, 1);
      paddleGraphics.fillRect(0, 0, 100, 15);
      paddleGraphics.generateTexture('paddle', 100, 15);
      paddleGraphics.destroy();
    }

    if (!this.textures.exists('ball')) {
      const ballGraphics = this.add.graphics();
      ballGraphics.fillStyle(0xffffff, 1);
      ballGraphics.fillCircle(8, 8, 8);
      ballGraphics.generateTexture('ball', 16, 16);
      ballGraphics.destroy();
    }

    const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff];
    colors.forEach((c, r) => {
      if (!this.textures.exists('brick' + r)) {
        const brickGraphics = this.add.graphics();
        brickGraphics.fillStyle(c, 1);
        brickGraphics.fillRect(0, 0, 60, 20);
        brickGraphics.generateTexture('brick' + r, 60, 20);
        brickGraphics.destroy();
      }
    });

    this.paddle = this.physics.add.image(320, 440, 'paddle');
    this.paddle.setImmovable(true);
    this.paddle.setCollideWorldBounds(true);
    (this.paddle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.ball = this.physics.add.image(320, 410, 'ball');
    // Collide with top, left, right, but NOT bottom!
    (this.ball.body as Phaser.Physics.Arcade.Body).setBoundsRectangle(new Phaser.Geom.Rectangle(0, 0, 640, 500));
    this.ball.setCollideWorldBounds(true);
    (this.ball.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
    this.ball.setBounce(1);
    this.ball.setVelocity(this.ballSpeed, -this.ballSpeed);

    this.bricks = this.physics.add.staticGroup();
    
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        const brick = this.bricks.create(80 + c * 70, 100 + r * 30, 'brick' + r);
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
      ball.setVelocityX(-this.paddleMult * diff);
    } else if (ball.x > paddle.x) {
      diff = ball.x - paddle.x;
      ball.setVelocityX(this.paddleMult * diff);
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
      this.scene.restart({ difficulty: this.difficulty });
    }
  }

  update() {
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors?.left.isDown) this.paddle.setVelocityX(-this.paddleSpeed);
    else if (cursors?.right.isDown) this.paddle.setVelocityX(this.paddleSpeed);
    else this.paddle.setVelocityX(0);

    if (this.ball.y > 480) {
      this.scene.restart({ difficulty: this.difficulty });
    }
  }
}
