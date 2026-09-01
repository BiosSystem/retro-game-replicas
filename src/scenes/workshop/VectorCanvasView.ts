import type Phaser from 'phaser';
import { VectorArtModel, cloneDocument, type VectorArtDocument, type VectorPath, type VectorPoint } from '../../core/graphics/vector/VectorArtModel';

export const VECTOR_TOOLS = ['PEN', 'BEZIER', 'LINE', 'BOX', 'CIRCLE', 'BRUSH', 'ERASER', 'PICKER'] as const;
export type VectorTool = (typeof VECTOR_TOOLS)[number];

export class VectorHistory {
  private readonly past: VectorArtDocument[] = [];
  private readonly future: VectorArtDocument[] = [];
  private readonly maximum: number;
  constructor(maximum = 64) { this.maximum = maximum; }
  commit(document: VectorArtDocument) { this.past.push(cloneDocument(document)); if (this.past.length > this.maximum) this.past.shift(); this.future.length = 0; }
  undo(current: VectorArtDocument) { const prior = this.past.pop(); if (!prior) return undefined; this.future.push(cloneDocument(current)); return prior; }
  redo(current: VectorArtDocument) { const next = this.future.pop(); if (!next) return undefined; this.past.push(cloneDocument(current)); return next; }
  get undoDepth() { return this.past.length; }
}

export class VectorCanvasView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly scene: Phaser.Scene;
  private model: VectorArtModel;
  private readonly x: number; private readonly y: number; private readonly width: number; private readonly height: number;
  private readonly changed: (document: VectorArtDocument) => void;
  private tool: VectorTool = 'PEN';
  private zoom = 1;
  private pan = { x: 0, y: 0 };
  private pointerStart: VectorPoint | undefined;
  private panStart: { x: number; y: number; pointerX: number; pointerY: number } | undefined;
  private readonly history = new VectorHistory();

  constructor(scene: Phaser.Scene, model: VectorArtModel, x: number, y: number, width: number, height: number, changed: (document: VectorArtDocument) => void) {
    this.scene = scene; this.model = model; this.x = x; this.y = y; this.width = width; this.height = height; this.changed = changed; this.graphics = scene.add.graphics().setDepth(20); this.bind(); this.render();
  }
  setTool(tool: VectorTool) { this.tool = tool; }
  undo() { const document = this.history.undo(this.model.snapshot()); if (document) { this.model = new VectorArtModel(document); this.render(); this.changed(document); } }
  redo() { const document = this.history.redo(this.model.snapshot()); if (document) { this.model = new VectorArtModel(document); this.render(); this.changed(document); } }
  document() { return this.model.snapshot(); }
  render() {
    const graphics = this.graphics.clear(); graphics.fillStyle(0x020712, .96).fillRect(this.x, this.y, this.width, this.height).lineStyle(1, 0x226688, .8).strokeRect(this.x, this.y, this.width, this.height);
    graphics.lineStyle(1, 0x13506c, .45); for (let gx = this.x; gx <= this.x + this.width; gx += 16 * this.zoom) graphics.lineBetween(gx, this.y, gx, this.y + this.height); for (let gy = this.y; gy <= this.y + this.height; gy += 16 * this.zoom) graphics.lineBetween(this.x, gy, this.x + this.width, gy);
    for (const layer of this.model.document.layers.filter(layer => layer.visible)) for (const path of layer.paths) for (const mirrored of this.model.mirrored(path)) drawPath(graphics, mirrored, layer.style.stroke, layer.style.width, layer.style.glow, point => this.project(point), layer.style.fill);
  }
  private bind() {
    this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => { this.zoom = Math.max(.5, Math.min(3, this.zoom + (dy < 0 ? .1 : -.1))); this.render(); });
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { if (!this.contains(pointer)) return; if (pointer.rightButtonDown()) { this.panStart = { x: this.pan.x, y: this.pan.y, pointerX: pointer.x, pointerY: pointer.y }; return; } this.pointerStart = this.snap(this.unproject(pointer)); });
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (!this.panStart || !pointer.rightButtonDown()) return; this.pan = { x: this.panStart.x + pointer.x - this.panStart.pointerX, y: this.panStart.y + pointer.y - this.panStart.pointerY }; this.render(); });
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => { if (this.panStart) { this.panStart = undefined; return; } if (!this.pointerStart || !this.contains(pointer)) return; const end = this.snap(this.unproject(pointer)); this.drawPrimitive(this.pointerStart, end); this.pointerStart = undefined; });
  }
  private drawPrimitive(start: VectorPoint, end: VectorPoint) {
    const layer = this.model.document.layers[0]; this.history.commit(this.model.snapshot());
    if (this.tool === 'ERASER') { layer.paths.pop(); this.render(); this.changed(this.model.snapshot()); return; }
    if (this.tool === 'PICKER') { layer.style.stroke = [0x00ffff, 0xff2ec4, 0xffb44c, 0x00ff9d, 0xffff33, 0x9d4edd][Math.abs(Math.floor(end.x / 64)) % 6]; this.render(); this.changed(this.model.snapshot()); return; }
    const id = this.model.addPath(layer.id, start);
    if (this.tool === 'CIRCLE') { const radius = Math.max(2, Math.hypot(end.x - start.x, end.y - start.y)); this.model.addSegment(layer.id, id, { type: 'CUBIC', controlA: { x: start.x + radius, y: start.y - radius }, controlB: { x: start.x + radius, y: start.y + radius }, to: { x: start.x, y: start.y + radius } }); this.model.addSegment(layer.id, id, { type: 'CUBIC', controlA: { x: start.x - radius, y: start.y + radius }, controlB: { x: start.x - radius, y: start.y - radius }, to: start }); this.model.addSegment(layer.id, id, { type: 'CLOSE' }); }
    else if (this.tool === 'BOX') { this.model.addSegment(layer.id, id, { type: 'LINE', to: { x: end.x, y: start.y } }); this.model.addSegment(layer.id, id, { type: 'LINE', to: end }); this.model.addSegment(layer.id, id, { type: 'LINE', to: { x: start.x, y: end.y } }); this.model.addSegment(layer.id, id, { type: 'CLOSE' }); }
    else if (this.tool === 'BEZIER') this.model.addSegment(layer.id, id, { type: 'QUADRATIC', control: { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - Math.abs(end.x - start.x) / 3 }, to: end });
    else if (this.tool === 'BRUSH') { layer.style.width = 6; this.model.addSegment(layer.id, id, { type: 'LINE', to: end }); }
    else this.model.addSegment(layer.id, id, { type: 'LINE', to: end });
    this.render(); this.changed(this.model.snapshot());
  }
  private contains(pointer: Phaser.Input.Pointer) { return pointer.x >= this.x && pointer.x <= this.x + this.width && pointer.y >= this.y && pointer.y <= this.y + this.height; }
  private project(point: VectorPoint) { return { x: this.x + this.pan.x + point.x * this.width / this.model.document.width * this.zoom, y: this.y + this.pan.y + point.y * this.height / this.model.document.height * this.zoom }; }
  private unproject(pointer: Phaser.Input.Pointer) { return { x: (pointer.x - this.x - this.pan.x) * this.model.document.width / this.width / this.zoom, y: (pointer.y - this.y - this.pan.y) * this.model.document.height / this.height / this.zoom }; }
  private snap(point: VectorPoint) { return { x: Math.round(point.x / 8) * 8, y: Math.round(point.y / 8) * 8 }; }
}

export function drawPath(graphics: Phaser.GameObjects.Graphics, path: VectorPath, color: number, width: number, glow: number, project: (point: VectorPoint) => VectorPoint, fill?: number) {
  for (const pass of [[width + glow, .10], [width, 1]] as const) {
    const start = project(path.start); graphics.lineStyle(pass[0], color, pass[1]).beginPath().moveTo(start.x, start.y);
    for (const segment of path.segments) {
      if (segment.type === 'LINE') { const point = project(segment.to); graphics.lineTo(point.x, point.y); }
      else if (segment.type === 'QUADRATIC') { const control = project(segment.control); const point = project(segment.to); graphics.lineTo(control.x, control.y).lineTo(point.x, point.y); }
      else if (segment.type === 'CUBIC') { const a = project(segment.controlA); const b = project(segment.controlB); const point = project(segment.to); graphics.lineTo(a.x, a.y).lineTo(b.x, b.y).lineTo(point.x, point.y); }
      else graphics.lineTo(start.x, start.y);
    }
    if (fill !== undefined && path.closed && pass[1] === 1) graphics.fillStyle(fill, .25).fillPath(); graphics.strokePath();
  }
}
