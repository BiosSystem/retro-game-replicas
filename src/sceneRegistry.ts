import type Phaser from 'phaser';

type SceneClass = new () => Phaser.Scene;

const loaders: Record<string, () => Promise<{ default: SceneClass }>> = {
  SnakeScene: () => import('./scenes/SnakeScene'), PongScene: () => import('./scenes/PongScene'),
  AsteroidsScene: () => import('./games/asteroids/NeonAsteroidsScene'), BreakoutScene: () => import('./games/breakout/NeonBreakoutScene'),
  FroggerScene: () => import('./scenes/FroggerScene'), InvadersScene: () => import('./scenes/InvadersScene'),
  TetrisScene: () => import('./scenes/TetrisScene'), MinesweeperScene: () => import('./scenes/MinesweeperScene'),
  RunnerScene: () => import('./scenes/RunnerScene'), BirdScene: () => import('./scenes/BirdScene'), CyberScene: () => import('./scenes/CyberScene'),
  RacerScene: () => import('./games/racer/NeonRacerScene'),
  RaycasterScene: () => import('./games/raycaster/NeonCyberCasterScene'),
  MetaArcadeScene: () => import('./hub/MetaArcadeScene'),
  TacticsScene: () => import('./games/tactics/NeonTacticsScene'),
  LabyrinthScene: () => import('./games/labyrinth/NeonLabyrinthScene'),
  DanmakuScene: () => import('./games/danmaku/NeonDanmakuScene'),
  KombatScene: () => import('./games/kombat/NeonKombatScene'),
  OdysseyScene: () => import('./games/odyssey/NeonOdysseyScene'),
};

export async function loadGameScene(key: string): Promise<SceneClass> {
  const loader = loaders[key];
  if (!loader) throw new Error(`Unknown game scene: ${key}`);
  return (await loader()).default;
}
