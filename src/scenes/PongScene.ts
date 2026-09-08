import Phaser from 'phaser';
import { InputManager } from '../engine/InputManager';
import { AudioEngine } from '../engine/AudioEngine';
import { VFXManager } from '../engine/VFXManager';
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
  private materials!: Phaser.GameObjects.Graphics;

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
    this.drawCourt();
    this.add.text(64, 14, 'NEON PONG', { fontFamily: 'Courier', fontSize: '16px', color: '#93dbe0' }).setDepth(3);
    this.scoreText = this.add.text(320, 26, '0 - 0', { fontFamily: 'Courier', fontSize: '28px', color: '#f3eee1' }).setOrigin(0.5).setDepth(3);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(576, 14, this.difficulty, {
      fontFamily: 'Courier',
      fontSize: '13px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.paddle1 = this.add.rectangle(30, 240, 15, 80, 0x00ffff);
    this.paddle2 = this.add.rectangle(610, 240, 15, 80, 0xff00ff);
    this.ball = this.add.circle(320, 240, 8, 0xffffff);
    this.materials = this.add.graphics().setDepth(2);

    this.physics.add.existing(this.paddle1, true); // Static
    this.physics.add.existing(this.paddle2, true); // Static
    this.physics.add.existing(this.ball);

    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setCollideWorldBounds(true);
    ballBody.setBounce(1, 1);
    ballBody.setVelocity(this.baseSpeed, this.baseSpeed);

    this.physics.add.collider(this.ball, this.paddle1, this.hitPaddle as any, undefined, this);
    this.physics.add.collider(this.ball, this.paddle2, this.hitPaddle as any, undefined, this);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { scene: this.scene.key });
    });

    // DDA Scaling
    this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => {
        this.baseSpeed *= 1.05;
        this.aiSpeed *= 1.05;
      }
    });
  }

  hitPaddle(ball: Phaser.GameObjects.Arc, _paddle: Phaser.GameObjects.Rectangle) {
    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setVelocity(ballBody.velocity.x * 1.05, ballBody.velocity.y * 1.05);
    VFXManager.screenShake(this, 0.005, 100);
    VFXManager.playHit(this, ball.x, ball.y, 0x00ffcc);
    AudioEngine.playTone(400, 'square', 0.1);
  }

  private drawCourt() {
    const g = this.add.graphics().setDepth(-2);
    g.fillGradientStyle(0x081c2b, 0x081c2b, 0x101526, 0x101526).fillRect(0, 0, 640, 480);
    // Restrained court markings remain decorative: the physics bounds are unchanged.
    g.lineStyle(1, 0x496471, .35).strokeRoundedRect(52, 56, 536, 404, 18);
    g.lineStyle(2, 0x718493, .25).strokeCircle(320, 240, 72);
    for (let y = 62; y < 460; y += 22) g.fillStyle(0x7e919c, .3).fillRect(319, y, 2, 10);
    for (const x of [5, 629]) {
      g.fillStyle(0x263448).fillRect(x, 52, 6, 408);
      for (let y = 64; y < 455; y += 28) g.fillStyle(x < 320 ? 0x489baf : 0x9d528b, .5).fillRect(x + 1, y, 4, 12);
    }
    g.fillStyle(0x040c16, .88).fillRect(0, 0, 640, 48);
    g.lineStyle(1, 0x405968).lineBetween(0, 48, 640, 48);
  }

  private drawMaterials() {
    const g = this.materials.clear();
    for (const [paddle, color] of [[this.paddle1, 0x94e9f0], [this.paddle2, 0xefb0d8]] as const) {
      g.fillStyle(0x122333).fillRect(paddle.x - 5, paddle.y - 36, 10, 72);
      g.fillStyle(color).fillRect(paddle.x - 5, paddle.y - 36, 3, 72);
      for (let y = -22; y <= 22; y += 11) g.fillStyle(color, .45).fillRect(paddle.x, paddle.y + y, 4, 2);
      g.fillStyle(0xe7f8ff).fillRect(paddle.x - 5, paddle.y - 36, 10, 3);
    }
    g.fillStyle(0x57abbf).fillCircle(this.ball.x + 2, this.ball.y + 2, 5);
    g.fillStyle(0xf7fcff).fillCircle(this.ball.x - 2, this.ball.y - 2, 3);
  }

  update(_time: number, delta: number) {
    const dtAdjust = delta / 16.666;

    if (InputManager.isP1Down('UP')) this.paddle1.y -= this.playerSpeed * dtAdjust;
    if (InputManager.isP1Down('DOWN')) this.paddle1.y += this.playerSpeed * dtAdjust;

    let p2Active = false;
    if (InputManager.isP2Down('UP')) { this.paddle2.y -= this.playerSpeed * dtAdjust; p2Active = true; }
    if (InputManager.isP2Down('DOWN')) { this.paddle2.y += this.playerSpeed * dtAdjust; p2Active = true; }
    
    if (!p2Active) {
        if (this.ball.y > this.paddle2.y + 10) this.paddle2.y += this.aiSpeed;
        else if (this.ball.y < this.paddle2.y - 10) this.paddle2.y -= this.aiSpeed;
    }

    this.paddle1.y = Phaser.Math.Clamp(this.paddle1.y, 40, 440);
    this.paddle2.y = Phaser.Math.Clamp(this.paddle2.y, 40, 440);

    // CRITICAL: Update static physics bodies after modifying Y position!
    (this.paddle1.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    (this.paddle2.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

    if (this.ball.x < 10) this.resetBall(2);
    if (this.ball.x > 630) this.resetBall(1);
    this.drawMaterials();
  }

  resetBall(winner: number) {
    if (winner === 1) this.score1++;
    else this.score2++;
    
    AudioEngine.playTone(800, 'sawtooth', 0.3);

    this.scoreText.setText(`${this.score1} - ${this.score2}`);
    this.ball.setPosition(320, 240);
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
    ballBody.setVelocity(this.baseSpeed * (winner === 1 ? 1 : -1), this.baseSpeed);
  }
}
