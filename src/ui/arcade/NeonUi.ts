import Phaser from 'phaser';
export { nineSliceLayout, type SliceRect } from './NeonUiLayout';

export interface HudState { score?: number; stage?: number; health?: number; combo?: number; status?: string; }
const TEXTURE = 'bios-neon-nine-slice';

export function createNeonPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color = 0x00ffcc, alpha = .92) {
  ensureTexture(scene);
  const background = scene.game.renderer.type === Phaser.WEBGL
    ? scene.add.nineslice(0, 0, TEXTURE, undefined, width, height, 4, 4, 4, 4).setTint(color).setAlpha(alpha)
    : scene.add.rectangle(0, 0, width, height, 0x030611, alpha).setStrokeStyle(2, color, .9);
  const glow = scene.add.rectangle(0, 0, width + 6, height + 6, 0x000000, 0).setStrokeStyle(1, color, .2);
  return scene.add.container(x, y, [glow, background]);
}

export function createGlowButton(scene: Phaser.Scene, x: number, y: number, width: number, label: string, onActivate: () => void) {
  const panel = createNeonPanel(scene, x, y, width, 34, 0x00ffcc, .8).setSize(width, 34).setInteractive();
  const text = scene.add.text(0, 0, label, { fontFamily: "'Share Tech Mono', Courier", fontSize: '14px', color: '#ffffff' }).setOrigin(.5);
  panel.add(text);
  panel.on('pointerover', () => scene.tweens.add({ targets: panel, scaleX: 1.04, scaleY: 1.04, duration: 90 }));
  panel.on('pointerout', () => scene.tweens.add({ targets: panel, scaleX: 1, scaleY: 1, duration: 90 }));
  panel.on('pointerdown', onActivate);
  return panel;
}

export class ArcadeHud {
  private readonly panel: Phaser.GameObjects.Container; private readonly text: Phaser.GameObjects.Text; private readonly bar: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, x = 8, y = 8, width = 624, color = 0x00ffcc) {
    this.panel = createNeonPanel(scene, x + width / 2, y + 18, width, 36, color, .72).setDepth(30);
    this.bar = scene.add.graphics().setDepth(31); this.text = scene.add.text(x + 10, y + 7, '', { fontFamily: 'Courier', fontSize: '12px', color: '#ffffff' }).setDepth(32);
  }
  set(state: HudState) {
    const fields = [state.score === undefined ? '' : `SCORE ${Math.floor(state.score).toString().padStart(7, '0')}`, state.stage === undefined ? '' : `STAGE ${state.stage}`, state.combo && state.combo > 1 ? `COMBO X${state.combo}` : '', state.status ?? ''].filter(Boolean);
    this.text.setText(fields.join('  ')); this.bar.clear();
    if (state.health !== undefined) { const value = Phaser.Math.Clamp(state.health, 0, 100); this.bar.fillStyle(0x07111c, .9).fillRect(480, 17, 132, 8).fillStyle(value < 30 ? 0xff2255 : 0x00ffcc).fillRect(482, 19, 128 * value / 100, 4); }
  }
  destroy() { this.panel.destroy(true); this.text.destroy(); this.bar.destroy(); }
}

function ensureTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(TEXTURE)) return;
  const graphics = scene.add.graphics(); graphics.fillStyle(0xffffff).fillRect(0, 0, 12, 12).fillStyle(0x07111c).fillRect(2, 2, 8, 8).fillStyle(0x45ffff, .35).fillRect(3, 3, 6, 6); graphics.generateTexture(TEXTURE, 12, 12); graphics.destroy();
}
