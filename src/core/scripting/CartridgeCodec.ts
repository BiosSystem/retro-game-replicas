import { asBytes, decodeUtf8, encodeUtf8, hasBytes, viewOf } from '../utils/binary';

export const NEON_CARTRIDGE_MAGIC = 0x4e454f4e;
const FORMAT_VERSION = 1;
const MAX_SEGMENT_BYTES = 65535;

export interface NeonCartridgeAsset { id: number; data: Uint8Array; }
export interface NeonCartridgeMetadata { title: string; author: string; version: string; targetTickRate: number; }
export interface NeonCartridge { metadata: NeonCartridgeMetadata; bytecode: Uint8Array; vectorAssets: NeonCartridgeAsset[]; audioPatterns: NeonCartridgeAsset[]; }
export class CartridgeCodecError extends Error { constructor() { super('Invalid neongame cartridge'); } }

export function encodeCartridge(cartridge: NeonCartridge): ArrayBuffer {
  validateCartridge(cartridge);
  const title = encodeUtf8(cartridge.metadata.title); const author = encodeUtf8(cartridge.metadata.author); const version = encodeUtf8(cartridge.metadata.version);
  const size = 16 + title.length + author.length + version.length + cartridge.bytecode.length + assetBytes(cartridge.vectorAssets) + assetBytes(cartridge.audioPatterns) + 4;
  const buffer = new ArrayBuffer(size); const bytes = new Uint8Array(buffer); const view = new DataView(buffer); let offset = 0;
  view.setUint32(offset, NEON_CARTRIDGE_MAGIC); offset += 4; view.setUint8(offset++, FORMAT_VERSION); view.setUint16(offset, cartridge.metadata.targetTickRate, true); offset += 2;
  view.setUint8(offset++, title.length); view.setUint8(offset++, author.length); view.setUint8(offset++, version.length); view.setUint32(offset, cartridge.bytecode.length, true); offset += 4; view.setUint8(offset++, cartridge.vectorAssets.length); view.setUint8(offset++, cartridge.audioPatterns.length);
  bytes.set(title, offset); offset += title.length; bytes.set(author, offset); offset += author.length; bytes.set(version, offset); offset += version.length; bytes.set(cartridge.bytecode, offset); offset += cartridge.bytecode.length;
  offset = writeAssets(view, bytes, offset, cartridge.vectorAssets); offset = writeAssets(view, bytes, offset, cartridge.audioPatterns);
  view.setUint32(offset, checksum(bytes.subarray(0, offset)), true); return buffer;
}

export function decodeCartridge(source: ArrayBuffer | Uint8Array): NeonCartridge {
  const bytes = asBytes(source); const view = viewOf(bytes);
  try {
    requireBytes(bytes, 0, 20); let offset = 0; if (view.getUint32(offset) !== NEON_CARTRIDGE_MAGIC) throw new CartridgeCodecError(); offset += 4; if (view.getUint8(offset++) !== FORMAT_VERSION) throw new CartridgeCodecError();
    const targetTickRate = view.getUint16(offset, true); offset += 2; const titleLength = view.getUint8(offset++); const authorLength = view.getUint8(offset++); const versionLength = view.getUint8(offset++); const bytecodeLength = view.getUint32(offset, true); offset += 4; const vectorCount = view.getUint8(offset++); const audioCount = view.getUint8(offset++);
    const strings = titleLength + authorLength + versionLength; requireBytes(bytes, offset, strings + bytecodeLength + 4); const title = decodeUtf8(bytes.subarray(offset, offset += titleLength)); const author = decodeUtf8(bytes.subarray(offset, offset += authorLength)); const version = decodeUtf8(bytes.subarray(offset, offset += versionLength)); const bytecode = bytes.subarray(offset, offset += bytecodeLength);
    const vectorAssets = readAssets(view, bytes, vectorCount, () => offset, value => { offset = value; }); const audioPatterns = readAssets(view, bytes, audioCount, () => offset, value => { offset = value; }); requireBytes(bytes, offset, 4); if (offset + 4 !== bytes.length || view.getUint32(offset, true) !== checksum(bytes.subarray(0, offset))) throw new CartridgeCodecError();
    const cartridge = { metadata: { title, author, version, targetTickRate }, bytecode, vectorAssets, audioPatterns }; validateCartridge(cartridge); return cartridge;
  } catch (error) { if (error instanceof CartridgeCodecError) throw error; throw new CartridgeCodecError(); }
}

function assetBytes(assets: NeonCartridgeAsset[]) { return assets.reduce((total, asset) => total + 4 + asset.data.length, 0); }
function writeAssets(view: DataView, bytes: Uint8Array, offset: number, assets: NeonCartridgeAsset[]) { for (const asset of assets) { view.setUint16(offset, asset.id, true); offset += 2; view.setUint16(offset, asset.data.length, true); offset += 2; bytes.set(asset.data, offset); offset += asset.data.length; } return offset; }
function readAssets(view: DataView, bytes: Uint8Array, count: number, getOffset: () => number, setOffset: (value: number) => void) { const assets: NeonCartridgeAsset[] = []; let offset = getOffset(); for (let index = 0; index < count; index += 1) { requireBytes(bytes, offset, 4); const id = view.getUint16(offset, true); offset += 2; const length = view.getUint16(offset, true); offset += 2; requireBytes(bytes, offset, length); assets.push({ id, data: bytes.subarray(offset, offset += length) }); } setOffset(offset); return assets; }
function checksum(bytes: Uint8Array) { let hash = 0x811c9dc5; for (const byte of bytes) { hash ^= byte; hash = Math.imul(hash, 0x01000193); } return hash >>> 0; }
function requireBytes(bytes: Uint8Array, offset: number, length: number) { if (!hasBytes(bytes, offset, length)) throw new CartridgeCodecError(); }
function validateCartridge(cartridge: NeonCartridge) {
  const { metadata } = cartridge; if (!Number.isInteger(metadata.targetTickRate) || metadata.targetTickRate < 1 || metadata.targetTickRate > 1000 || !metadata.title || metadata.title.length > 255 || metadata.author.length > 255 || metadata.version.length > 255 || cartridge.bytecode.length > 1024 * 1024 || cartridge.vectorAssets.length > 255 || cartridge.audioPatterns.length > 255) throw new CartridgeCodecError();
  for (const asset of [...cartridge.vectorAssets, ...cartridge.audioPatterns]) if (!Number.isInteger(asset.id) || asset.id < 0 || asset.id > 65535 || asset.data.length > MAX_SEGMENT_BYTES) throw new CartridgeCodecError();
}
