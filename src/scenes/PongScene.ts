import Phaser from 'phaser';

export default class PongScene extends Phaser.Scene {
  private paddle1!: Phaser.GameObjects.Rectangle;
  private paddle2!: Phaser.GameObjects.Rectangle;
  private ball!: Phaser.GameObjects.Arc;
  private ballVelocity = { x: 300, y: 300 };
  private score1 = 0;
  private score2 = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super('PongScene');
  }

  create() {
    this.add.text(320, 20, 'NEON PONG - ESC TO LOBBY', { fontSize: '16px', color: '#00ff00' }).setOrigin(0.5);
    this.scoreText = this.add.text(320, 60, '0 - 0', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);

    this.paddle1 = this.add.rectangle(30, 240, 15, 80, 0x00ffff);
    this.paddle2 = this.add.rectangle(610, 240, 15, 80, 0xff00ff);
    this.ball = this.add.circle(320, 240, 8, 0xffffff);

    this.physics.add.existing(this.paddle1, true);
    this.physics.add.existing(this.paddle2, true);
    this.physics.add.existing(this.ball);

    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setCollideWorldBounds(true);
    ballBody.setBounce(1, 1);
    ballBody.setVelocity(this.ballVelocity.x, this.ballVelocity.y);

    this.physics.add.collider(this.ball, this.paddle1, this.hitPaddle as any, undefined, this);
    this.physics.add.collider(this.ball, this.paddle2, this.hitPaddle as any, undefined, this);

    this.input.keyboard?.on('keydown-ESC', () => { this.scene.start('LobbyScene'); });
  }

  hitPaddle(ball: Phaser.GameObjects.Arc, _paddle: Phaser.GameObjects.Rectangle) {
    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    // Increase speed slightly
    ballBody.setVelocity(ballBody.velocity.x * 1.05, ballBody.velocity.y * 1.05);
    
    // Screenshake effect
    this.cameras.main.shake(100, 0.005);
  }

  update() {
    const cursors = this.input.keyboard?.createCursorKeys();

    // Player 1 (Keys W/S - mapped to Up/Down for simplicity in this demo)
    if (cursors?.up.isDown) this.paddle1.y -= 7;
    if (cursors?.down.isDown) this.paddle1.y += 7;

    // AI Player 2
    if (this.ball.y > this.paddle2.y + 10) this.paddle2.y += 4;
    else if (this.ball.y < this.paddle2.y - 10) this.paddle2.y -= 4;

    this.paddle1.y = Phaser.Math.Clamp(this.paddle1.y, 40, 440);
    this.paddle2.y = Phaser.Math.Clamp(this.paddle2.y, 40, 440);

    // Scoring
    if (this.ball.x < 10) this.resetBall(2);
    if (this.ball.x > 630) this.resetBall(1);
  }

  resetBall(winner: number) {
    if (winner === 1) this.score1++;
    else this.score2++;
    
    this.scoreText.setText(`${this.score1} - ${this.score2}`);
    this.ball.setPosition(320, 240);
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setVelocity(300 * (winner === 1 ? 1 : -1), 300);
  }
}
