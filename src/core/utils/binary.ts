const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function asBytes(source: ArrayBuffer | Uint8Array) {
  return source instanceof Uint8Array ? source : new Uint8Array(source);
}

export function viewOf(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export function encodeUtf8(value: string) { return encoder.encode(value); }
export function decodeUtf8(value: Uint8Array) { return decoder.decode(value); }
export function hasBytes(bytes: Uint8Array, offset: number, count: number) { return offset >= 0 && count >= 0 && offset + count <= bytes.length; }
