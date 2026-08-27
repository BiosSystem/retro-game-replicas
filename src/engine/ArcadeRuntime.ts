import Phaser from 'phaser';
import { PreferenceStore } from './PreferenceStore';
import { AdaptiveQualityController } from '../graphics/PooledParticleSystem';
import { InputManager } from './InputManager';
import { FrameTelemetry, TelemetryHud } from './FrameTelemetry';
import { ReplayRuntime } from './replay/ReplayRuntime';
import { CrtShaderPipeline, parseCrtPreset } from './graphics/CrtShaderPipeline';
import { DisplayScaler, parseDisplayAspect } from './graphics/DisplayScaler';
import type { QualityTier } from '../graphics/PooledParticleSystem';

const OVERLAY_SCENES = new Set(['PauseScene', 'SettingsScene', 'NameEntryScene', 'AchievementsScene', 'GameOverScene']);

export class ArcadeRuntime {
  private readonly game: Phaser.Game;
  private frameCount = 0;
  private sampleStarted = performance.now();
  private frameRequest = 0;
  private startPressed = false;
  private readonly quality = new AdaptiveQualityController();
  private readonly telemetry = new FrameTelemetry();
  private readonly telemetryHud: TelemetryHud | null;
  private readonly crt: CrtShaderPipeline;
  private readonly displayScaler: DisplayScaler;
  private qualityTier: QualityTier = 'HIGH';
  private lastFrameAt = performance.now();
  private reducedMotion = false;
  private readonly replay: ReplayRuntime;

  constructor(game: Phaser.Game) {
    this.game = game;
    const telemetryRoot = document.getElementById('runtime-telemetry');
    this.telemetryHud = telemetryRoot ? new TelemetryHud(telemetryRoot) : null;
    const displayRoot = document.getElementById('app');
    if (!displayRoot) throw new Error('Arcade display root is unavailable');
    this.crt = new CrtShaderPipeline(game.canvas, displayRoot);
    this.displayScaler = new DisplayScaler(displayRoot, game.canvas, [this.crt.outputCanvas]);
    this.replay = new ReplayRuntime(game);
    this.applyPreferences();
    this.bindVisibility();
    this.bindInputStatus();
    this.bindKeyboardPause();
    window.addEventListener('arcade-settings-change', () => this.applyPreferences());
    this.frameRequest = requestAnimationFrame(this.measureFrames);
  }

  private measureFrames = (time: number) => {
    this.telemetry.record(time - this.lastFrameAt);
    this.lastFrameAt = time;
    InputManager.update(time);
    this.replay.sample();
    this.pollGamepadPause();
    this.frameCount += 1;
    const elapsed = time - this.sampleStarted;
    if (elapsed >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / elapsed);
      const tier = this.quality.sample(fps);
      this.qualityTier = tier;
      this.setText('runtime-fps', `${fps} FPS`);
      document.documentElement.dataset.quality = tier.toLowerCase();
      document.documentElement.style.setProperty('--adaptive-resolution', this.quality.resolutionScale.toString());
      const snapshot = this.telemetry.snapshot();
      this.telemetryHud?.update(snapshot, tier, this.game.scene.getScenes(true).length);
      this.frameCount = 0;
      this.sampleStarted = time;
    }
    this.crt.render(time, this.qualityTier, this.reducedMotion);
    this.frameRequest = requestAnimationFrame(this.measureFrames);
  };

  private bindVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.game.loop.sleep();
        cancelAnimationFrame(this.frameRequest);
        this.setText('runtime-state', 'SUSPENDED');
        return;
      }
      this.game.loop.wake();
      this.frameCount = 0;
      this.sampleStarted = performance.now();
      this.lastFrameAt = this.sampleStarted;
      this.frameRequest = requestAnimationFrame(this.measureFrames);
      this.setText('runtime-state', 'ACTIVE');
    });
  }

  private bindInputStatus() {
    window.addEventListener('gamepadconnected', () => this.setText('runtime-input', 'GAMEPAD'));
    window.addEventListener('gamepaddisconnected', () => {
      const hasPad = Array.from(navigator.getGamepads?.() ?? []).some(Boolean);
      this.setText('runtime-input', hasPad ? 'GAMEPAD' : 'KEYBOARD');
    });
    if ('ontouchstart' in window) this.setText('runtime-input', 'TOUCH');
  }

  private bindKeyboardPause() {
    window.addEventListener('keydown', event => {
      if (event.code !== 'Escape' || event.repeat || this.hasForegroundOverlay()) return;
      const active = this.activeGameScene();
      if (!active) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      active.scene.pause();
      active.scene.launch('PauseScene', { scene: active.scene.key });
    }, true);
  }

  private applyPreferences() {
    const preferences = new PreferenceStore(localStorage).load();
    const storedPreset = localStorage.getItem('arcade_crt_preset');
    const preset = parseCrtPreset(storedPreset, localStorage.getItem('arcade_crt') === 'true' ? 'ARCADE_CRT_1980S' : 'BYPASS');
    this.crt.setPreset(preset);
    this.displayScaler.setAspect(parseDisplayAspect(localStorage.getItem('arcade_display_aspect')));
    document.documentElement.dataset.crtPreset = preset.toLowerCase();
    document.documentElement.classList.toggle('motion-reduced', localStorage.getItem('arcade_reduced_motion') === 'true');
    document.documentElement.dataset.cabinetTheme = preferences.theme.toLowerCase();
    this.reducedMotion = localStorage.getItem('arcade_reduced_motion') === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private setText(id: string, value: string) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  private pollGamepadPause() {
    const pressed = InputManager.getGamepadFrames().some(pad => Boolean(pad.buttons & (1 << 9)));
    if (pressed && !this.startPressed) {
      const active = this.activeGameScene();
      if (active && !this.game.scene.isActive('PauseScene')) { active.scene.pause(); active.scene.launch('PauseScene', { scene: active.scene.key }); }
    }
    this.startPressed = pressed;
  }

  private hasForegroundOverlay() {
    return [...OVERLAY_SCENES].some(key => this.game.scene.isActive(key));
  }

  private activeGameScene() {
    return this.game.scene.getScenes(true).find(scene => scene.scene.key !== 'LobbyScene' && !OVERLAY_SCENES.has(scene.scene.key));
  }
}
