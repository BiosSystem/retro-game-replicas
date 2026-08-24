import Phaser from 'phaser';
import { PreferenceStore } from './PreferenceStore';

export class ArcadeRuntime {
  private readonly game: Phaser.Game;
  private frameCount = 0;
  private sampleStarted = performance.now();
  private frameRequest = 0;

  constructor(game: Phaser.Game) {
    this.game = game;
    this.applyPreferences();
    this.bindVisibility();
    this.bindInputStatus();
    window.addEventListener('arcade-settings-change', () => this.applyPreferences());
    this.frameRequest = requestAnimationFrame(this.measureFrames);
  }

  private measureFrames = (time: number) => {
    this.frameCount += 1;
    const elapsed = time - this.sampleStarted;
    if (elapsed >= 1000) {
      this.setText('runtime-fps', `${Math.round((this.frameCount * 1000) / elapsed)} FPS`);
      this.frameCount = 0;
      this.sampleStarted = time;
    }
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

  private applyPreferences() {
    const preferences = new PreferenceStore(localStorage).load();
    document.documentElement.classList.toggle('crt-enabled', localStorage.getItem('arcade_crt') === 'true');
    document.documentElement.classList.toggle('motion-reduced', localStorage.getItem('arcade_reduced_motion') === 'true');
    document.documentElement.dataset.cabinetTheme = preferences.theme.toLowerCase();
  }

  private setText(id: string, value: string) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
}
