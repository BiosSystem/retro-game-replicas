import './style.css';
import Phaser from 'phaser';
import LobbyScene from './scenes/LobbyScene';
import SnakeScene from './scenes/SnakeScene';
import PongScene from './scenes/PongScene';
import AsteroidsScene from './scenes/AsteroidsScene';
import BreakoutScene from './scenes/BreakoutScene';
import FroggerScene from './scenes/FroggerScene';
import InvadersScene from './scenes/InvadersScene';
import TetrisScene from './scenes/TetrisScene';
import MinesweeperScene from './scenes/MinesweeperScene';
import RunnerScene from './scenes/RunnerScene';
import BirdScene from './scenes/BirdScene';
import CyberScene from './scenes/CyberScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 640,
  height: 480,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#0a0a0a',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [
    LobbyScene, 
    SnakeScene, 
    PongScene, 
    AsteroidsScene, 
    BreakoutScene, 
    FroggerScene, 
    InvadersScene, 
    TetrisScene, 
    MinesweeperScene, 
    RunnerScene, 
    BirdScene,
    CyberScene
  ]
};

const game = new Phaser.Game(config);
(window as any).game = game;

