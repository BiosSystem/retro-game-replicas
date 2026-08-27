import type { UnifiedTransport } from '../transport/UnifiedTransport';
import type { MuxPacket } from '../transport/TransportMux';
import { decodeShardEnvelope, encodeShardEnvelope, type ShardEnvelope } from './SpatialShardMesh';

export class ShardTransportBridge {
  private readonly listener: EventListener;
  private readonly transport: UnifiedTransport;
  private readonly onState: (envelope: ShardEnvelope) => void;
  constructor(transport: UnifiedTransport, onState: (envelope: ShardEnvelope) => void) { this.transport = transport; this.onState = onState; this.listener = event => { const packet = (event as CustomEvent<MuxPacket>).detail; if (packet.channel !== 'MOD') return; try { this.onState(decodeShardEnvelope(packet.payload)); } catch { return; } }; transport.addEventListener('packet', this.listener); }
  async broadcast(envelope: ShardEnvelope): Promise<boolean> { return this.transport.send('MOD', encodeShardEnvelope(envelope)); }
  close(): void { this.transport.removeEventListener('packet', this.listener); }
}
