import Phaser from 'phaser';

const SPARK_TEXTURE = '__overdrive_gpu_spark';
const MAX_VISUAL_LIGHTS = 12;

export interface GpuBurst {
  x: number;
  y: number;
  color: number;
  count: number;
  critical?: boolean;
  directionX?: number;
  directionY?: number;
}

interface ActiveLight {
  light: Phaser.GameObjects.Light;
  endsAt: number;
  intensity: number;
}

/**
 * Keeps destruction effects in one Phaser particle render node and a bounded light pool.
 * It owns no simulation state and never touches Arcade Physics or scene clocks.
 */
export class SpriteGPULayer {
  private readonly scene: Phaser.Scene;
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly lights: ActiveLight[] = [];
  private enabled = false;
  private glow: Phaser.Filters.Glow | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    ensureSparkTexture(scene);
    this.emitter = scene.add.particles(0, 0, SPARK_TEXTURE, {
      emitting: false,
      maxParticles: 768,
      lifespan: { min: 220, max: 560 },
      speed: { min: 70, max: 240 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.25, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      rotate: { min: 0, max: 360 },
      gravityY: 32,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(92).setVisible(false);
    scene.events.on('update', this.updateLights, this);
    scene.events.once('shutdown', this.destroy, this);
  }

  setEnabled(enabled: boolean) {
    const next = enabled && this.scene.game.renderer.type === Phaser.WEBGL;
    if (next === this.enabled) return;
    this.enabled = next;
    this.emitter.setVisible(this.enabled);
    if (!this.enabled) {
      this.emitter.stop();
      for (const entry of this.lights) entry.light.intensity = 0;
      this.setSceneObjectLighting(false);
      this.scene.lights.disable();
      return;
    }
    this.scene.lights.enable();
    this.scene.lights.setAmbientColor(0x2a2a3f);
    this.emitter.setLighting(true);
    this.setSceneObjectLighting(true);
    if (!this.glow) {
      this.emitter.enableFilters();
      this.glow = this.emitter.filters?.external.addGlow(0x65ffff, 1.15, 0, 1, false, 6, 8) ?? null;
    }
    if (this.glow) this.glow.active = true;
  }

  burst(effect: GpuBurst) {
    if (!this.enabled) return;
    this.setSceneObjectLighting(true);
    const count = Math.max(1, Math.min(96, Math.round(effect.count)));
    if (effect.directionX !== undefined && effect.directionY !== undefined) {
      const angle = Phaser.Math.RadToDeg(Math.atan2(effect.directionY, effect.directionX));
      this.emitter.setAngle(angle);
    } else this.emitter.setAngle(Phaser.Math.Between(0, 360));
    this.emitter.setParticleTint(effect.color);
    this.emitter.explode(count, effect.x, effect.y);
    if (this.glow) this.glow.color = effect.color;
    this.emitLight(effect.x, effect.y, effect.color, effect.critical ? 1.4 : 0.8, effect.critical ? 1.05 : 0.72);
  }

  destroy() {
    this.scene.events.off('update', this.updateLights, this);
    this.glow?.destroy();
    this.glow = null;
    this.emitter.destroy();
    for (const entry of this.lights) this.scene.lights.removeLight(entry.light);
    this.lights.length = 0;
  }

  private emitLight(x: number, y: number, color: number, intensity: number, lifeScale: number) {
    const now = this.scene.time.now;
    let entry = this.lights.find(candidate => candidate.endsAt <= now);
    if (!entry && this.lights.length < MAX_VISUAL_LIGHTS) {
      entry = { light: this.scene.lights.addLight(x, y, 96, color, intensity, 14), endsAt: 0, intensity };
      this.lights.push(entry);
    }
    if (!entry) entry = this.lights.reduce((oldest, candidate) => candidate.endsAt < oldest.endsAt ? candidate : oldest);
    entry.light.setPosition(x, y);
    entry.light.radius = 72 + Math.round(intensity * 48);
    entry.light.color.set((color >>> 16) & 0xff, (color >>> 8) & 0xff, color & 0xff);
    entry.light.intensity = intensity;
    entry.intensity = intensity;
    entry.endsAt = now + Math.round(260 * lifeScale);
  }

  private updateLights(time: number) {
    if (!this.enabled) return;
    for (const entry of this.lights) {
      const remaining = entry.endsAt - time;
      entry.light.intensity = remaining > 0 ? entry.intensity * Math.min(1, remaining / 180) : 0;
    }
  }

  private setSceneObjectLighting(enabled: boolean) {
    for (const object of this.scene.children.list) {
      if (object instanceof Phaser.GameObjects.Image || object instanceof Phaser.GameObjects.Sprite) object.setLighting(enabled);
    }
  }
}

function ensureSparkTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(SPARK_TEXTURE)) return;
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xffffff).fillCircle(4, 4, 4).fillStyle(0xffffff, 0.35).fillCircle(4, 4, 7);
  graphics.generateTexture(SPARK_TEXTURE, 14, 14);
  graphics.destroy();
}
