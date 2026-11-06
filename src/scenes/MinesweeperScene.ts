import Phaser from 'phaser';
import { VFXManager } from '../engine/VFXManager';

const TILE_SIZE = 32;
const COLS = 12;
const ROWS = 10;

export default class MinesweeperScene extends Phaser.Scene {
  private grid: any[][] = [];
  private gameOver = false;
  private firstClick = true;
  private flagsCount = 15;
  private totalMines = 15;
  private timerText!: Phaser.GameObjects.Text;
  private flagsText!: Phaser.GameObjects.Text;
  private timeElapsed = 0;
  private clockEvent!: Phaser.Time.TimerEvent;
  private difficulty = 'NORMAL';

  constructor() {
    super('MinesweeperScene');
  }

  create(data: any) {
    this.difficulty = data?.difficulty || 'NORMAL';
    switch (this.difficulty) {
      case 'EASY': this.totalMines = 8; break;
      case 'NORMAL': this.totalMines = 15; break;
      case 'HARD': this.totalMines = 25; break;
      case 'EXPERT': this.totalMines = 35; break;
    }

    this.gameOver = false;
    this.firstClick = true;
    this.flagsCount = this.totalMines;
    this.timeElapsed = 0;
    const panel = this.add.graphics().setDepth(-2);
    panel.fillGradientStyle(0x101b27, 0x101b27, 0x070b12, 0x070b12).fillRect(0, 0, 640, 480);
    panel.fillStyle(0x192a38).fillRoundedRect(112, 82, 416, 348, 12);
    panel.lineStyle(2, 0x496d7b, .75).strokeRoundedRect(112, 82, 416, 348, 12);
    for (const x of [92, 538]) {
      panel.fillStyle(0x203644).fillRect(x, 100, 8, 310);
      for (let y = 108; y < 400; y += 28) panel.fillStyle(0x72a6a4, .35).fillRect(x + 2, y, 4, 10);
    }

    // UI
    this.add.text(320, 18, 'MINEFIELD // SIGNAL SWEEP', { fontFamily: 'Courier', fontSize: '18px', color: '#bde4e1', fontStyle: 'bold' }).setOrigin(0.5);
    this.flagsText = this.add.text(128, 58, `FLAGS ${this.flagsCount}`, { fontFamily: 'Courier', fontSize: '14px', color: '#e78396' });
    this.timerText = this.add.text(442, 58, 'TIME 0s', { fontFamily: 'Courier', fontSize: '14px', color: '#85c9c7' });
    this.add.text(320, 440, 'LEFT CLICK: REVEAL | RIGHT CLICK / SHIFT+CLICK: FLAG | ESC: LOBBY', { fontFamily: 'Courier', fontSize: '12px', color: '#aaaaaa' }).setOrigin(0.5);

    const diffColors: any = { EASY: '#00ffcc', NORMAL: '#00ff00', HARD: '#ffff00', EXPERT: '#ff0055' };
    this.add.text(628, 14, this.difficulty, {
      fontFamily: 'Courier',
      fontSize: '13px',
      color: diffColors[this.difficulty] || '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.clockEvent = this.time.addEvent({
        delay: 1000,
        callback: () => { if (!this.gameOver && !this.firstClick) { this.timeElapsed++; this.timerText.setText(`TIME: ${this.timeElapsed}s`); } },
        loop: true
    });

    this.initGrid();

    // Disable context menu for right click
    this.input.mouse?.disableContextMenu();

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { scene: this.scene.key });
    });
  }

  initGrid() {
    const offsetX = (640 - (COLS * TILE_SIZE)) / 2;
    const offsetY = 100;

    for (let r = 0; r < ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        const x = offsetX + c * TILE_SIZE;
        const y = offsetY + r * TILE_SIZE;

        const bg = this.add.rectangle(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE - 3, TILE_SIZE - 3, 0x213746).setInteractive();
        bg.setStrokeStyle(1, 0x70909a, 0.55);

        const text = this.add.text(x + TILE_SIZE/2, y + TILE_SIZE/2, '', { fontFamily: 'Courier', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);

        const tile = { r, c, mine: false, revealed: false, flagged: false, count: 0, bg, text };

        bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.gameOver) return;
            if (pointer.rightButtonDown() || pointer.event.shiftKey) {
                this.toggleFlag(tile);
            } else {
                if (this.firstClick) {
                    this.firstClick = false;
                    this.placeMines(r, c);
                }
                this.reveal(tile);
            }
        });

        this.grid[r][c] = tile;
      }
    }
  }

  placeMines(skipR: number, skipC: number) {
      let placed = 0;
      while (placed < this.totalMines) {
          const r = Phaser.Math.Between(0, ROWS - 1);
          const c = Phaser.Math.Between(0, COLS - 1);
          if ((r === skipR && c === skipC) || this.grid[r][c].mine) continue;
          this.grid[r][c].mine = true;
          placed++;
      }

      // Calculate counts
      for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
              if (this.grid[r][c].mine) continue;
              let count = 0;
              for (let dr = -1; dr <= 1; dr++) {
                  for (let dc = -1; dc <= 1; dc++) {
                      const nr = r + dr;
                      const nc = c + dc;
                      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.grid[nr][nc].mine) {
                          count++;
                      }
                  }
              }
              this.grid[r][c].count = count;
          }
      }
  }

  toggleFlag(tile: any) {
      if (tile.revealed) return;
      tile.flagged = !tile.flagged;
      tile.text.setText(tile.flagged ? '▲' : '');
      tile.text.setColor(tile.flagged ? '#ff0055' : '#ffffff');
      this.flagsCount += tile.flagged ? -1 : 1;
      this.flagsText.setText(`FLAGS: ${this.flagsCount}`);
  }

  reveal(tile: any) {
      if (tile.revealed || tile.flagged) return;
      tile.revealed = true;
      tile.bg.setFillStyle(0x0b1822);
      tile.bg.setStrokeStyle(1, 0x294c5d);

      if (tile.mine) {
          tile.text.setText('✦');
          this.endGame(false);
          return;
      }

      if (tile.count > 0) {
          const colors = ['#00ffcc', '#00ff66', '#ffff00', '#ff6600', '#ff0000', '#ff00ff', '#ffffff', '#888888'];
          tile.text.setText(tile.count.toString());
          tile.text.setColor(colors[tile.count - 1]);
      } else {
          // Flood fill
          for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                  const nr = tile.r + dr;
                  const nc = tile.c + dc;
                  if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                      this.reveal(this.grid[nr][nc]);
                  }
              }
          }
      }

      this.checkWin();
  }

  checkWin() {
      let win = true;
      for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
              if (!this.grid[r][c].mine && !this.grid[r][c].revealed) win = false;
          }
      }
      if (win) this.endGame(true);
  }

  endGame(win: boolean) {
      this.gameOver = true;
      this.clockEvent.remove();

      // Reveal all mines
      for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
              const t = this.grid[r][c];
              if (t.mine) {
                  t.bg.setFillStyle(win ? 0x005522 : 0x551111);
                  t.text.setText(win ? '◆' : '✦');
              }
          }
      }

      const msg = win ? 'SYSTEM SECURED' : 'BREACH DETECTED';
      const color = win ? '#00ffcc' : '#ff0055';
      this.scene.pause();
      this.scene.launch('GameOverScene', { scene: this.scene.key, title: msg, difficulty: this.difficulty, color });
      if (!win) VFXManager.screenShake(this, 0.03, 500);
  }
}
