export const CABINET_SLOTS = ['SIDE_LEFT', 'SIDE_RIGHT', 'MARQUEE', 'CONTROL_PANEL'] as const;
export type CabinetSlot = (typeof CABINET_SLOTS)[number];
export const SYMMETRY_MODES = ['NONE', 'X', 'Y', 'BOTH'] as const;
export type SymmetryMode = (typeof SYMMETRY_MODES)[number];

export interface VectorPoint { x: number; y: number; }
export type VectorSegment =
  | { type: 'LINE'; to: VectorPoint }
  | { type: 'QUADRATIC'; control: VectorPoint; to: VectorPoint }
  | { type: 'CUBIC'; controlA: VectorPoint; controlB: VectorPoint; to: VectorPoint }
  | { type: 'CLOSE' };
export interface VectorPath { id: number; start: VectorPoint; segments: VectorSegment[]; closed: boolean; }
export interface VectorStyle { stroke: number; fill?: number; width: number; glow: number; }
export interface VectorLayer { id: number; slot: CabinetSlot; visible: boolean; style: VectorStyle; paths: VectorPath[]; }
export interface VectorArtDocument { width: number; height: number; symmetry: SymmetryMode; layers: VectorLayer[]; }
export interface VectorBounds { minX: number; minY: number; maxX: number; maxY: number; }

export class VectorArtModel {
  readonly document: VectorArtDocument;
  private nextPathId = 1;

  constructor(document: VectorArtDocument = createVectorDocument()) {
    this.document = cloneDocument(document);
    this.nextPathId = Math.max(0, ...this.document.layers.flatMap(layer => layer.paths.map(path => path.id))) + 1;
  }

  snapshot() { return cloneDocument(this.document); }
  setSymmetry(symmetry: SymmetryMode) { this.document.symmetry = symmetry; }
  layer(id: number) { const layer = this.document.layers.find(item => item.id === id); if (!layer) throw new Error(`Unknown vector layer ${id}`); return layer; }
  addPath(layerId: number, start: VectorPoint) {
    const path: VectorPath = { id: this.nextPathId++, start: { x: Math.round(start.x), y: Math.round(start.y) }, segments: [], closed: false };
    this.layer(layerId).paths.push(path); return path.id;
  }
  addSegment(layerId: number, pathId: number, segment: VectorSegment) {
    const path = this.layer(layerId).paths.find(item => item.id === pathId); if (!path) throw new Error(`Unknown vector path ${pathId}`);
    path.segments.push(structuredClone(segment)); if (segment.type === 'CLOSE') path.closed = true;
  }
  mirrored(path: VectorPath) {
    const result = [path];
    if (this.document.symmetry === 'X' || this.document.symmetry === 'BOTH') result.push(mirrorPath(path, this.document.width, false));
    if (this.document.symmetry === 'Y' || this.document.symmetry === 'BOTH') result.push(mirrorPath(path, this.document.height, true));
    if (this.document.symmetry === 'BOTH') result.push(mirrorPath(mirrorPath(path, this.document.width, false), this.document.height, true));
    return result;
  }
}

export function createVectorDocument(): VectorArtDocument {
  return { width: 640, height: 480, symmetry: 'NONE', layers: [{ id: 1, slot: 'MARQUEE', visible: true, style: { stroke: 0x00ffff, width: 2, glow: 10 }, paths: [] }] };
}

export function pathBounds(path: VectorPath): VectorBounds {
  const points = [path.start, ...path.segments.flatMap(segment => segmentPoints(segment))];
  return points.reduce<VectorBounds>((bounds, point) => ({ minX: Math.min(bounds.minX, point.x), minY: Math.min(bounds.minY, point.y), maxX: Math.max(bounds.maxX, point.x), maxY: Math.max(bounds.maxY, point.y) }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

export function quadraticPoint(start: VectorPoint, control: VectorPoint, end: VectorPoint, t: number): VectorPoint {
  const u = 1 - clampUnit(t); return { x: u * u * start.x + 2 * u * t * control.x + t * t * end.x, y: u * u * start.y + 2 * u * t * control.y + t * t * end.y };
}

export function cubicPoint(start: VectorPoint, a: VectorPoint, b: VectorPoint, end: VectorPoint, t: number): VectorPoint {
  const u = 1 - clampUnit(t); return { x: u ** 3 * start.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t ** 3 * end.x, y: u ** 3 * start.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t ** 3 * end.y };
}

export function cloneDocument(document: VectorArtDocument): VectorArtDocument { return structuredClone(document); }
function clampUnit(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
function segmentPoints(segment: VectorSegment) { return segment.type === 'LINE' ? [segment.to] : segment.type === 'QUADRATIC' ? [segment.control, segment.to] : segment.type === 'CUBIC' ? [segment.controlA, segment.controlB, segment.to] : []; }
function mirrorPoint(point: VectorPoint, dimension: number, vertical: boolean): VectorPoint { return vertical ? { x: point.x, y: dimension - point.y } : { x: dimension - point.x, y: point.y }; }
function mirrorPath(path: VectorPath, dimension: number, vertical: boolean): VectorPath {
  return { id: path.id, closed: path.closed, start: mirrorPoint(path.start, dimension, vertical), segments: path.segments.map(segment => segment.type === 'LINE' ? { type: 'LINE', to: mirrorPoint(segment.to, dimension, vertical) } : segment.type === 'QUADRATIC' ? { type: 'QUADRATIC', control: mirrorPoint(segment.control, dimension, vertical), to: mirrorPoint(segment.to, dimension, vertical) } : segment.type === 'CUBIC' ? { type: 'CUBIC', controlA: mirrorPoint(segment.controlA, dimension, vertical), controlB: mirrorPoint(segment.controlB, dimension, vertical), to: mirrorPoint(segment.to, dimension, vertical) } : segment) };
}
