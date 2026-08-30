import Phaser from 'phaser';
import LobbyScene from './scenes/LobbyScene';
import PauseScene from './scenes/PauseScene';
import NameEntryScene from './scenes/NameEntryScene';
import GameOverScene from './scenes/GameOverScene';
import SettingsScene from './scenes/SettingsScene';
import AchievementsScene from './scenes/AchievementsScene';
import ProfileScene from './scenes/ProfileScene';
import ControllerConfigScene from './scenes/ControllerConfigScene';
import { InputManager } from './engine/InputManager';
import { AudioEngine } from './engine/AudioEngine';
import { ArcadeRuntime } from './engine/ArcadeRuntime';
import { SaveManager } from './engine/SaveManager';
import { installModApi } from './mods/ModRuntime';
import { installModManager } from './ui/mods/ModManagerController';
import { arcadeCompute } from './engine/compute/ComputePipeline';
import { installVisualModStudio } from './ui/studio/VisualModStudio';
import { installSwarmLeaderboard } from './ui/swarm/SwarmLeaderboardUi';
import { installPhaserDeltaGuard } from './engine/PhaserDeltaGuard';
import { installSaveStateController } from './ui/saves/SaveStateController';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'app', width: 640, height: 480,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: '#0a0a0a', pixelArt: true, fps: { target: 60 },
  physics: { default: 'arcade', arcade: { debug: false, fixedStep: true, fps: 60 } },
  scene: [LobbyScene, PauseScene, NameEntryScene, GameOverScene, SettingsScene, AchievementsScene, ProfileScene, ControllerConfigScene],
});

(window as typeof window & { game?: Phaser.Game }).game = game;
const deltaGuard = installPhaserDeltaGuard(game);
document.documentElement.dataset.frameDeltaCap = `${deltaGuard.maximumDeltaMs}ms`;
new ArcadeRuntime(game);
InputManager.initialize();
SaveManager.initialize();
installModApi(window);
installModManager();
installSaveStateController();
void import('./ui/crt/ShaderWorkshopController').then(module => module.installShaderWorkshopController());
const netplay = import('./ui/net/NetplayController').then(module => module.installNetplayController());
document.getElementById('netplay-toggle')?.addEventListener('click', event => { event.stopImmediatePropagation(); void netplay.then(controller => controller.toggle(true)); }, { once: true });
void netplay.then(controller => {
  (window as typeof window & { arcadeSwarm?: { merge(value: unknown): Promise<unknown>; top(): unknown } }).arcadeSwarm = {
    merge: value => controller.mergeScores(value as import('./net/swarm/ScoreGossip').GossipEnvelope),
    top: () => controller.swarmTop(),
  };
});
installVisualModStudio();
installSwarmLeaderboard();
void arcadeCompute.initialize().then(backend => { document.documentElement.dataset.compute = backend.toLowerCase(); });
window.addEventListener('pointerdown', () => AudioEngine.initialize(), { once: true });
window.addEventListener('keydown', () => AudioEngine.initialize(), { once: true });
