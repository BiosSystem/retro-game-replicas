import Phaser from 'phaser';

export default class PongScene extends Phaser.Scene {
  private paddle1!: Phaser.GameObjects.Rectangle;
  private paddle2!: Phaser.GameObjects.Rectangle;
  private ball!: Phaser.GameObjects.Arc;
  private baseSpeed = 300;
  private aiSpeed = 4;
  private playerSpeed = 7;
  private score1 = 0;
  private score2 = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private difficulty = 'NORMAL';

  constructor() {
    super('PongScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.baseSpeed = 200; this.aiSpeed = 2.5; this.playerSpeed = 7; break;
      case 'NORMAL': this.baseSpeed = 300; this.aiSpeed = 4.2; this.playerSpeed = 7; break;
      case 'HARD': this.baseSpeed = 450; this.aiSpeed = 6.5; this.playerSpeed = 8; break;
      case 'EXPERT': this.baseSpeed = 650; this.aiSpeed = 9.5; this.playerSpeed = 10; break;
    }

    this.score1 = 0;
    this.score2 = 0;
    this.add.text(320, 20, 'NEON PONG - ESC TO LOBBY', { fontSize: '16px', color: '#00ff00' }).setOrigin(0.5);
    this.scoreText = this.add.text(320, 60, '0 - 0', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 10, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.paddle1 = this.add.rectangle(30, 240, 15, 80, 0x00ffff);
    this.paddle2 = this.add.rectangle(610, 240, 15, 80, 0xff00ff);
    this.ball = this.add.circle(320, 240, 8, 0xffffff);

    this.physics.add.existing(this.paddle1, true); // Static
    this.physics.add.existing(this.paddle2, true); // Static
    this.physics.add.existing(this.ball);

    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setCollideWorldBounds(true);
    ballBody.setBounce(1, 1);
    ballBody.setVelocity(this.baseSpeed, this.baseSpeed);

    this.physics.add.collider(this.ball, this.paddle1, this.hitPaddle as any, undefined, this);
    this.physics.add.collider(this.ball, this.paddle2, this.hitPaddle as any, undefined, this);

    this.input.keyboard?.on('keydown-ESC', () => { this.scene.start('LobbyScene'); });
  }

  hitPaddle(ball: Phaser.GameObjects.Arc, _paddle: Phaser.GameObjects.Rectangle) {
    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setVelocity(ballBody.velocity.x * 1.05, ballBody.velocity.y * 1.05);
    this.cameras.main.shake(100, 0.005);
  }

  update() {
    const cursors = this.input.keyboard?.createCursorKeys();

    if (cursors?.up.isDown) this.paddle1.y -= this.playerSpeed;
    if (cursors?.down.isDown) this.paddle1.y += this.playerSpeed;

    if (this.ball.y > this.paddle2.y + 10) this.paddle2.y += this.aiSpeed;
    else if (this.ball.y < this.paddle2.y - 10) this.paddle2.y -= this.aiSpeed;

    this.paddle1.y = Phaser.Math.Clamp(this.paddle1.y, 40, 440);
    this.paddle2.y = Phaser.Math.Clamp(this.paddle2.y, 40, 440);

    // CRITICAL: Update static physics bodies after modifying Y position!
    (this.paddle1.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    (this.paddle2.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    if (this.ball.x < 10) this.resetBall(2);
    if (this.ball.x > 630) this.resetBall(1);
  }

  resetBall(winner: number) {
    if (winner === 1) this.score1++;
    else this.score2++;
    
    this.scoreText.setText(`${this.score1} - ${this.score2}`);
    this.ball.setPosition(320, 240);
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setVelocity(this.baseSpeed * (winner === 1 ? 1 : -1), this.baseSpeed);
  }
}
