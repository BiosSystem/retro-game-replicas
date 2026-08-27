import Phaser from 'phaser';
import { InputManager } from '../engine/InputManager';
import { SaveManager } from '../engine/SaveManager';
import { readGamepadMenuInput, type GamepadMenuState } from '../engine/input/GamepadMenuInput';

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
    InputManager.setLegacyGamepadKeyboardBridgeSuspended(true, this.scene.key);
    this.events.once('shutdown', () => InputManager.setLegacyGamepadKeyboardBridgeSuspended(false, this.scene.key));
    this.gamepadState = idleMenuState();
    this.confirmed = false;
    const scoreLine = Number.isFinite(this.gameOverData.score) ? `\nSCORE ${Math.floor(this.gameOverData.score as number)}` : '';
    const panel = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.86).setInteractive();
    this.add.text(320, 240, `${this.gameOverData.title}${scoreLine}\nPRESS FIRE TO RESTART`, { fontFamily: 'Courier', fontSize: '28px', color: this.gameOverData.color ?? '#ff2ec4', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
    panel.on('pointerdown', () => this.continue());
    this.time.delayedCall(150, () => this.input.keyboard?.once('keydown-SPACE', () => this.continue()));
  }

  update() {
    const next = readGamepadMenuInput(InputManager.getGamepadFrames());
    if (next.confirm && !this.gamepadState.confirm) this.continue();
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
}

function idleMenuState(): GamepadMenuState { return { up: false, down: false, left: false, right: false, confirm: false, back: false }; }
