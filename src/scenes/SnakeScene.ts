import Phaser from 'phaser';

const TILE_SIZE = 16;
const COLS = 40; // 640 / 16
const ROWS = 30; // 480 / 16

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default class SnakeScene extends Phaser.Scene {
  private snake!: Phaser.Math.Vector2[];
  private direction!: Direction;
  private nextDirection!: Direction;
  private food!: Phaser.Math.Vector2;
  private score!: number;
  private scoreText!: Phaser.GameObjects.Text;
  private moveTimer!: number;
  private gameOver!: boolean;
  private graphics!: Phaser.GameObjects.Graphics;
  private gameOverText!: Phaser.GameObjects.Text;
  private moveInterval = 100;
  private difficulty = 'NORMAL';

  constructor() {
    super('SnakeScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.moveInterval = 150; break;
      case 'NORMAL': this.moveInterval = 100; break;
      case 'HARD': this.moveInterval = 65; break;
      case 'EXPERT': this.moveInterval = 40; break;
    }

    this.snake = [new Phaser.Math.Vector2(10, 10), new Phaser.Math.Vector2(9, 10)];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.score = 0;
    this.moveTimer = 0;
    this.gameOver = false;

    this.graphics = this.add.graphics();

    this.placeFood();

    this.scoreText = this.add.text(10, 10, 'SCORE: 0', {
      fontFamily: 'Courier',
      fontSize: '24px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setDepth(10);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(630, 10, `DIFF: ${this.difficulty}`, {
      fontFamily: 'Courier',
      fontSize: '20px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);

    this.gameOverText = this.add.text(320, 240, 'GAME OVER\nPRESS SPACE TO RESTART', {
      fontFamily: 'Courier',
      fontSize: '32px',
      color: '#ff0000',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10).setVisible(false);

    // Input
    this.input.keyboard?.on('keydown-ESC', () => { this.scene.start('LobbyScene'); });
    this.input.keyboard?.on('keydown-UP', () => { if (this.direction !== 'DOWN') this.nextDirection = 'UP'; });
    this.input.keyboard?.on('keydown-DOWN', () => { if (this.direction !== 'UP') this.nextDirection = 'DOWN'; });
    this.input.keyboard?.on('keydown-LEFT', () => { if (this.direction !== 'RIGHT') this.nextDirection = 'LEFT'; });
    this.input.keyboard?.on('keydown-RIGHT', () => { if (this.direction !== 'LEFT') this.nextDirection = 'RIGHT'; });
  }

  placeFood() {
    let valid = false;
    let x = 0, y = 0;
    while (!valid) {
      x = Phaser.Math.Between(0, COLS - 1);
      y = Phaser.Math.Between(0, ROWS - 1);
      valid = !this.snake.some(segment => segment.x === x && segment.y === y);
    }
    this.food = new Phaser.Math.Vector2(x, y);
  }

  update(_time: number, delta: number) {
    if (this.gameOver) {
      if (this.input.keyboard?.checkDown(this.input.keyboard.addKey('SPACE'), 250)) {
        this.scene.restart({ difficulty: this.difficulty });
      }
      return;
    }

    this.moveTimer += delta;
    if (this.moveTimer > this.moveInterval) {
      this.moveTimer = 0;
      this.moveSnake();
      this.draw();
    }
  }

  moveSnake() {
    this.direction = this.nextDirection;
    const head = this.snake[0].clone();

    switch (this.direction) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      this.triggerGameOver();
      return;
    }

    // Self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.triggerGameOver();
      return;
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.scoreText.setText(`SCORE: ${this.score}`);
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }

  triggerGameOver() {
    this.gameOver = true;
    this.gameOverText.setVisible(true);
  }

  draw() {
    this.graphics.clear();

    // Draw snake
    this.snake.forEach((segment, index) => {
      if (index === 0) this.graphics.fillStyle(0x00cc00, 1);
      else this.graphics.fillStyle(0x00ff00, 1);
      this.graphics.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
    });

    // Draw food
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillRect(this.food.x * TILE_SIZE, this.food.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
  }
}
