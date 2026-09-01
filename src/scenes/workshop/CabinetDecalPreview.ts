import type Phaser from 'phaser';
import type { VectorArtDocument } from '../../core/graphics/vector/VectorArtModel';
import { CABINET_SLOTS, VectorArtModel, type CabinetSlot } from '../../core/graphics/vector/VectorArtModel';
import { drawPath } from './VectorCanvasView';

export class CabinetDecalPreview {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly x: number; private readonly y: number;
  private selectedSlot: CabinetSlot = CABINET_SLOTS[0];
  constructor(scene: Phaser.Scene, x: number, y: number) { this.x = x; this.y = y; this.graphics = scene.add.graphics().setDepth(20); }
  render(document: VectorArtDocument) {
    const graphics = this.graphics.clear(); graphics.fillStyle(0x080d20).fillTriangle(this.x - 78, this.y - 110, this.x + 42, this.y - 90, this.x + 42, this.y + 110).fillTriangle(this.x - 78, this.y - 110, this.x + 42, this.y + 110, this.x - 78, this.y + 90).fillStyle(0x111a31).fillRect(this.x - 62, this.y - 88, 116, 155).fillStyle(0x0a0d15).fillRect(this.x - 50, this.y - 68, 90, 72).lineStyle(2, 0x77ffff, .7).strokeRect(this.x - 50, this.y - 68, 90, 72);
    const model = new VectorArtModel(document); for (const layer of document.layers.filter(layer => layer.visible)) { const target = layer.slot === 'MARQUEE' ? { x: this.x - 42, y: this.y - 103, width: 96, height: 18 } : layer.slot === 'CONTROL_PANEL' ? { x: this.x - 55, y: this.y + 66, width: 104, height: 24 } : { x: this.x - 78, y: this.y - 110, width: 120, height: 200 }; for (const path of layer.paths) for (const mirrored of model.mirrored(path)) drawPath(graphics, mirrored, layer.style.stroke, Math.max(1, layer.style.width / 2), layer.style.glow / 3, point => ({ x: target.x + point.x / document.width * target.width, y: target.y + point.y / document.height * target.height }), layer.style.fill); }
    graphics.fillStyle(0x66ffff, .25).fillRect(this.x - 42, this.y - 103, 96, 18).fillStyle(0xffffff, .18).fillCircle(this.x - 20, this.y + 78, 5).fillCircle(this.x + 8, this.y + 78, 5);
    const selected = this.selectedSlot === 'MARQUEE' ? { x: this.x - 42, y: this.y - 103, width: 96, height: 18 } : this.selectedSlot === 'CONTROL_PANEL' ? { x: this.x - 55, y: this.y + 66, width: 104, height: 24 } : { x: this.x - 78, y: this.y - 110, width: 120, height: 200 };
    graphics.lineStyle(2, 0xffcc66, .95).strokeRect(selected.x - 2, selected.y - 2, selected.width + 4, selected.height + 4);
  }
  setSlot(slot: CabinetSlot, document: VectorArtDocument) { this.selectedSlot = slot; this.render(document); }
  get slot() { return this.selectedSlot; }
  destroy() { this.graphics.destroy(); }
}
