import Phaser from 'phaser';

type MenuMode = 'GAME_SELECT' | 'DIFFICULTY_SELECT';

export default class LobbyScene extends Phaser.Scene {
  private games = [
    { name: 'SNAKE EVOLUTION', scene: 'SnakeScene' },
    { name: 'NEON PONG', scene: 'PongScene' },
    { name: 'ASTRO DRIFT', scene: 'AsteroidsScene' },
    { name: 'BRICK BREAKER', scene: 'BreakoutScene' },
    { name: 'FROGGIE CROSSER', scene: 'FroggerScene' },
    { name: 'SPACE DEFENDERS', scene: 'InvadersScene' },
    { name: 'TETRIS PULSE', scene: 'TetrisScene' },
    { name: 'MINESWEEPER', scene: 'MinesweeperScene' },
    { name: 'PIXEL RUNNER', scene: 'RunnerScene' },
    { name: 'BRAVE BIRD', scene: 'BirdScene' },
    { name: 'CYBER CHASM', scene: 'CyberScene' }
  ];

  private difficulties = [
    { name: 'EASY (CASUAL)', id: 'EASY', color: '#00ffcc', desc: 'Relaxed pace, lower speeds, forgiving AI.' },
    { name: 'NORMAL (ARCADE)', id: 'NORMAL', color: '#00ff00', desc: 'Standard arcade experience. Balanced challenge.' },
    { name: 'HARD (VETERAN)', id: 'HARD', color: '#ffff00', desc: 'High speeds, aggressive AI, faster spawns.' },
    { name: 'EXPERT (OVERCLOCK)', id: 'EXPERT', color: '#ff0055', desc: 'Maximum velocity. Extreme 2027 tactical challenge.' }
  ];

  private selectedGameIndex = 0;
  private selectedDiffIndex = 1; // Default to NORMAL
  private gameItems: Phaser.GameObjects.Text[] = [];
  private diffItems: Phaser.GameObjects.Text[] = [];
  private mode: MenuMode = 'GAME_SELECT';
  private diffContainer!: Phaser.GameObjects.Container;
  private diffDescText!: Phaser.GameObjects.Text;

  constructor() {
    super('LobbyScene');
  }

  create() {
    // CRITICAL FIX: Reset arrays and keyboard listeners on scene restart!
    this.gameItems = [];
    this.diffItems = [];
    this.mode = 'GAME_SELECT';
    this.input.keyboard?.removeAllListeners();

    this.add.text(320, 50, 'UNIVERSAL RETRO ARCADE', {
      fontFamily: 'Courier',
      fontSize: '38px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(320, 90, 'SELECT YOUR GAME', {
      fontFamily: 'Courier',
      fontSize: '18px',
      color: '#00cc00'
    }).setOrigin(0.5);

    // Render Game List
    this.games.forEach((game, index) => {
      const item = this.add.text(320, 140 + (index * 26), game.name, {
        fontFamily: 'Courier',
        fontSize: '22px',
        color: index === this.selectedGameIndex ? '#ffffff' : '#00aa00'
      }).setOrigin(0.5);
      
      if (index === this.selectedGameIndex) {
        item.setScale(1.1);
      }
      this.gameItems.push(item);
    });

    this.add.text(320, 455, 'ARROWS: NAVIGATE | SPACE: SELECT | ESC: BACK', {
      fontFamily: 'Courier',
      fontSize: '14px',
      color: '#00aa00'
    }).setOrigin(0.5);

    // Build Difficulty Selection Container (Hidden initially)
    this.diffContainer = this.add.container(0, 0);
    const diffBg = this.add.rectangle(320, 280, 500, 320, 0x050510, 0.95);
    diffBg.setStrokeStyle(2, 0x00ffcc, 0.8);
    this.diffContainer.add(diffBg);

    const diffTitle = this.add.text(320, 160, 'SELECT DIFFICULTY', {
      fontFamily: 'Courier',
      fontSize: '28px',
      color: '#00ffcc',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.diffContainer.add(diffTitle);

    this.difficulties.forEach((diff, index) => {
      const item = this.add.text(320, 230 + (index * 40), diff.name, {
        fontFamily: 'Courier',
        fontSize: '24px',
        color: index === this.selectedDiffIndex ? '#ffffff' : diff.color
      }).setOrigin(0.5);

      if (index === this.selectedDiffIndex) item.setScale(1.1);
      this.diffItems.push(item);
      this.diffContainer.add(item);
    });

    this.diffDescText = this.add.text(320, 400, this.difficulties[this.selectedDiffIndex].desc, {
      fontFamily: 'Courier',
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 440 }
    }).setOrigin(0.5);
    this.diffContainer.add(this.diffDescText);

    this.diffContainer.setVisible(false);

    // Keyboard Handling
    this.input.keyboard?.on('keydown-UP', () => this.handleUp());
    this.input.keyboard?.on('keydown-DOWN', () => this.handleDown());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleSpace());
    this.input.keyboard?.on('keydown-ESC', () => this.handleEsc());

    let secretBuffer = '';
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      secretBuffer += event.key.toUpperCase();
      if (secretBuffer.length > 10) secretBuffer = secretBuffer.slice(-10);
      if (secretBuffer.includes('BIOS')) {
        secretBuffer = '';
        this.add.text(320, 20, '🌟 BIOS SYSTEM ARCHITECTURAL CLUE: ACTIVE 🌟\nTauri Quantum Core v2.0 - Zero Latency Engine', {
          fontFamily: 'Courier',
          fontSize: '14px',
          color: '#ffff00',
          align: 'center',
          backgroundColor: '#000000'
        }).setOrigin(0.5);
      }
    });
  }

  handleUp() {
    if (this.mode === 'GAME_SELECT') {
      this.updateGameSelection(-1);
    } else {
      this.updateDiffSelection(-1);
    }
  }

  handleDown() {
    if (this.mode === 'GAME_SELECT') {
      this.updateGameSelection(1);
    } else {
      this.updateDiffSelection(1);
    }
  }

  handleSpace() {
    if (this.mode === 'GAME_SELECT') {
      this.mode = 'DIFFICULTY_SELECT';
      this.gameItems.forEach(item => item.setAlpha(0.2));
      this.diffContainer.setVisible(true);
      this.diffContainer.setScale(0.8);
      this.diffContainer.setAlpha(0);
      this.tweens.add({
        targets: this.diffContainer,
        scale: 1,
        alpha: 1,
        duration: 150,
        ease: 'Back.easeOut'
      });
    } else {
      const selectedGame = this.games[this.selectedGameIndex];
      const selectedDiff = this.difficulties[this.selectedDiffIndex];
      this.scene.start(selectedGame.scene, { difficulty: selectedDiff.id });
    }
  }

  handleEsc() {
    if (this.mode === 'DIFFICULTY_SELECT') {
      this.mode = 'GAME_SELECT';
      this.gameItems.forEach(item => item.setAlpha(1));
      this.diffContainer.setVisible(false);
    }
  }

  updateGameSelection(change: number) {
    this.gameItems[this.selectedGameIndex].setColor('#00aa00').setScale(1);
    this.selectedGameIndex = Phaser.Math.Wrap(this.selectedGameIndex + change, 0, this.games.length);
    this.gameItems[this.selectedGameIndex].setColor('#ffffff').setScale(1.1);
    
    this.tweens.add({
      targets: this.gameItems[this.selectedGameIndex],
      scale: 1.15,
      duration: 100,
      yoyo: true
    });
  }

  updateDiffSelection(change: number) {
    const prevDiff = this.difficulties[this.selectedDiffIndex];
    this.diffItems[this.selectedDiffIndex].setColor(prevDiff.color).setScale(1);
    this.selectedDiffIndex = Phaser.Math.Wrap(this.selectedDiffIndex + change, 0, this.difficulties.length);
    this.diffItems[this.selectedDiffIndex].setColor('#ffffff').setScale(1.1);
    this.diffDescText.setText(this.difficulties[this.selectedDiffIndex].desc);

    this.tweens.add({
      targets: this.diffItems[this.selectedDiffIndex],
      scale: 1.15,
      duration: 100,
      yoyo: true
    });
  }
}
