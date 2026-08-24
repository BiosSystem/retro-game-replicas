import type Phaser from 'phaser';
import { loadGameScene } from '../../sceneRegistry';

type SceneClass = new () => Phaser.Scene;
export interface SceneHost { has(key: string): boolean; add(key: string, scene: SceneClass): void; start(key: string, data: object): void; }

export async function mountGameScene(host: SceneHost, key: string, data: object, loader = loadGameScene) {
  if (!host.has(key)) host.add(key, await loader(key));
  host.start(key, data);
}
