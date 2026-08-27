export interface NetInputFrame { frame: number; buttons: number; axisX: number; axisY: number; checksum: number; }

export const NET_INPUT_BYTES = 12;

export function encodeInputFrame(input: NetInputFrame) {
  const buffer = new ArrayBuffer(NET_INPUT_BYTES); const view = new DataView(buffer);
  view.setUint32(0, clampInt(input.frame, 0, 0xffffffff));
  view.setUint16(4, clampInt(input.buttons, 0, 0xffff));
  view.setInt8(6, clampInt(input.axisX, -127, 127)); view.setInt8(7, clampInt(input.axisY, -127, 127));
  view.setUint32(8, clampInt(input.checksum, 0, 0xffffffff)); return buffer;
}

export function decodeInputFrame(data: ArrayBuffer): NetInputFrame {
  if (data.byteLength !== NET_INPUT_BYTES) throw new Error('Invalid input frame length');
  const view = new DataView(data); return { frame: view.getUint32(0), buttons: view.getUint16(4), axisX: view.getInt8(6), axisY: view.getInt8(7), checksum: view.getUint32(8) };
}

export function inputChecksum(frame: number, buttons: number, axisX: number, axisY: number) {
  let value = 0x811c9dc5; for (const byte of [frame, frame >>> 8, frame >>> 16, frame >>> 24, buttons, buttons >>> 8, axisX & 255, axisY & 255]) { value ^= byte & 255; value = Math.imul(value, 0x01000193); } return value >>> 0;
}

function clampInt(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, Math.trunc(Number.isFinite(value) ? value : minimum))); }
