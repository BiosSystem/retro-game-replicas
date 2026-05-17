import Phaser from 'phaser';

const TILE = 24;

export default class CyberScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private dots!: Phaser.GameObjects.Group;
  private powerUps!: Phaser.GameObjects.Group;
  private ghosts!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isOverclocked = false;
  private overclockTimer = 0;
  private playerSpeed = 180;
  private ghostSpeed = 120;
  private difficulty = 'NORMAL';
  private map: number[][] = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,0,0,0,0,0,1,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  constructor() {
    super('CyberScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.playerSpeed = 200; this.ghostSpeed = 80; break;
      case 'NORMAL': this.playerSpeed = 180; this.ghostSpeed = 120; break;
      case 'HARD': this.playerSpeed = 180; this.ghostSpeed = 160; break;
      case 'EXPERT': this.playerSpeed = 200; this.ghostSpeed = 210; break;
    }

    this.score = 0;
    this.isOverclocked = false;
    
    // UI
    this.add.text(320, 20, 'CYBER CHASM: DATA RUNNER', { fontFamily: 'Courier', fontSize: '22px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(0.5);
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', { fontFamily: 'Courier', fontSize: '18px', color: '#ffffff' });
    this.add.text(320, 465, 'ARROWS: NAVIGATE | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '12px', color: '#aaaaaa' }).setOrigin(0.5);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 20, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.dots = this.add.group();
    this.powerUps = this.add.group();
    this.ghosts = this.physics.add.group();

    const offsetX = (640 - (this.map[0].length * TILE)) / 2;
    const offsetY = 50;

    // Build Labyrinth
    const walls = this.physics.add.staticGroup();
    for (let r = 0; r < this.map.length; r++) {
      for (let c = 0; c < this.map[r].length; c++) {
        const x = offsetX + c * TILE + TILE/2;
        const y = offsetY + r * TILE + TILE/2;
        
        if (this.map[r][c] === 1) {
            const wall = this.add.rectangle(x, y, TILE - 2, TILE - 2, 0x112233);
            wall.setStrokeStyle(1, 0x005577);
            walls.add(wall);
        } else {
            if (Math.random() < 0.05) {
                const pu = this.add.circle(x, y, 6, 0xff00ff);
                this.physics.add.existing(pu, true); // CRITICAL: Static body!
                this.powerUps.add(pu);
            } else {
                const dot = this.add.circle(x, y, 3, 0x00ffcc, 0.6);
                this.physics.add.existing(dot, true); // CRITICAL: Static body!
                this.dots.add(dot);
            }
        }
      }
    }

    // Player
    this.player = this.add.rectangle(offsetX + TILE * 11 + TILE/2, offsetY + TILE * 15 + TILE/2, 18, 18, 0xffff00);
    this.physics.add.existing(this.player);

    // Ghosts
    this.spawnGhost(offsetX + TILE * 11, offsetY + TILE * 10, 0xff0000);
    this.spawnGhost(offsetX + TILE * 10, offsetY + TILE * 10, 0x00ffff);
    this.spawnGhost(offsetX + TILE * 12, offsetY + TILE * 10, 0xff88ff);

    // Collisions
    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.ghosts, walls);
    
    this.physics.add.overlap(this.player, this.dots, (_p, d: any) => { d.destroy(); this.score += 10; this.scoreText.setText('SCORE: ' + this.score); });
    this.physics.add.overlap(this.player, this.powerUps, (_p, pu: any) => { pu.destroy(); this.activateOverclock(); });
    this.physics.add.overlap(this.player, this.ghosts, (_p, g: any) => this.handleGhostCollision(g));

    // Input
    this.input.keyboard?.on('keydown-UP', () => this.setVel(0, -this.playerSpeed));
    this.input.keyboard?.on('keydown-DOWN', () => this.setVel(0, this.playerSpeed));
    this.input.keyboard?.on('keydown-LEFT', () => this.setVel(-this.playerSpeed, 0));
    this.input.keyboard?.on('keydown-RIGHT', () => this.setVel(this.playerSpeed, 0));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene'));
  }

  spawnGhost(x: number, y: number, color: number) {
      const g = this.add.rectangle(x + TILE/2, y + TILE/2, 20, 20, color);
      this.physics.add.existing(g);
      const body = g.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      body.setBounce(1);
      body.setVelocity(Phaser.Math.Between(0, 1) ? this.ghostSpeed : -this.ghostSpeed, 0);
      this.ghosts.add(g);
  }

  setVel(vx: number, vy: number) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(vx, vy);
  }

  activateOverclock() {
      this.isOverclocked = true;
      this.overclockTimer = 8000;
      this.player.setFillStyle(0xff00ff);
      this.cameras.main.flash(200, 255, 0, 255);
      
      this.ghosts.getChildren().forEach((g: any) => {
          g.setAlpha(0.5);
          g.setFillStyle(0x3333ff);
      });
  }

  handleGhostCollision(g: any) {
      if (this.isOverclocked) {
          g.destroy();
          this.score += 500;
          this.scoreText.setText('SCORE: ' + this.score);
      } else {
          this.endGame();
      }
  }

  update(_time: number, delta: number) {
      if (this.isOverclocked) {
          this.overclockTimer -= delta;
          if (this.overclockTimer <= 0) {
              this.isOverclocked = false;
              this.player.setFillStyle(0xffff00);
              this.ghosts.getChildren().forEach((g: any) => {
                  g.setAlpha(1);
                  g.setFillStyle(0xff0000); 
              });
          }
      }

      // Simple AI for ghosts: turn at junctions
      this.ghosts.getChildren().forEach((g: any) => {
          const body = g.body as Phaser.Physics.Arcade.Body;
          if (body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down) {
              const dirs = [{x: this.ghostSpeed, y:0}, {x: -this.ghostSpeed, y:0}, {x: 0, y:this.ghostSpeed}, {x: 0, y:-this.ghostSpeed}];
              const d = dirs[Phaser.Math.Between(0, 3)];
              body.setVelocity(d.x, d.y);
          }
      });
  }

  endGame() {
      this.physics.pause();
      this.cameras.main.shake(500, 0.03);
      const banner = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.85).setInteractive();
      this.add.text(320, 240, `SYSTEM OVERLOAD\nFINAL SCORE: ${this.score}\nCLICK TO RESTART`, { fontFamily: 'Courier', fontSize: '28px', color: '#ff0055', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
      banner.on('pointerdown', () => this.scene.restart({ difficulty: this.difficulty }));
  }
}
