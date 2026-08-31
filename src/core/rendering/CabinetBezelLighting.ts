import Phaser from 'phaser';
import { CabinetLightPool } from './CabinetLightPool';

export class CabinetBezelLighting {
  private readonly scene: Phaser.Scene;
  private readonly pool = new CabinetLightPool();
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly webgl: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.webgl = scene.game.renderer.type === Phaser.WEBGL;
    this.graphics = scene.add.graphics().setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    scene.events.on('update', this.update, this);
    scene.events.once('shutdown', () => { scene.events.off('update', this.update, this); this.graphics.destroy(); });
  }

  pulse(x: number, y: number, color: number, intensity = 1, durationMs = 260) { this.pool.emit(x, y, color, intensity, durationMs); }

  private update(_time: number, delta: number) {
    const pulses = this.pool.update(delta);
    this.graphics.clear();
    for (const pulse of pulses) {
      const alpha = Math.min(.18, pulse.intensity * pulse.remainingMs / 1600);
      this.graphics.fillStyle(pulse.color, alpha).fillCircle(pulse.x, pulse.y, 44 + pulse.intensity * 38);
    }
    if (this.webgl && pulses.length) this.scene.lights.setAmbientColor(pulses[0].color);
  }
}
