import Phaser from 'phaser';
import { InputManager } from '../engine/InputManager';
import { SaveManager } from '../engine/SaveManager';
import { readGamepadMenuInput, type GamepadMenuState } from '../engine/input/GamepadMenuInput';
import { createNeonPanel } from '../ui/arcade/NeonUi';

interface GameOverData {
  scene: string;
  title: string;
  score?: number;
  difficulty?: string;
  restartData?: Record<string, unknown>;
  submitScore?: boolean;
  color?: string;
}

export default class GameOverScene extends Phaser.Scene {
  private gameOverData!: GameOverData;
  private gamepadState: GamepadMenuState = idleMenuState();
  private confirmed = false;

  constructor() { super('GameOverScene'); }

  init(data: GameOverData) { this.gameOverData = data; }

  create() {
    window.dispatchEvent(new CustomEvent('arcade-game-over', { detail: { scene: this.gameOverData.scene, score: this.gameOverData.score ?? 0 } }));
    InputManager.setLegacyGamepadKeyboardBridgeSuspended(true, this.scene.key);
    this.events.once('shutdown', () => InputManager.setLegacyGamepadKeyboardBridgeSuspended(false, this.scene.key));
    this.gamepadState = idleMenuState();
    this.confirmed = false;
    const scoreLine = Number.isFinite(this.gameOverData.score) ? `\nSCORE ${Math.floor(this.gameOverData.score as number)}` : '';
    const panel = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.86).setInteractive();
    const dialog = createNeonPanel(this, 320, 240, 510, 250, Number.parseInt((this.gameOverData.color ?? '#ff2ec4').slice(1), 16), .94).setScale(.92).setAlpha(0);
    this.tweens.add({ targets: dialog, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out' });
    this.add.text(320, 240, `${this.gameOverData.title}${scoreLine}\nPRESS FIRE TO RESTART\nESC / B / SELECT TO QUIT`, { fontFamily: 'Courier', fontSize: '24px', color: this.gameOverData.color ?? '#ff2ec4', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
    panel.on('pointerdown', () => this.continue());
    this.time.delayedCall(150, () => {
      this.input.keyboard?.once('keydown-SPACE', () => this.continue());
      this.input.keyboard?.once('keydown-ESC', () => this.quit());
    });
  }

  update() {
    const next = readGamepadMenuInput(InputManager.getGamepadFrames());
    if (next.confirm && !this.gamepadState.confirm) this.continue();
    if (next.back && !this.gamepadState.back) this.quit();
    this.gamepadState = next;
  }

  private continue() {
    if (this.confirmed) return;
    this.confirmed = true;
    const score = this.gameOverData.score ?? 0;
    const difficulty = this.gameOverData.difficulty ?? 'NORMAL';
    if (this.gameOverData.submitScore && SaveManager.isHighScore(this.gameOverData.scene, difficulty, score)) {
      this.scene.launch('NameEntryScene', { scene: this.gameOverData.scene, difficulty, score, restartData: this.gameOverData.restartData ?? { difficulty } });
      this.scene.stop();
      return;
    }
    if (this.gameOverData.submitScore) SaveManager.submitScore(this.gameOverData.scene, difficulty, score);
    this.scene.stop();
    const source = this.scene.get(this.gameOverData.scene);
    if (source) source.scene.restart(this.gameOverData.restartData ?? { difficulty });
    else this.scene.start('LobbyScene');
  }

  private quit() {
    if (this.confirmed) return;
    this.confirmed = true;
    this.scene.stop();
    this.scene.stop(this.gameOverData.scene);
    this.scene.start('LobbyScene');
  }
}

function idleMenuState(): GamepadMenuState { return { up: false, down: false, left: false, right: false, confirm: false, back: false }; }
