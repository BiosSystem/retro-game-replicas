import Phaser from 'phaser';
import { SaveManager } from '../engine/SaveManager';
import { VFXManager } from '../engine/VFXManager';
import { AudioEngine } from '../engine/AudioEngine';
import { SpriteStateMachine } from '../engine/SpriteStateMachine';

export default class RunnerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private animator!: SpriteStateMachine;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private baseSpeed = 300;
  private speedRamp = 0.005;
  private speed = 300;
  private spawnTimer = 0;
  private bg1!: Phaser.GameObjects.TileSprite;
  private bg2!: Phaser.GameObjects.TileSprite;
  private difficulty = 'NORMAL';

  constructor() {
    super('RunnerScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.baseSpeed = 220; this.speedRamp = 0.002; break;
      case 'NORMAL': this.baseSpeed = 300; this.speedRamp = 0.005; break;
      case 'HARD': this.baseSpeed = 420; this.speedRamp = 0.01; break;
      case 'EXPERT': this.baseSpeed = 550; this.speedRamp = 0.02; break;
    }

    this.score = 0;
    this.speed = this.baseSpeed;
    this.spawnTimer = 0;

    // Create textures if missing
    if (!this.textures.exists('bg_city')) {
      const g = this.add.graphics();
      g.fillStyle(0x111122); g.fillRect(0, 0, 64, 64); g.generateTexture('bg_city', 64, 64); g.clear();
      g.fillStyle(0x112222); g.fillRect(0, 0, 64, 64); g.generateTexture('bg_trees', 64, 64); g.destroy();
    }

    // Parallax BG
    this.bg1 = this.add.tileSprite(320, 240, 640, 480, 'bg_city').setTint(0x112233);
    this.bg2 = this.add.tileSprite(320, 240, 640, 480, 'bg_trees').setTint(0x224455);

    // Ground
    const ground = this.add.rectangle(320, 440, 640, 80, 0x336677);
    this.physics.add.existing(ground, true);

    this.createRunnerTextures();
    this.player = this.physics.add.sprite(100, 380, 'runner-idle');
    this.animator = new SpriteStateMachine({
      run: { frames: ['runner-run-1', 'runner-run-2'], frameRate: 10, hitbox: { width: 24, height: 46, offsetX: 4, offsetY: 2 } },
      jump: { frames: ['runner-jump'], frameRate: 1, loop: false, hitbox: { width: 22, height: 40, offsetX: 5, offsetY: 5 }, emitOnEnter: 'jump-dust' },
      duck: { frames: ['runner-duck'], frameRate: 1, loop: false, hitbox: { width: 30, height: 24, offsetX: 1, offsetY: 24 } },
    }, 'run');
    (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(1500);

    this.obstacles = this.physics.add.group();

    // UI
    this.add.text(320, 20, 'PIXEL RUNNER', { fontFamily: 'Courier', fontSize: '24px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', { fontFamily: 'Courier', fontSize: '20px', color: '#ffffff' });
    this.add.text(20, 50, 'UP / SPACE: JUMP | DOWN: DUCK | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '14px', color: '#aaaaaa' });

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 20, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Collisions
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, this.obstacles, () => this.endGame());

    // Input
    this.input.keyboard?.on('keydown-SPACE', () => this.jump());
    this.input.keyboard?.on('keydown-UP', () => this.jump());
    this.input.keyboard?.on('keydown-DOWN', () => this.duck(true));
    this.input.keyboard?.on('keyup-DOWN', () => this.duck(false));
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { scene: this.scene.key });
    });
  }

  jump() {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body.touching.down) {
          body.setVelocityY(-650);
          VFXManager.screenShake(this, 0.001, 100);
          this.animator.setState('jump');
          AudioEngine.playEffect('POWER_UP');
      }
  }

  duck(down: boolean) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (down) {
          this.animator.setState('duck');
          if (!body.touching.down) body.setVelocityY(800); // Fast fall
      } else {
          this.animator.setState(body.touching.down ? 'run' : 'jump');
      }
  }

  update(_time: number, delta: number) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (!body.touching.down) this.animator.setState('jump');
      else if (this.animator.getState() === 'jump') this.animator.setState('run');
      const animation = this.animator.update(delta);
      this.player.setTexture(animation.frame);
      body.setSize(animation.hitbox.width, animation.hitbox.height).setOffset(animation.hitbox.offsetX, animation.hitbox.offsetY);
      if (animation.event) VFXManager.playHit(this, this.player.x - 10, this.player.y + 20, 0x00ffcc);

      // Scroll BG
      this.bg1.tilePositionX += delta * 0.05 * (this.speed / 300);
      this.bg2.tilePositionX += delta * 0.1 * (this.speed / 300);

      this.score += delta * 0.01 * (this.speed / 300);
      this.scoreText.setText('SCORE: ' + Math.floor(this.score));
      this.speed += delta * this.speedRamp; // Speed ramp

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
      this.physics.add.existing(obs, false); // Dynamic body so it can move via velocity!
      const body = obs.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setVelocityX(-this.speed);
      
      this.obstacles.add(obs);
  }

  endGame() {
      this.physics.pause();
      VFXManager.screenShake(this, 0.02, 300);
      AudioEngine.playEffect('EXPLOSION');
      const banner = this.add.rectangle(320, 240, 640, 100, 0x000000, 0.8);
      this.add.text(320, 240, `GAME OVER\nFINAL SCORE: ${Math.floor(this.score)}\nCLICK TO RESTART`, { fontFamily: 'Courier', fontSize: '28px', color: '#ff0055', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
      banner.setInteractive().on('pointerdown', () => { if (SaveManager.isHighScore('RunnerScene', this.difficulty, this.score)) {
      this.scene.pause();
      this.scene.launch('NameEntryScene', { scene: this.scene.key, difficulty: this.difficulty, score: this.score });
    } else {
      SaveManager.submitScore('RunnerScene', this.difficulty, this.score);
      this.scene.restart({ difficulty: this.difficulty });
    } });
  }

  private createRunnerTextures() {
      const frames = [
          { key: 'runner-idle', leg: 0, crouch: false, jump: false },
          { key: 'runner-run-1', leg: -5, crouch: false, jump: false },
          { key: 'runner-run-2', leg: 5, crouch: false, jump: false },
          { key: 'runner-jump', leg: 6, crouch: false, jump: true },
          { key: 'runner-duck', leg: 0, crouch: true, jump: false },
      ];
      for (const frame of frames) {
          if (this.textures.exists(frame.key)) continue;
          const graphics = this.add.graphics();
          graphics.fillStyle(0x00ffcc);
          if (frame.crouch) {
              graphics.fillRect(4, 22, 26, 16);
              graphics.fillRect(22, 14, 10, 10);
              graphics.fillRect(2, 36, 28, 8);
          } else {
              graphics.fillRect(11, 4, 12, 12);
              graphics.fillRect(8, 16, 18, 20);
              graphics.fillRect(5, 19, 5, 18);
              graphics.fillRect(24, 19, 5, 18);
              graphics.fillRect(9 + frame.leg, 35, 6, frame.jump ? 10 : 13);
              graphics.fillRect(19 - frame.leg, 35, 6, frame.jump ? 10 : 13);
          }
          graphics.generateTexture(frame.key, 34, 50);
          graphics.destroy();
      }
  }
}
