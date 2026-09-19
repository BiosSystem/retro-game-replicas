import Phaser from 'phaser';

export interface LayeredBackdropOptions {
  texture: string;
  veil: number;
  veilAlpha?: number;
  scale?: number;
  grid?: { size: number; color: number; alpha: number };
}

export function addLayeredBackdrop(scene: Phaser.Scene, options: LayeredBackdropOptions) {
  const image = scene.add.image(320, 240, options.texture).setScale(options.scale ?? 2).setDepth(-4);
  const veil = scene.add.rectangle(320, 240, 640, 480, options.veil, options.veilAlpha ?? 0.25).setDepth(-3);
  const grid = options.grid
    ? scene.add.grid(320, 240, 640, 480, options.grid.size, options.grid.size, options.veil, 0, options.grid.color, options.grid.alpha).setDepth(-1)
    : null;
  return { image, veil, grid };
}
