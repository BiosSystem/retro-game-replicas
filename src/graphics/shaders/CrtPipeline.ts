import Phaser from 'phaser';
import type { QualityTier } from '../PooledParticleSystem';
import { crtProfile, type CrtProfile } from './CrtState';

class CanvasPhosphorSurface {
  private readonly output: HTMLCanvasElement;
  private readonly frames: [HTMLCanvasElement, HTMLCanvasElement];
  private index = 0;

  constructor(parent: HTMLElement) {
    this.output = document.createElement('canvas');
    this.frames = [document.createElement('canvas'), document.createElement('canvas')];
    this.output.className = 'phosphor-persistence';
    this.output.setAttribute('aria-hidden', 'true');
    parent.appendChild(this.output);
  }

  render(source: HTMLCanvasElement, profile: CrtProfile) {
    if (profile.persistence <= 0) { this.output.hidden = true; return; }
    this.output.hidden = false;
    const width = Math.max(1, Math.floor(source.width * profile.renderScale));
    const height = Math.max(1, Math.floor(source.height * profile.renderScale));
    for (const canvas of [this.output, ...this.frames]) if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const previous = this.frames[this.index]; const next = this.frames[1 - this.index];
    const context = next.getContext('2d', { alpha: true }); const output = this.output.getContext('2d', { alpha: true });
    if (!context || !output) return;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over'; context.globalAlpha = profile.persistence; context.drawImage(previous, 0, 0);
    context.globalCompositeOperation = 'screen'; context.globalAlpha = 0.18; context.drawImage(source, 0, 0, width, height);
    output.clearRect(0, 0, width, height); output.globalAlpha = 1; output.globalCompositeOperation = 'source-over'; output.drawImage(next, 0, 0);
    this.index = 1 - this.index;
  }

  destroy() { this.output.remove(); }
}

interface CameraEffects { camera: Phaser.Cameras.Scene2D.Camera; controllers: Phaser.Filters.Controller[]; }

export class CrtPipeline {
  private readonly installed = new Map<string, CameraEffects>();
  private readonly persistence: CanvasPhosphorSurface | null;
  private tier: QualityTier = 'HIGH';
  private enabled = false;
  private readonly game: Phaser.Game;

  constructor(game: Phaser.Game) {
    this.game = game;
    const parent = document.getElementById('app');
    this.persistence = parent ? new CanvasPhosphorSurface(parent) : null;
  }

  sync(tier: QualityTier, reducedMotion: boolean, enabled: boolean) {
    this.tier = tier;
    this.enabled = enabled;
    const profile = crtProfile(enabled ? tier : 'LOW', reducedMotion);
    const activeKeys = new Set<string>();
    for (const scene of this.game.scene.getScenes(true)) {
      const camera = scene.cameras.main; const key = scene.scene.key; activeKeys.add(key);
      if (this.game.renderer.type !== Phaser.WEBGL) continue;
      let effects = this.installed.get(key);
      if (effects && effects.camera !== camera) { for (const controller of effects.controllers) controller.destroy(); effects = undefined; }
      if (!effects) { effects = this.install(camera, profile); this.installed.set(key, effects); }
      this.apply(effects, profile);
    }
    for (const [key, effects] of this.installed) if (!activeKeys.has(key)) { for (const controller of effects.controllers) controller.destroy(); this.installed.delete(key); }
    document.documentElement.style.setProperty('--crt-scanline-strength', profile.scanlineStrength.toString());
    document.documentElement.style.setProperty('--crt-chroma-pixels', `${profile.chromaPixels}px`);
  }

  render(reducedMotion: boolean) { this.persistence?.render(this.game.canvas, crtProfile(this.enabled ? this.tier : 'LOW', reducedMotion)); }
  destroy() { for (const effects of this.installed.values()) for (const controller of effects.controllers) controller.destroy(); this.installed.clear(); this.persistence?.destroy(); }

  private install(camera: Phaser.Cameras.Scene2D.Camera, profile: CrtProfile): CameraEffects {
    camera.setForceComposite(profile.bloom);
    const barrel = camera.filters.external.addBarrel(profile.barrel);
    const vignette = camera.filters.external.addVignette(0.5, 0.5, 0.94, 0.45, 0x000000);
    const bloom = Phaser.Actions.AddEffectBloom(camera, { threshold: 0.68, blurRadius: 2, blurSteps: 2, blendAmount: 0.28 })[0].parallelFilters;
    return { camera, controllers: [barrel, vignette, bloom] };
  }

  private apply(effects: CameraEffects, profile: CrtProfile) {
    effects.camera.setForceComposite(profile.bloom || profile.barrel > 0);
    effects.controllers[0].active = profile.barrel > 0;
    effects.controllers[1].active = profile.scanlineStrength > 0;
    effects.controllers[2].active = profile.bloom;
  }
}
