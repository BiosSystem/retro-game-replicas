import Phaser from 'phaser';
import { VFXManager } from '../engine/VFXManager';
import { InputManager } from '../engine/InputManager';
import { AudioEngine } from '../engine/AudioEngine';
import { ProgressionDirector } from '../engine/ProgressionDirector';

export default class InvadersScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private aliens!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private alienBullets!: Phaser.Physics.Arcade.Group;
    private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private progression!: ProgressionDirector;
  private shootDelay = 1000;
  private alienBulletSpeed = 200;
  private alienWobble = 2;
  private shootEvent!: Phaser.Time.TimerEvent;
  private difficulty = 'NORMAL';
  private shieldActive = false;
  private wavePending = false;
  private gameOver = false;

  constructor() {
    super('InvadersScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.shootDelay = 1500; this.alienBulletSpeed = 150; this.alienWobble = 1.5; break;
      case 'NORMAL': this.shootDelay = 1000; this.alienBulletSpeed = 200; this.alienWobble = 2; break;
      case 'HARD': this.shootDelay = 600; this.alienBulletSpeed = 300; this.alienWobble = 3.5; break;
      case 'EXPERT': this.shootDelay = 350; this.alienBulletSpeed = 450; this.alienWobble = 5.5; break;
    }

    this.score = 0;
    this.shieldActive = false;
    this.wavePending = false;
    this.gameOver = false;
    this.progression = new ProgressionDirector();
    this.add.text(320, 20, 'SPACE DEFENDERS - ARROWS TO MOVE - SPACE TO SHOOT - ESC TO LOBBY', { fontSize: '10px', color: '#00ff00' }).setOrigin(0.5);
    this.scoreText = this.add.text(10, 10, 'SCORE: 0', { fontSize: '20px', color: '#ffffff' });
    this.stageText = this.add.text(10, 34, 'STAGE 1  X1', { fontSize: '14px', color: '#00ffcc' });

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 10, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

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

    this.spawnWave();

        this.input.keyboard?.on('keydown-SPACE', () => { this.fireBullet(); });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { scene: this.scene.key });
    });

    this.physics.add.overlap(this.bullets, this.aliens, this.hitAlien as any, undefined, this);
    this.physics.add.overlap(this.player, this.alienBullets, (_player, projectile) => {
        if (this.shieldActive) {
          projectile.destroy();
          this.shieldActive = false;
          this.player.clearTint();
          VFXManager.playExplosion(this, this.player.x, this.player.y, 0xffff00);
          return;
        }
        this.triggerGameOver();
    }, undefined, this);

    this.shootEvent = this.time.addEvent({ delay: this.shootDelay, callback: this.alienShoot, callbackScope: this, loop: true });
  }

  fireBullet() {
    const bullet = this.bullets.create(this.player.x, this.player.y - 10, 'inv_bullet');
    bullet.setVelocityY(-400);
    AudioEngine.playEffect('LASER');
  }

  alienShoot() {
    const alien = this.aliens.getChildren()[Phaser.Math.Between(0, this.aliens.getLength() - 1)] as any;
    if (alien) {
      const behavior = this.progression.chooseBehavior(Phaser.Math.Distance.Between(alien.x, alien.y, this.player.x, this.player.y));
      const angles = behavior === 'BARRAGE' ? [-0.24, 0, 0.24] : [0];
      for (const angleOffset of angles) {
        const bullet = this.alienBullets.create(alien.x, alien.y + 10, 'alien_bullet');
        if (behavior === 'PATROL') bullet.setVelocityY(this.alienBulletSpeed);
        else this.physics.velocityFromRotation(Phaser.Math.Angle.Between(alien.x, alien.y, this.player.x, this.player.y) + angleOffset, this.alienBulletSpeed, bullet.body.velocity);
      }
    }
  }

  hitAlien(bullet: any, alien: any) {
    bullet.destroy();
    alien.destroy();
    const awarded = this.progression.addScore(20, this.time.now);
    this.score = this.progression.snapshot().score;
    this.scoreText.setText('SCORE: ' + this.score);
    this.stageText.setText(`STAGE ${this.progression.snapshot().stage}  X${this.progression.snapshot().multiplier}`);
    VFXManager.floatingText(this, alien.x, alien.y, `+${awarded}`, '#00ffcc');
    AudioEngine.playEffect('COIN');
    if (this.progression.consumePowerUp()) this.grantPowerUp();
    VFXManager.screenShake(this, 0.005, 100);
  }

  update() {
    if (this.gameOver) return;
    if (InputManager.isP1Down('LEFT')) this.player.setVelocityX(-300);
    else if (InputManager.isP1Down('RIGHT')) this.player.setVelocityX(300);
    else this.player.setVelocityX(0);

    this.aliens.getChildren().forEach((a: any) => {
      a.x += Math.sin(this.time.now / 1000) * this.alienWobble;
      // CRITICAL: Update physics body after modifying X directly!
      a.body.updateFromGameObject();
    });

    if (this.aliens.getLength() === 0 && !this.wavePending) {
      this.wavePending = true;
      const stage = this.progression.advanceStage();
      this.alienBulletSpeed = Math.min(650, this.alienBulletSpeed * 1.08);
      this.alienWobble = Math.min(9, this.alienWobble * 1.06);
      this.stageText.setText(`STAGE ${stage}  X${this.progression.snapshot().multiplier}`);
      AudioEngine.playEffect('STAGE_CLEAR');
      this.time.delayedCall(500, () => {
        this.spawnWave();
        this.wavePending = false;
      });
    }
  }

  private spawnWave() {
    const stage = this.progression.snapshot().stage;
    const rows = Math.min(6, 3 + Math.ceil(stage / 2));
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < 10; column++) this.aliens.create(95 + column * 50, 70 + row * 38, 'alien');
    }
  }

  private grantPowerUp() {
    AudioEngine.playEffect('POWER_UP');
    this.player.setTint(0xffff00);
    this.shieldActive = true;
    VFXManager.floatingText(this, this.player.x, this.player.y - 24, 'SHIELD READY', '#ffff00');
  }

  private triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.shootEvent) this.shootEvent.remove();
    VFXManager.playExplosion(this, this.player.x, this.player.y, 0xff2255);
    this.scene.pause();
    this.scene.launch('GameOverScene', {
      scene: this.scene.key,
      title: 'SECTOR OVERRUN',
      score: this.score,
      difficulty: this.difficulty,
      restartData: { difficulty: this.difficulty },
      submitScore: true,
      color: '#ff2255',
    });
  }
}
