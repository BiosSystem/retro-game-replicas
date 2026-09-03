import { CABINET_SLOTS, SYMMETRY_MODES, type VectorArtDocument, type VectorLayer, type VectorPath, type VectorSegment } from './VectorArtModel';
import { asBytes, hasBytes, viewOf } from '../../utils/binary';

const MAGIC = 0x4e415254; const VERSION = 1; const HEADER_BYTES = 12; const LAYER_BYTES = 16;
const SEGMENT_BYTES = { LINE: 5, QUADRATIC: 9, CUBIC: 13, CLOSE: 1 } as const;
export class DecalCodecError extends Error {}

export function encodeDecal(document: VectorArtDocument): ArrayBuffer {
  validateDocument(document); const buffer = new ArrayBuffer(byteLength(document)); const view = new DataView(buffer); let offset = 0;
  view.setUint32(offset, MAGIC); offset += 4; view.setUint8(offset++, VERSION); view.setUint16(offset, document.width); offset += 2; view.setUint16(offset, document.height); offset += 2; view.setUint8(offset++, SYMMETRY_MODES.indexOf(document.symmetry)); view.setUint8(offset++, document.layers.length); view.setUint8(offset++, 0);
  for (const layer of document.layers) {
    view.setUint16(offset, layer.id); offset += 2; view.setUint8(offset++, CABINET_SLOTS.indexOf(layer.slot)); view.setUint8(offset++, layer.visible ? 1 : 0); view.setUint32(offset, layer.style.stroke); offset += 4; view.setUint32(offset, layer.style.fill ?? 0xffffffff); offset += 4; view.setUint8(offset++, layer.style.width); view.setUint8(offset++, layer.style.glow); view.setUint16(offset, layer.paths.length); offset += 2;
    for (const path of layer.paths) offset = encodePath(view, offset, path);
  }
  return buffer;
}

export function decodeDecal(source: ArrayBuffer | Uint8Array): VectorArtDocument {
  const bytes = asBytes(source); const view = viewOf(bytes); requireBytes(bytes, 0, HEADER_BYTES);
  let offset = 0; if (view.getUint32(offset) !== MAGIC) throw new DecalCodecError(); offset += 4; if (view.getUint8(offset++) !== VERSION) throw new DecalCodecError();
  const width = view.getUint16(offset); offset += 2; const height = view.getUint16(offset); offset += 2; const symmetry = SYMMETRY_MODES[view.getUint8(offset++)]; const layerCount = view.getUint8(offset++); offset += 1;
  if (!width || !height || !symmetry || layerCount === 0) throw new DecalCodecError(); const layers: VectorLayer[] = [];
  for (let index = 0; index < layerCount; index += 1) {
    requireBytes(bytes, offset, LAYER_BYTES); const id = view.getUint16(offset); offset += 2; const slot = CABINET_SLOTS[view.getUint8(offset++)]; const visible = view.getUint8(offset++) === 1; const stroke = view.getUint32(offset); offset += 4; const fillRaw = view.getUint32(offset); offset += 4; const widthStyle = view.getUint8(offset++); const glow = view.getUint8(offset++); const pathCount = view.getUint16(offset); offset += 2;
    if (!slot || widthStyle < 1 || widthStyle > 16) throw new DecalCodecError(); const paths: VectorPath[] = [];
    for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) { const decoded = decodePath(view, bytes, offset); paths.push(decoded.path); offset = decoded.offset; }
    layers.push({ id, slot, visible, style: { stroke, ...(fillRaw === 0xffffffff ? {} : { fill: fillRaw }), width: widthStyle, glow }, paths });
  }
  if (offset !== bytes.length) throw new DecalCodecError(); return { width, height, symmetry, layers };
}

function byteLength(document: VectorArtDocument) { return HEADER_BYTES + document.layers.reduce((total, layer) => total + LAYER_BYTES + layer.paths.reduce((pathTotal, path) => pathTotal + 9 + path.segments.reduce((segmentTotal, segment) => segmentTotal + SEGMENT_BYTES[segment.type], 0), 0), 0); }
function encodePath(view: DataView, offset: number, path: VectorPath) {
  view.setUint16(offset, path.id); offset += 2; view.setUint8(offset++, path.closed ? 1 : 0); view.setUint16(offset, path.segments.length); offset += 2; offset = point(view, offset, path.start);
  for (const segment of path.segments) {
    view.setUint8(offset++, segmentCode(segment)); if (segment.type === 'LINE') offset = point(view, offset, segment.to); else if (segment.type === 'QUADRATIC') { offset = point(view, offset, segment.control); offset = point(view, offset, segment.to); } else if (segment.type === 'CUBIC') { offset = point(view, offset, segment.controlA); offset = point(view, offset, segment.controlB); offset = point(view, offset, segment.to); }
  }
  return offset;
}
function decodePath(view: DataView, bytes: Uint8Array, offset: number) {
  requireBytes(bytes, offset, 9); const id = view.getUint16(offset); offset += 2; const closed = view.getUint8(offset++) === 1; const count = view.getUint16(offset); offset += 2; const start = readPoint(view, offset); offset += 4; const segments: VectorSegment[] = [];
  for (let index = 0; index < count; index += 1) { requireBytes(bytes, offset, 1); const code = view.getUint8(offset++); if (code === 1) { requireBytes(bytes, offset, 4); segments.push({ type: 'LINE', to: readPoint(view, offset) }); offset += 4; } else if (code === 2) { requireBytes(bytes, offset, 8); segments.push({ type: 'QUADRATIC', control: readPoint(view, offset), to: readPoint(view, offset + 4) }); offset += 8; } else if (code === 3) { requireBytes(bytes, offset, 12); segments.push({ type: 'CUBIC', controlA: readPoint(view, offset), controlB: readPoint(view, offset + 4), to: readPoint(view, offset + 8) }); offset += 12; } else if (code === 4) segments.push({ type: 'CLOSE' }); else throw new DecalCodecError(); }
  return { path: { id, start, segments, closed }, offset };
}
function point(view: DataView, offset: number, value: { x: number; y: number }) { view.setUint16(offset, value.x); view.setUint16(offset + 2, value.y); return offset + 4; }
function readPoint(view: DataView, offset: number) { return { x: view.getUint16(offset), y: view.getUint16(offset + 2) }; }
function segmentCode(segment: VectorSegment) { return segment.type === 'LINE' ? 1 : segment.type === 'QUADRATIC' ? 2 : segment.type === 'CUBIC' ? 3 : 4; }
function requireBytes(bytes: Uint8Array, offset: number, count: number) { if (!hasBytes(bytes, offset, count)) throw new DecalCodecError(); }
function validateDocument(document: VectorArtDocument) {
  if (!Number.isInteger(document.width) || !Number.isInteger(document.height) || document.width < 1 || document.height < 1 || document.width > 65535 || document.height > 65535 || !SYMMETRY_MODES.includes(document.symmetry) || document.layers.length < 1 || document.layers.length > 255) throw new DecalCodecError();
  for (const layer of document.layers) { if (!CABINET_SLOTS.includes(layer.slot) || !Number.isInteger(layer.style.width) || layer.style.width < 1 || layer.style.width > 16 || !Number.isInteger(layer.style.glow) || layer.style.glow < 0 || layer.style.glow > 255 || layer.paths.length > 65535) throw new DecalCodecError(); }
}
