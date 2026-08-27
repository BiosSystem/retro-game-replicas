export type TransportChannel = 'TELEMETRY' | 'REPLAY' | 'MOD';
export interface MuxPacket { channel: TransportChannel; sequence: number; payload: Uint8Array; reliable: boolean; }

const CHANNEL_IDS: Record<TransportChannel, number> = { TELEMETRY: 1, REPLAY: 2, MOD: 3 };
const CHANNEL_NAMES: Record<number, TransportChannel | undefined> = { 1: 'TELEMETRY', 2: 'REPLAY', 3: 'MOD' };

export function encodePacket(channel: TransportChannel, sequence: number, payload: Uint8Array) {
  const limit = channel === 'TELEMETRY' ? 1191 : 1024 * 1024;
  if (payload.byteLength > limit) throw new Error(`${channel} payload exceeds ${limit} bytes`);
  const output = new Uint8Array(payload.byteLength + 9);
  const view = new DataView(output.buffer);
  output[0] = CHANNEL_IDS[channel];
  view.setUint32(1, sequence >>> 0, true);
  view.setUint32(5, payload.byteLength, true);
  output.set(payload, 9);
  return output;
}

export function decodePacket(data: Uint8Array, reliable: boolean): MuxPacket {
  if (data.byteLength < 9) throw new Error('Transport packet is truncated');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const channel = CHANNEL_NAMES[data[0]];
  const size = view.getUint32(5, true);
  if (!channel || size !== data.byteLength - 9) throw new Error('Transport packet is invalid');
  if (channel === 'TELEMETRY' && reliable) throw new Error('Telemetry must use the unreliable channel');
  if (channel !== 'TELEMETRY' && !reliable) throw new Error('Replay and mod data require a reliable stream');
  return { channel, sequence: view.getUint32(1, true), payload: data.slice(9), reliable };
}

export class TelemetryPacer {
  private lastSent = -Infinity;
  allow(nowMs: number) {
    if (!Number.isFinite(nowMs) || nowMs - this.lastSent < 1000 / 120) return false;
    this.lastSent = nowMs;
    return true;
  }
}
