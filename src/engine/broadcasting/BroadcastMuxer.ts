export type BroadcastTrack = 'video' | 'audio';
export interface EncodedChunkLike { type: 'key' | 'delta'; timestamp: number; duration?: number | null; byteLength: number; copyTo(destination: AllowSharedBufferSource): void; }
export interface BroadcastPacket { track: BroadcastTrack; codec: string; timestamp: number; duration: number; key: boolean; payload: Uint8Array<ArrayBuffer>; }

const MAGIC = [0x4e, 0x53, 0x42, 0x31];

export function muxBroadcastChunk(track: BroadcastTrack, codec: string, chunk: EncodedChunkLike): Uint8Array<ArrayBuffer> {
  const codecBytes = new TextEncoder().encode(codec);
  if (codecBytes.length > 31 || chunk.byteLength > 16_777_216) throw new Error('Broadcast chunk is outside the framing limit');
  const payload = new Uint8Array(chunk.byteLength); chunk.copyTo(payload);
  const bytes = new Uint8Array(27 + codecBytes.length + payload.length);
  bytes.set(MAGIC); const view = new DataView(bytes.buffer);
  view.setUint8(4, track === 'video' ? 1 : 2); view.setUint8(5, chunk.type === 'key' ? 1 : 0); view.setUint8(6, codecBytes.length);
  view.setFloat64(7, chunk.timestamp); view.setFloat64(15, chunk.duration ?? 0); view.setUint32(23, payload.length);
  bytes.set(codecBytes, 27); bytes.set(payload, 27 + codecBytes.length); return bytes;
}

export function demuxBroadcastChunk(bytes: Uint8Array<ArrayBuffer>): BroadcastPacket {
  if (bytes.length < 27 || MAGIC.some((value, index) => bytes[index] !== value)) throw new Error('Invalid broadcast frame');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); const codecLength = view.getUint8(6); const payloadLength = view.getUint32(23);
  if (27 + codecLength + payloadLength !== bytes.length) throw new Error('Truncated broadcast frame');
  return { track: view.getUint8(4) === 1 ? 'video' : 'audio', key: view.getUint8(5) === 1, codec: new TextDecoder().decode(bytes.slice(27, 27 + codecLength)), timestamp: view.getFloat64(7), duration: view.getFloat64(15), payload: bytes.slice(27 + codecLength) };
}
