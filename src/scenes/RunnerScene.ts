import Phaser from 'phaser';
import { VFXManager } from '../engine/VFXManager';
import { AudioEngine } from '../engine/AudioEngine';
import { SpriteStateMachine } from '../engine/SpriteStateMachine';
import { InputManager } from '../engine/InputManager';
import type { ArcadeMode } from '../multiplayer/CoopSession';
import { ProceduralStageGenerator, type StageDefinition } from '../generators/ProceduralStageGenerator';

export default class RunnerScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private animator!: SpriteStateMachine;
  private player2: Phaser.Physics.Arcade.Sprite | null = null;
  private animator2: SpriteStateMachine | null = null;
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
  private mode: ArcadeMode = 'SOLO';
  private generator = new ProceduralStageGenerator(0x52554e);
  private stageDefinition!: StageDefinition;
  private stage = 1;
  private jumpHeld = { 1: false, 2: false };
  private finished = false;

  constructor() {
    super('RunnerScene');
  }

  create(data: { difficulty?: string; mode?: ArcadeMode }) {
    this.difficulty = data?.difficulty || 'NORMAL';
    this.mode = data?.mode ?? 'SOLO';
    switch (this.difficulty) {
      case 'EASY': this.baseSpeed = 220; this.speedRamp = 0.002; break;
      case 'NORMAL': this.baseSpeed = 300; this.speedRamp = 0.005; break;
      case 'HARD': this.baseSpeed = 420; this.speedRamp = 0.01; break;
      case 'EXPERT': this.baseSpeed = 550; this.speedRamp = 0.02; break;
    }

    this.score = 0;
    this.speed = this.baseSpeed;
    this.spawnTimer = 0;
    this.stage = 1;
    this.stageDefinition = this.generator.generate(1);
    this.finished = false;

    // Create textures if missing
    if (!this.textures.exists('bg_city')) {
      const g = this.add.graphics();
      g.fillStyle(0x11162b).fillRect(0, 0, 128, 128);
      for (let x = 0; x < 128; x += 22) {
        const h = 32 + (x * 7) % 52;
        g.fillStyle(0x172641).fillRect(x, 128 - h, 18, h);
        for (let y = 134 - h; y < 120; y += 15) g.fillStyle(0x6c8294, .3).fillRect(x + 5, y, 4, 3);
      }
      g.generateTexture('bg_city', 128, 128); g.clear();
      for (let x = 0; x < 128; x += 28) {
        g.fillStyle(0x132f37).fillRect(x + 11, 70, 5, 58);
        g.fillStyle(0x1f4a49).fillTriangle(x, 88, x + 14, 36 + x % 19, x + 28, 88);
      }
      g.generateTexture('bg_trees', 128, 128); g.destroy();
    }

    // Parallax BG
    this.bg1 = this.add.tileSprite(320, 240, 640, 480, 'bg_city');
    this.bg2 = this.add.tileSprite(320, 240, 640, 480, 'bg_trees');
    this.bg1.tileScaleY = 4;
    this.bg2.tileScaleY = 4;

    // Ground
    const ground = this.add.rectangle(320, 440, 640, 80, 0x336677);
    this.physics.add.existing(ground, true);
    const runway = this.add.graphics();
    runway.fillStyle(0x101b27).fillRect(0, 401, 640, 79).fillStyle(0x375568).fillRect(0, 401, 640, 7);
    runway.lineStyle(1, 0x678394, .35);
    for (let x = -40; x < 700; x += 64) runway.lineBetween(x, 480, x + 38, 407);
    runway.lineBetween(0, 446, 640, 446);

    this.createRunnerTextures();
    this.createHazardTextures();
    this.player = this.physics.add.sprite(100, 380, 'runner-idle');
    this.animator = this.createAnimator();
    (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(1500);
    if (this.mode !== 'SOLO') {
      this.player2 = this.physics.add.sprite(145, 380, 'runner-idle').setTint(0xffff00);
      this.animator2 = this.createAnimator();
      (this.player2.body as Phaser.Physics.Arcade.Body).setGravityY(1500);
    } else { this.player2 = null; this.animator2 = null; }
    this.applyStageSkin();

    this.obstacles = this.physics.add.group();

    // UI
    this.add.text(320, 18, 'PIXEL RUNNER // NIGHT SECTOR', { fontFamily: 'Courier', fontSize: '18px', color: '#bde4e5', fontStyle: 'bold' }).setOrigin(0.5).setDepth(10);
    this.scoreText = this.add.text(12, 42, 'SCORE 0', { fontFamily: 'Courier', fontSize: '12px', color: '#ffffff' }).setDepth(10);
    this.add.text(20, 60, `${this.mode}  P1 WASD+SPACE  P2 ARROWS+ENTER`, { fontFamily: 'Courier', fontSize: '12px', color: '#8fa7ad' }).setDepth(10);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(628, 12, this.difficulty, {
      fontFamily: 'Courier',
      fontSize: '13px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);

    // Collisions
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, this.obstacles, () => this.endGame(1));
    if (this.player2) {
      this.physics.add.collider(this.player2, ground);
      this.physics.add.collider(this.player2, this.obstacles, () => this.endGame(2));
      this.physics.add.collider(this.player, this.player2);
    }

    // Input
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { scene: this.scene.key });
    });
  }

  jump(player = this.player, animator = this.animator) {
      const body = player.body as Phaser.Physics.Arcade.Body;
      if (body.touching.down) {
          body.setVelocityY(-650);
          VFXManager.screenShake(this, 0.001, 100);
          animator.setState('jump');
          AudioEngine.playEffect('POWER_UP');
      }
  }

  duck(down: boolean, player = this.player, animator = this.animator) {
      const body = player.body as Phaser.Physics.Arcade.Body;
      if (down) {
          animator.setState('duck');
          if (!body.touching.down) body.setVelocityY(800); // Fast fall
      } else {
          animator.setState(body.touching.down ? 'run' : 'jump');
      }
  }

  update(_time: number, delta: number) {
      if (this.finished) return;
      this.updateRunner(this.player, this.animator, 1, delta);
      if (this.player2?.active && this.animator2) this.updateRunner(this.player2, this.animator2, 2, delta);

      // Scroll BG
      this.bg1.tilePositionX += delta * 0.05 * (this.speed / 300);
      this.bg2.tilePositionX += delta * 0.1 * (this.speed / 300);

      this.score += delta * 0.01 * (this.speed / 300);
      const nextStage = Math.floor(this.score / 300) + 1;
      if (nextStage !== this.stage) { this.stage = nextStage; this.stageDefinition = this.generator.generate(this.stage); this.applyStageSkin(); AudioEngine.playEffect('STAGE_CLEAR'); }
      this.scoreText.setText(`SCORE ${Math.floor(this.score)}  STAGE ${this.stage}  ${this.stageDefinition.modifier}`);
      this.speed += delta * this.speedRamp; // Speed ramp

      this.spawnTimer += delta;
      if (this.spawnTimer > this.stageDefinition.spawnIntervalMs) {
          this.spawnTimer = 0;
          this.spawnObstacle();
      }

      // Cleanup passed obstacles
      this.obstacles.getChildren().forEach((obs: any) => {
          if (obs.x < -50) obs.destroy();
      });
  }

  spawnObstacle() {
      const hazard = this.stageDefinition.hazards[Math.floor(this.score) % this.stageDefinition.hazards.length];
      const isHigh = hazard.kind === 'FLYER';
      const y = isHigh ? 330 : 385;
      const h = isHigh ? 20 : 30;
      const width = this.stageDefinition.boss ? 55 : 25;
      const height = this.stageDefinition.boss ? h * 1.6 : h;
      const obs = this.physics.add.image(700, y, isHigh ? 'runner-flyer' : 'runner-barrier').setDisplaySize(width, height);
      const body = obs.body as Phaser.Physics.Arcade.Body;
      body.setSize(width, height);
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setVelocityX(-this.speed * hazard.speed);
      
      this.obstacles.add(obs);
  }

  endGame(loser: 1 | 2 = 1) {
      if (this.finished) return;
      this.finished = true;
      this.physics.pause();
      VFXManager.screenShake(this, 0.02, 300);
      AudioEngine.playEffect('EXPLOSION');
      const result = this.mode === 'VERSUS' ? `PLAYER ${loser === 1 ? 2 : 1} WINS` : 'RUN TERMINATED';
      const scoreKey = `${this.difficulty}-${this.mode}`;
      this.scene.pause();
      this.scene.launch('GameOverScene', { scene: this.scene.key, title: result, score: this.score, difficulty: scoreKey, restartData: { difficulty: this.difficulty, mode: this.mode }, submitScore: true, color: '#ff0055' });
  }

  private updateRunner(player: Phaser.Physics.Arcade.Sprite, animator: SpriteStateMachine, playerId: 1 | 2, delta: number) {
      const body = player.body as Phaser.Physics.Arcade.Body;
      const upRaw = playerId === 1 ? InputManager.isP1Down('UP') || InputManager.isP1Down('FIRE') : InputManager.isP2Down('UP') || InputManager.isP2Down('FIRE');
      const downRaw = playerId === 1 ? InputManager.isP1Down('DOWN') : InputManager.isP2Down('DOWN');
      const inverted = this.stageDefinition.modifier === 'INVERTED_CONTROLS';
      const jump = inverted ? downRaw : upRaw;
      const duck = inverted ? upRaw : downRaw;
      if (jump && !this.jumpHeld[playerId]) this.jump(player, animator);
      this.jumpHeld[playerId] = jump;
      if (duck) this.duck(true, player, animator); else if (animator.getState() === 'duck') this.duck(false, player, animator);
      body.setGravityY(this.stageDefinition.modifier === 'LOW_GRAVITY' ? 850 : 1500);
      if (!body.touching.down) animator.setState('jump'); else if (animator.getState() === 'jump') animator.setState('run');
      const animation = animator.update(delta);
      player.setTexture(animation.frame);
      body.setSize(animation.hitbox.width, animation.hitbox.height).setOffset(animation.hitbox.offsetX, animation.hitbox.offsetY);
      if (animation.event) VFXManager.playHit(this, player.x - 10, player.y + 20, playerId === 1 ? 0x00ffcc : 0xffff00);
  }

  private createAnimator() {
      return new SpriteStateMachine({
        run: { frames: ['runner-run-1', 'runner-run-2'], frameRate: 10, hitbox: { width: 24, height: 46, offsetX: 4, offsetY: 2 } },
        jump: { frames: ['runner-jump'], frameRate: 1, loop: false, hitbox: { width: 22, height: 40, offsetX: 5, offsetY: 5 }, emitOnEnter: 'jump-dust' },
        duck: { frames: ['runner-duck'], frameRate: 1, loop: false, hitbox: { width: 30, height: 24, offsetX: 1, offsetY: 24 } },
      }, 'run');
  }

  private applyStageSkin() {
      if (!this.stageDefinition.skin) return;
      this.player.setTint(parseInt(this.stageDefinition.skin.primary.slice(1), 16));
      this.player2?.setTint(parseInt(this.stageDefinition.skin.secondary.slice(1), 16));
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
          graphics.fillStyle(0x94c5c0);
          if (frame.crouch) {
              graphics.fillRect(4, 22, 26, 16);
              graphics.fillRect(22, 14, 10, 10);
              graphics.fillRect(2, 36, 28, 8);
              graphics.fillStyle(0xe0f1e9).fillRect(9, 24, 17, 8).fillRect(24, 16, 6, 4);
          } else {
              graphics.fillRect(11, 4, 12, 12);
              graphics.fillRect(8, 16, 18, 20);
              graphics.fillRect(5, 19, 5, 18);
              graphics.fillRect(24, 19, 5, 18);
              graphics.fillRect(9 + frame.leg, 35, 6, frame.jump ? 10 : 13);
              graphics.fillRect(19 - frame.leg, 35, 6, frame.jump ? 10 : 13);
              graphics.fillStyle(0x172733).fillRect(13, 7, 8, 4);
              graphics.fillStyle(0xe0f1e9).fillTriangle(9, 18, 25, 18, 17, 32);
              graphics.fillStyle(0x4c8190).fillRect(7, 34, 7, 5).fillRect(21, 34, 7, 5);
          }
          graphics.generateTexture(frame.key, 34, 50);
          graphics.destroy();
      }
  }

  private createHazardTextures() {
      if (!this.textures.exists('runner-barrier')) {
          const g = this.add.graphics();
          g.fillStyle(0x17212d).fillRoundedRect(2, 5, 36, 33, 4);
          g.fillStyle(0xe38a3d).fillRect(5, 9, 30, 7).fillRect(5, 25, 30, 7);
          for (let x = 6; x < 34; x += 10) g.fillStyle(0xffd171).fillTriangle(x, 16, x + 7, 16, x + 2, 25);
          g.lineStyle(1, 0xf2b35d).strokeRoundedRect(2, 5, 36, 33, 4);
          g.generateTexture('runner-barrier', 40, 40); g.destroy();
      }
      if (!this.textures.exists('runner-flyer')) {
          const g = this.add.graphics();
          g.fillStyle(0x151e31).fillEllipse(20, 15, 30, 14).fillTriangle(7, 14, 0, 4, 15, 10).fillTriangle(33, 14, 40, 4, 25, 10);
          g.fillStyle(0xe56a8f).fillEllipse(20, 13, 14, 7);
          g.fillStyle(0xffd5df).fillRect(15, 11, 10, 2);
          g.lineStyle(1, 0xef8da7).strokeEllipse(20, 15, 30, 14);
          g.generateTexture('runner-flyer', 40, 28); g.destroy();
      }
  }
}
