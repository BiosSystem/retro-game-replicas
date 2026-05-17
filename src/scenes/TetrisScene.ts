import Phaser from 'phaser';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

export default class TetrisScene extends Phaser.Scene {
  private grid: number[][] = [];
  private activePiece: any = null;
  private timer = 0;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private baseInterval = 800;
  private dropInterval = 800;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private graphics!: Phaser.GameObjects.Graphics;
  private difficulty = 'NORMAL';

  constructor() {
    super('TetrisScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.baseInterval = 1000; break;
      case 'NORMAL': this.baseInterval = 800; break;
      case 'HARD': this.baseInterval = 450; break;
      case 'EXPERT': this.baseInterval = 220; break;
    }
    this.dropInterval = this.baseInterval;

    // UI
    this.add.text(320, 20, 'TETRIS: PULSE', { fontFamily: 'Courier', fontSize: '24px', color: '#00ffff' }).setOrigin(0.5);
    this.scoreText = this.add.text(450, 100, 'SCORE: 0', { fontFamily: 'Courier', fontSize: '20px', color: '#ffffff' });
    this.add.text(450, 140, 'ARROWS: MOVE\nUP: ROTATE\nSPACE: DROP\nESC: LOBBY', { fontFamily: 'Courier', fontSize: '14px', color: '#aaaaaa' });

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 20, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.graphics = this.add.graphics();

    // Grid Init
    for (let r = 0; r < ROWS; r++) {
      this.grid[r] = new Array(COLS).fill(0);
    }

    // Particles for effects
    const tempG = this.add.graphics();
    tempG.fillStyle(0xffffff);
    tempG.fillRect(0, 0, 4, 4);
    tempG.generateTexture('spark', 4, 4);
    tempG.destroy();

    this.particles = this.add.particles(0, 0, 'spark', {
        speed: { min: 50, max: 150 },
        scale: { start: 1, end: 0 },
        lifespan: 600,
        gravityY: 100,
        emitting: false
    });

    this.spawnPiece();

    // Input
    this.input.keyboard?.on('keydown-LEFT', () => this.movePiece(-1, 0));
    this.input.keyboard?.on('keydown-RIGHT', () => this.movePiece(1, 0));
    this.input.keyboard?.on('keydown-DOWN', () => this.movePiece(0, 1));
    this.input.keyboard?.on('keydown-UP', () => this.rotatePiece());
    this.input.keyboard?.on('keydown-SPACE', () => this.hardDrop());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene'));
  }

  spawnPiece() {
    const shapes = [
      { s: [[1, 1, 1, 1]], c: 0x00ffff }, // I
      { s: [[1, 1], [1, 1]], c: 0xffff00 }, // O
      { s: [[0, 1, 0], [1, 1, 1]], c: 0xaa00ff }, // T
      { s: [[1, 1, 0], [0, 1, 1]], c: 0x00ff00 }, // S
      { s: [[0, 1, 1], [1, 1, 0]], c: 0xff0000 }, // Z
      { s: [[1, 0, 0], [1, 1, 1]], c: 0x0000ff }, // J
      { s: [[0, 0, 1], [1, 1, 1]], c: 0xffaa00 }  // L
    ];
    const pick = shapes[Phaser.Math.Between(0, shapes.length - 1)];
    this.activePiece = {
      x: 3, y: 0,
      shape: pick.s,
      color: pick.c
    };
    if (this.checkCollision(0, 0)) {
        this.cameras.main.shake(500, 0.02);
        this.time.delayedCall(500, () => this.scene.restart({ difficulty: this.difficulty }));
    }
  }

  movePiece(dx: number, dy: number) {
    if (!this.checkCollision(dx, dy)) {
      this.activePiece.x += dx;
      this.activePiece.y += dy;
      return true;
    }
    if (dy > 0) this.lockPiece();
    return false;
  }

  hardDrop() {
    while (!this.checkCollision(0, 1)) {
        this.activePiece.y++;
    }
    this.lockPiece();
  }

  rotatePiece() {
    const newShape = this.activePiece.shape[0].map((_: any, index: number) =>
      this.activePiece.shape.map((row: any) => row[index]).reverse()
    );
    const oldShape = this.activePiece.shape;
    this.activePiece.shape = newShape;
    if (this.checkCollision(0, 0)) this.activePiece.shape = oldShape;
  }

  checkCollision(dx: number, dy: number, customShape?: number[][]) {
    const shape = customShape || this.activePiece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        let nx = this.activePiece.x + c + dx;
        let ny = this.activePiece.y + r + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && this.grid[ny][nx])) return true;
      }
    }
    return false;
  }

  lockPiece() {
    for (let r = 0; r < this.activePiece.shape.length; r++) {
      for (let c = 0; c < this.activePiece.shape[r].length; c++) {
        if (this.activePiece.shape[r][c]) {
          this.grid[this.activePiece.y + r][this.activePiece.x + c] = this.activePiece.color;
        }
      }
    }
    this.clearLines();
    this.spawnPiece();
    this.cameras.main.shake(100, 0.002);
  }

  clearLines() {
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every(v => v !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(new Array(COLS).fill(0));
        linesCleared++;
        
        // Particle Burst on line
        const offsetX = 220;
        const offsetY = 50;
        this.particles.emitParticleAt(offsetX + (COLS * BLOCK_SIZE / 2), offsetY + r * BLOCK_SIZE, 20);
        
        r++;
      }
    }
    if (linesCleared > 0) {
        this.score += [0, 100, 300, 500, 800][linesCleared];
        this.scoreText.setText('SCORE: ' + this.score);
        this.dropInterval = Math.max(100, this.baseInterval - (this.score / 10));
        this.cameras.main.flash(200, 255, 255, 255, false);
    }
  }

  update(_time: number, delta: number) {
    this.timer += delta;
    if (this.timer > this.dropInterval) {
      this.timer = 0;
      this.movePiece(0, 1);
    }
    this.draw();
  }

  getGhostY() {
      let gy = this.activePiece.y;
      while (true) {
          let collision = false;
          for (let r = 0; r < this.activePiece.shape.length; r++) {
              for (let c = 0; c < this.activePiece.shape[r].length; c++) {
                  if (!this.activePiece.shape[r][c]) continue;
                  let nx = this.activePiece.x + c;
                  let ny = gy + r + 1;
                  if (ny >= ROWS || (ny >= 0 && this.grid[ny][nx])) {
                      collision = true;
                      break;
                  }
              }
              if (collision) break;
          }
          if (collision) break;
          gy++;
      }
      return gy;
  }

  draw() {
    const g = this.graphics;
    g.clear();
    const offsetX = 220;
    const offsetY = 50;

    // Draw Background
    g.fillStyle(0x000000, 0.5);
    g.fillRect(offsetX, offsetY, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    
    // Draw Grid Lines
    g.lineStyle(1, 0x222222);
    for (let r = 0; r <= ROWS; r++) g.lineBetween(offsetX, offsetY + r * BLOCK_SIZE, offsetX + COLS * BLOCK_SIZE, offsetY + r * BLOCK_SIZE);
    for (let c = 0; c <= COLS; c++) g.lineBetween(offsetX + c * BLOCK_SIZE, offsetY, offsetX + c * BLOCK_SIZE, offsetY + ROWS * BLOCK_SIZE);

    // Draw settled blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c]) {
            g.fillStyle(this.grid[r][c], 1);
            g.fillRect(offsetX + c * BLOCK_SIZE + 1, offsetY + r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            // Subtle shine
            g.fillStyle(0xffffff, 0.2);
            g.fillRect(offsetX + c * BLOCK_SIZE + 1, offsetY + r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 4);
        }
      }
    }

    // Draw Ghost
    const gy = this.getGhostY();
    g.lineStyle(1, this.activePiece.color, 0.3);
    for (let r = 0; r < this.activePiece.shape.length; r++) {
      for (let c = 0; c < this.activePiece.shape[r].length; c++) {
        if (this.activePiece.shape[r][c]) {
          g.strokeRect(offsetX + (this.activePiece.x + c) * BLOCK_SIZE + 2, offsetY + (gy + r) * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
        }
      }
    }

    // Draw active piece
    g.fillStyle(this.activePiece.color, 1);
    for (let r = 0; r < this.activePiece.shape.length; r++) {
      for (let c = 0; c < this.activePiece.shape[r].length; c++) {
        if (this.activePiece.shape[r][c]) {
          g.fillRect(offsetX + (this.activePiece.x + c) * BLOCK_SIZE + 1, offsetY + (this.activePiece.y + r) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          // Highlighting active piece
          g.fillStyle(0xffffff, 0.3);
          g.fillRect(offsetX + (this.activePiece.x + c) * BLOCK_SIZE + 1, offsetY + (this.activePiece.y + r) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 4);
          g.fillStyle(this.activePiece.color, 1);
        }
      }
    }
  }
}
