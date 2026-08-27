import type { PeerLink } from '../PeerLink';
import { decodePacket, encodePacket, TelemetryPacer, type MuxPacket, type TransportChannel } from './TransportMux';

export type TransportKind = 'WEBTRANSPORT' | 'WEBRTC';
export interface TransportBackend {
  readonly kind: TransportKind;
  sendDatagram(data: Uint8Array): Promise<boolean>;
  sendReliable(data: Uint8Array): Promise<boolean>;
  close(): Promise<void>;
}

interface ByteWriter { write(data: Uint8Array): Promise<void>; close(): Promise<void>; releaseLock(): void; }
interface WebTransportLike {
  ready: Promise<void>;
  closed: Promise<unknown>;
  datagrams: { writable: { getWriter(): ByteWriter } };
  createBidirectionalStream(): Promise<{ writable: { getWriter(): ByteWriter } }>;
  close(): void;
}
type WebTransportConstructor = new (url: string) => WebTransportLike;

export class WebTransportBackend implements TransportBackend {
  readonly kind = 'WEBTRANSPORT' as const;
  private readonly session: WebTransportLike;
  private readonly datagrams: ByteWriter;
  private readonly stream: ByteWriter;
  private constructor(session: WebTransportLike, datagrams: ByteWriter, stream: ByteWriter) { this.session = session; this.datagrams = datagrams; this.stream = stream; }
  static async create(url: string) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('WebTransport requires an HTTPS endpoint');
    const Constructor = (globalThis as unknown as { WebTransport?: WebTransportConstructor }).WebTransport;
    if (!Constructor) return null;
    const session = new Constructor(parsed.href);
    await session.ready;
    const bidirectional = await session.createBidirectionalStream();
    return new WebTransportBackend(session, session.datagrams.writable.getWriter(), bidirectional.writable.getWriter());
  }
  async sendDatagram(data: Uint8Array) { if (data.byteLength > 1200) throw new Error('QUIC datagram exceeds 1,200 bytes'); await this.datagrams.write(data); return true; }
  async sendReliable(data: Uint8Array) { if (data.byteLength > 1024 * 1024) throw new Error('Stream frame exceeds 1 MiB'); const frame = new Uint8Array(data.byteLength + 4); new DataView(frame.buffer).setUint32(0, data.byteLength, true); frame.set(data, 4); await this.stream.write(frame); return true; }
  async close() { await this.stream.close(); this.stream.releaseLock(); this.datagrams.releaseLock(); this.session.close(); }
}

export class WebRtcFallbackBackend implements TransportBackend {
  readonly kind = 'WEBRTC' as const;
  private readonly peer: Pick<PeerLink, 'sendTransportDatagram' | 'sendTransportReliable'>;
  constructor(peer: Pick<PeerLink, 'sendTransportDatagram' | 'sendTransportReliable'>) { this.peer = peer; }
  async sendDatagram(data: Uint8Array) { return this.peer.sendTransportDatagram(data); }
  async sendReliable(data: Uint8Array) { return this.peer.sendTransportReliable(data); }
  async close() {}
}

export class UnifiedTransport extends EventTarget {
  private readonly pacer = new TelemetryPacer();
  private sequence = 0;
  readonly backend: TransportBackend;
  constructor(backend: TransportBackend) { super(); this.backend = backend; }
  static async connect(webTransportUrl: string | undefined, fallback: TransportBackend) {
    if (webTransportUrl) {
      try { const backend = await WebTransportBackend.create(webTransportUrl); if (backend) return new UnifiedTransport(backend); } catch { /* Use the established peer path. */ }
    }
    return new UnifiedTransport(fallback);
  }
  async send(channel: TransportChannel, payload: Uint8Array, nowMs = performance.now()) {
    const reliable = channel !== 'TELEMETRY';
    if (!reliable && !this.pacer.allow(nowMs)) return false;
    const packet = encodePacket(channel, this.sequence++, payload);
    return reliable ? this.backend.sendReliable(packet) : this.backend.sendDatagram(packet);
  }
  receive(data: Uint8Array, reliable: boolean) { const packet = decodePacket(data, reliable); this.dispatchEvent(new CustomEvent<MuxPacket>('packet', { detail: packet })); return packet; }
  close() { return this.backend.close(); }
}
