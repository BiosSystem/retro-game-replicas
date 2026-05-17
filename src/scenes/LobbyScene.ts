import Phaser from 'phaser';

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

  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('LobbyScene');
  }

  create() {
    this.add.text(320, 80, 'UNIVERSAL RETRO ARCADE', {
      fontFamily: 'Courier',
      fontSize: '40px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(320, 120, 'SELECT YOUR GAME', {
      fontFamily: 'Courier',
      fontSize: '20px',
      color: '#00cc00'
    }).setOrigin(0.5);

    this.games.forEach((game, index) => {
      const item = this.add.text(320, 180 + (index * 25), game.name, {
        fontFamily: 'Courier',
        fontSize: '22px',
        color: index === 0 ? '#ffffff' : '#00ff00'
      }).setOrigin(0.5);
      
      this.menuItems.push(item);
    });

    this.add.text(320, 450, 'USE ARROW KEYS TO NAVIGATE - PRESS SPACE TO START', {
      fontFamily: 'Courier',
      fontSize: '14px',
      color: '#00aa00'
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-UP', () => {
      this.updateSelection(-1);
    });
    this.input.keyboard?.on('keydown-DOWN', () => {
      this.updateSelection(1);
    });
    this.input.keyboard?.on('keydown-SPACE', () => {
      const selectedGame = this.games[this.selectedIndex];
      this.scene.start(selectedGame.scene);
    });

    let secretBuffer = '';
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      secretBuffer += event.key.toUpperCase();
      if (secretBuffer.length > 10) secretBuffer = secretBuffer.slice(-10);
      if (secretBuffer.includes('BIOS')) {
        secretBuffer = '';
        this.add.text(320, 30, '🌟 BIOS SYSTEM ARCHITECTURAL CLUE: ACTIVE 🌟\nTauri Quantum Core v2.0 - Zero Latency Engine', {
          fontFamily: 'Courier',
          fontSize: '14px',
          color: '#ffff00',
          align: 'center',
          backgroundColor: '#000000'
        }).setOrigin(0.5);
      }
    });
  }

  updateSelection(change: number) {
    this.menuItems[this.selectedIndex].setColor('#00ff00');
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + change, 0, this.games.length);
    this.menuItems[this.selectedIndex].setColor('#ffffff');
    
    this.tweens.add({
      targets: this.menuItems[this.selectedIndex],
      scale: 1.1,
      duration: 100,
      yoyo: true
    });
  }
}
