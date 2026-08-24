import Phaser from 'phaser';
import LobbyScene from './scenes/LobbyScene';
import PauseScene from './scenes/PauseScene';
import NameEntryScene from './scenes/NameEntryScene';
import SettingsScene from './scenes/SettingsScene';
import AchievementsScene from './scenes/AchievementsScene';
import { InputManager } from './engine/InputManager';
import { AudioEngine } from './engine/AudioEngine';
import { ArcadeRuntime } from './engine/ArcadeRuntime';
import { SaveManager } from './engine/SaveManager';
import { installModApi } from './mods/ModRuntime';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'app', width: 640, height: 480,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: '#0a0a0a', pixelArt: true, fps: { target: 60 },
  physics: { default: 'arcade', arcade: { debug: false, fixedStep: true, fps: 60 } },
  scene: [LobbyScene, PauseScene, NameEntryScene, SettingsScene, AchievementsScene],
});

(window as typeof window & { game?: Phaser.Game }).game = game;
new ArcadeRuntime(game);
InputManager.initialize();
SaveManager.initialize();
installModApi(window);
window.addEventListener('pointerdown', () => AudioEngine.initialize(), { once: true });
window.addEventListener('keydown', () => AudioEngine.initialize(), { once: true });
