import type Phaser from 'phaser';

type SceneClass = new () => Phaser.Scene;

const loaders: Record<string, () => Promise<{ default: SceneClass }>> = {
  SnakeScene: () => import('./scenes/SnakeScene'), PongScene: () => import('./scenes/PongScene'),
  AsteroidsScene: () => import('./games/asteroids/NeonAsteroidsScene'), BreakoutScene: () => import('./scenes/BreakoutScene'),
  FroggerScene: () => import('./scenes/FroggerScene'), InvadersScene: () => import('./scenes/InvadersScene'),
  TetrisScene: () => import('./scenes/TetrisScene'), MinesweeperScene: () => import('./scenes/MinesweeperScene'),
  RunnerScene: () => import('./scenes/RunnerScene'), BirdScene: () => import('./scenes/BirdScene'), CyberScene: () => import('./scenes/CyberScene'),
};

export async function loadGameScene(key: string): Promise<SceneClass> {
  const loader = loaders[key];
  if (!loader) throw new Error(`Unknown game scene: ${key}`);
  return (await loader()).default;
}
