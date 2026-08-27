import { describe, expect, it, vi } from 'vitest';
import { decodePacket, encodePacket, TelemetryPacer } from './TransportMux';
import { UnifiedTransport, type TransportBackend } from './UnifiedTransport';

describe('unified transport', () => {
  it('multiplexes telemetry and reliable content with validation', () => {
    const telemetry = encodePacket('TELEMETRY', 8, Uint8Array.of(1, 2));
    expect(decodePacket(telemetry, false)).toMatchObject({ channel: 'TELEMETRY', sequence: 8 });
    const replay = encodePacket('REPLAY', 9, Uint8Array.of(3));
    expect(decodePacket(replay, true).payload).toEqual(Uint8Array.of(3));
    expect(() => decodePacket(replay, false)).toThrow();
    const large = new Uint8Array(70_000); large[69_999] = 7;
    expect(decodePacket(encodePacket('MOD', 10, large), true).payload[69_999]).toBe(7);
  });
  it('paces avatar telemetry at no more than 120 Hz', () => {
    const pacer = new TelemetryPacer();
    expect(pacer.allow(0)).toBe(true);
    expect(pacer.allow(8)).toBe(false);
    expect(pacer.allow(9)).toBe(true);
  });
  it('routes unreliable telemetry and reliable replay frames', async () => {
    const sendDatagram = vi.fn(async () => true), sendReliable = vi.fn(async () => true);
    const backend: TransportBackend = { kind: 'WEBRTC', sendDatagram, sendReliable, close: async () => {} };
    const transport = new UnifiedTransport(backend);
    await transport.send('TELEMETRY', Uint8Array.of(1), 0);
    await transport.send('REPLAY', Uint8Array.of(2), 1);
    expect(sendDatagram).toHaveBeenCalledOnce();
    expect(sendReliable).toHaveBeenCalledOnce();
  });
});
