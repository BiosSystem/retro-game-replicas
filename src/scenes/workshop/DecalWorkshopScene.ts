import Phaser from 'phaser';
import { cabinetSkinStore } from '../../core/graphics/vector/CabinetSkinStore';
import { encodeDecal } from '../../core/graphics/vector/DecalCodec';
import { CABINET_SLOTS, VectorArtModel, createVectorDocument } from '../../core/graphics/vector/VectorArtModel';
import { createNineSlicePanel } from '../../ui/NineSlicePanel';
import { mountNineSlicePanel } from '../../ui/NineSlicePanelRenderer';
import { CabinetDecalPreview } from './CabinetDecalPreview';
import { VECTOR_TOOLS, VectorCanvasView, type VectorTool } from './VectorCanvasView';

export default class DecalWorkshopScene extends Phaser.Scene {
  private canvas!: VectorCanvasView; private preview!: CabinetDecalPreview; private toolText!: Phaser.GameObjects.Text; private toolIndex = 0; private slotIndex = 0;
  constructor() { super('DecalWorkshopScene'); }
  create() {
    const model = new VectorArtModel(cabinetSkinStore.get('MetaArcadeScene') ?? createVectorDocument());
    this.add.rectangle(320, 240, 640, 480, 0x02050d); mountNineSlicePanel(this, 320, 240, 624, 448, createNineSlicePanel('CABINET DECAL // VECTOR WORKSHOP', 'CYAN_SYNTH'));
    this.markCanvas('arcadeScene', 'DecalWorkshopScene'); this.markCanvas('decalPreview', this.previewSlot());
    this.add.text(320, 42, 'DRAG DRAW  RIGHT-DRAG PAN  WHEEL ZOOM  1-8 TOOL  [ ] PREVIEW  S SAVE  O EXPORT  ESC LOBBY', { fontFamily: 'Courier', fontSize: '8px', color: '#aaffff' }).setOrigin(.5).setDepth(22);
    this.canvas = new VectorCanvasView(this, model, 22, 78, 370, 330, document => this.preview.render(document)); this.preview = new CabinetDecalPreview(this, 510, 240); this.preview.render(model.document);
    this.toolText = this.add.text(205, 426, '', { fontFamily: 'Courier', fontSize: '10px', color: '#ffcc66' }).setOrigin(.5).setDepth(22); this.updateTool(); this.bindKeys();
  }
  private bindKeys() { this.input.keyboard?.on('keydown', (event: KeyboardEvent) => { if (event.key >= '1' && event.key <= '8') { this.toolIndex = Number(event.key) - 1; this.updateTool(); } else if (event.key.toLowerCase() === 'u') this.canvas.undo(); else if (event.key.toLowerCase() === 'y') this.canvas.redo(); else if (event.key.toLowerCase() === 's') cabinetSkinStore.set('MetaArcadeScene', this.canvas.document()); else if (event.key.toLowerCase() === 'o') this.exportDecal(); else if (event.key === '[' || event.key === ']') { this.slotIndex = (this.slotIndex + (event.key === '[' ? CABINET_SLOTS.length - 1 : 1)) % CABINET_SLOTS.length; this.preview.setSlot(CABINET_SLOTS[this.slotIndex], this.canvas.document()); this.markCanvas('decalPreview', this.previewSlot()); this.updateTool(); } else if (event.key === 'Escape') this.scene.start('LobbyScene'); }); }
  private markCanvas(name: string, value: string) { this.game.canvas.dataset[name] = value; const activeCanvas = document.querySelector<HTMLCanvasElement>('#app canvas'); if (activeCanvas) activeCanvas.dataset[name] = value; }
  private previewSlot() { return CABINET_SLOTS[this.slotIndex]; }
  private exportDecal() { const blob = new Blob([encodeDecal(this.canvas.document())], { type: 'application/octet-stream' }); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = 'cabinet.neonart'; anchor.click(); URL.revokeObjectURL(anchor.href); }
  private updateTool() { const tool = VECTOR_TOOLS[this.toolIndex] as VectorTool; this.canvas.setTool(tool); this.toolText.setText(`TOOL: ${tool}  PREVIEW: ${this.previewSlot()}  SNAP: 8PX  HISTORY: 64`); }
}
