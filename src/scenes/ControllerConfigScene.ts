import Phaser from 'phaser';
import { InputManager } from '../engine/InputManager';
import { createNeonPanel } from '../ui/arcade/NeonUi';
import { readGamepadMenuInput, type GamepadMenuState } from '../engine/input/GamepadMenuInput';

const OPTIONS = ['BACK', 'DEADZONE MODE', 'DEADZONE -', 'DEADZONE +', 'TRIGGER -', 'TRIGGER +', 'BIND FIRE', 'RESET PROFILE', 'CONNECT WEBHID'];

export default class ControllerConfigScene extends Phaser.Scene {
  private sourceScene = 'SettingsScene';
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private status!: Phaser.GameObjects.Text;
  private diagram!: Phaser.GameObjects.Graphics;
  private gamepadState: GamepadMenuState = { up: false, down: false, left: false, right: false, confirm: false, back: false };
  private binding = false;

  constructor() { super('ControllerConfigScene'); }
  init(data: { scene?: string }) { this.sourceScene = data.scene ?? 'SettingsScene'; }

  create() {
    this.add.rectangle(320, 240, 640, 480, 0x000000, 0.86).setInteractive();
    createNeonPanel(this, 320, 240, 586, 442, 0x45ffff, 0.92);
    this.add.text(320, 38, 'CONTROLLER CALIBRATION', { fontFamily: "'Share Tech Mono', Courier", fontSize: '27px', color: '#45ffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.status = this.add.text(320, 72, 'CONNECT A CONTROLLER TO CALIBRATE', { fontFamily: 'Courier', fontSize: '14px', color: '#b9dfff' }).setOrigin(0.5);
    this.diagram = this.add.graphics().setDepth(2);
    OPTIONS.forEach((option, index) => this.menuItems.push(this.add.text(68, 116 + index * 29, option, { fontFamily: 'Courier', fontSize: '17px', color: '#ffffff' })));
    this.input.keyboard?.on('keydown-ArrowUp', () => this.move(-1));
    this.input.keyboard?.on('keydown-ArrowDown', () => this.move(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.select());
    this.input.keyboard?.on('keydown-SPACE', () => this.select());
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    this.refresh();
  }

  update() {
    const frames = InputManager.getGamepadFrames();
    const next = readGamepadMenuInput(frames);
    if (this.binding) {
      const pad = frames[0];
      const button = firstPressedButton(pad?.pressed ?? 0);
      if (pad && button !== null) { InputManager.bindControllerAction(pad.id, 'FIRE', [button]); this.binding = false; this.refresh(); }
    } else {
      if (next.up && !this.gamepadState.up) this.move(-1);
      if (next.down && !this.gamepadState.down) this.move(1);
      if (next.confirm && !this.gamepadState.confirm) this.select();
      if (next.back && !this.gamepadState.back) this.close();
    }
    this.gamepadState = next;
    this.renderDiagram();
  }

  private move(delta: number) { this.selectedIndex = (this.selectedIndex + delta + OPTIONS.length) % OPTIONS.length; this.refresh(); }
  private select() {
    const pad = InputManager.getGamepadFrames()[0];
    const profile = pad ? InputManager.controllerProfile(pad.id) : null;
    const option = OPTIONS[this.selectedIndex];
    if (option === 'BACK') return this.close();
    if (option === 'CONNECT WEBHID') { void InputManager.connectWebHid().then(() => this.refresh()); return; }
    if (!pad || !profile) return;
    if (option === 'DEADZONE MODE') InputManager.saveControllerProfile(pad.id, { ...profile, deadzoneMode: profile.deadzoneMode === 'RADIAL' ? 'SCALED_RADIAL' : 'RADIAL' });
    if (option === 'DEADZONE -') InputManager.saveControllerProfile(pad.id, { ...profile, deadzone: Math.max(0, profile.deadzone - 0.02) });
    if (option === 'DEADZONE +') InputManager.saveControllerProfile(pad.id, { ...profile, deadzone: Math.min(0.5, profile.deadzone + 0.02) });
    if (option === 'TRIGGER -') InputManager.saveControllerProfile(pad.id, { ...profile, triggerThreshold: Math.max(0.05, profile.triggerThreshold - 0.05) });
    if (option === 'TRIGGER +') InputManager.saveControllerProfile(pad.id, { ...profile, triggerThreshold: Math.min(1, profile.triggerThreshold + 0.05) });
    if (option === 'BIND FIRE') { this.binding = true; this.refresh(); return; }
    if (option === 'RESET PROFILE') InputManager.resetControllerProfile(pad.id);
    this.refresh();
  }

  private refresh() {
    const pad = InputManager.getGamepadFrames()[0];
    const profile = pad ? InputManager.controllerProfile(pad.id) : null;
    this.status.setText(this.binding ? 'PRESS ANY CONTROLLER BUTTON FOR FIRE' : pad ? `${pad.family}  ${pad.fingerprint ?? pad.id}` : 'CONNECT A CONTROLLER TO CALIBRATE');
    this.menuItems.forEach((item, index) => {
      const option = OPTIONS[index];
      const label = option === 'DEADZONE MODE' && profile ? `${option}: ${profile.deadzoneMode}`
        : option.startsWith('DEADZONE') && profile ? `${option}: ${profile.deadzone.toFixed(2)}`
          : option.startsWith('TRIGGER') && profile ? `${option}: ${profile.triggerThreshold.toFixed(2)}`
            : option === 'BIND FIRE' && profile ? `${option}: ${profile.bindings.FIRE.join('+')}`
              : option === 'CONNECT WEBHID' ? `${option}: ${InputManager.webHidSupported() ? 'READY' : 'UNAVAILABLE'}` : option;
      item.setText(index === this.selectedIndex ? `> ${label} <` : label).setColor(index === this.selectedIndex ? '#ffff00' : '#ffffff');
    });
  }

  private renderDiagram() {
    const pad = InputManager.getGamepadFrames()[0];
    const profile = pad ? InputManager.controllerProfile(pad.id) : null;
    this.diagram.clear().lineStyle(2, 0x45ffff, 0.8).strokeRoundedRect(340, 115, 210, 205, 14);
    this.diagram.strokeCircle(395, 186, 34).strokeCircle(395, 186, (profile?.deadzone ?? 0.16) * 34);
    this.diagram.fillStyle(0x00ffcc).fillCircle(395 + (pad?.leftX ?? 0) * 34, 186 + (pad?.leftY ?? 0) * 34, 5);
    for (let button = 0; button < 8; button++) {
      const x = 470 + (button % 4) * 20; const y = 168 + Math.floor(button / 4) * 26;
      const active = Boolean(pad?.buttons && (pad.buttons & (1 << button)));
      this.diagram.fillStyle(active ? 0xffff00 : 0x18354a, 1).fillCircle(x, y, 8).lineStyle(1, 0x45ffff).strokeCircle(x, y, 8);
    }
    this.diagram.lineStyle(1, 0x45ffff, 0.7).lineBetween(365, 265, 525, 265);
    this.diagram.fillStyle((pad?.leftTrigger ?? 0) >= (profile?.triggerThreshold ?? 0.5) ? 0xffff00 : 0x00aacc).fillRect(365, 278, 72 * (pad?.leftTrigger ?? 0), 8);
    this.diagram.fillStyle((pad?.rightTrigger ?? 0) >= (profile?.triggerThreshold ?? 0.5) ? 0xffff00 : 0x00aacc).fillRect(453, 278, 72 * (pad?.rightTrigger ?? 0), 8);
  }

  private close() { this.scene.stop(); this.scene.resume(this.sourceScene); }
}

function firstPressedButton(mask: number) { for (let index = 0; index <= 16; index++) if (mask & (1 << index)) return index; return null; }
