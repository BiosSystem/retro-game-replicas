import Phaser from 'phaser';
import { InputManager } from '../engine/InputManager';
import { readGamepadMenuInput, type GamepadMenuState } from '../engine/input/GamepadMenuInput';
import { createGlowButton, createNeonPanel } from '../ui/arcade/NeonUi';
import { drawRetroAvatar, RetroProfileStore } from '../ui/profile/RetroProfile';

export default class ProfileScene extends Phaser.Scene {
  private gamepadState: GamepadMenuState = idleState();
  private avatar!: Phaser.GameObjects.Graphics; private identText!: Phaser.GameObjects.Text;
  constructor() { super('ProfileScene'); }

  create() {
    InputManager.setLegacyGamepadKeyboardBridgeSuspended(true, this.scene.key);
    this.events.once('shutdown', () => InputManager.setLegacyGamepadKeyboardBridgeSuspended(false, this.scene.key));
    this.add.rectangle(320, 240, 640, 480, 0x000000, .88).setInteractive();
    const panel = createNeonPanel(this, 320, 240, 500, 360, 0xff2ec4, .96); panel.setScale(.94).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 160, ease: 'Back.Out' });
    const profile = new RetroProfileStore(localStorage).load();
    this.avatar = this.add.graphics(); drawRetroAvatar(this.avatar, 210, 225, 144, profile.avatarSeed);
    this.add.text(360, 145, 'PLAYER PROFILE', { fontFamily: "'Share Tech Mono', Courier", fontSize: '26px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(.5);
    this.add.text(360, 205, profile.name, { fontFamily: "'Share Tech Mono', Courier", fontSize: '34px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(.5);
    this.identText = this.add.text(360, 250, this.identLabel(profile.avatarSeed), { fontFamily: 'Courier', fontSize: '13px', color: '#8899aa', align: 'center', lineSpacing: 7 }).setOrigin(.5);
    createGlowButton(this, 360, 325, 190, 'REROLL AVATAR', () => this.reroll());
    this.add.text(320, 400, 'FIRE / R REROLL  ESC / B CLOSE', { fontFamily: 'Courier', fontSize: '12px', color: '#888888' }).setOrigin(.5);
    this.input.keyboard?.on('keydown-R', () => this.reroll());
  }

  update() {
    const next = readGamepadMenuInput(InputManager.getGamepadFrames());
    if (next.confirm && !this.gamepadState.confirm) this.reroll();
    if (next.back && !this.gamepadState.back) this.close();
    this.gamepadState = next;
  }
  private reroll() { const profile = new RetroProfileStore(localStorage).reroll(); this.avatar.clear(); drawRetroAvatar(this.avatar, 210, 225, 144, profile.avatarSeed); this.identText.setText(this.identLabel(profile.avatarSeed)); }
  private identLabel(seed: string) { return `IDENT ${seed.slice(-8).toUpperCase()}\nLOCAL PROFILE\nPROCEDURAL PIXEL DNA`; }
  private close() { this.scene.stop('ProfileScene'); }
}

function idleState(): GamepadMenuState { return { up: false, down: false, left: false, right: false, confirm: false, back: false }; }
