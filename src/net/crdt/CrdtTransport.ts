import { UnifiedTransport } from '../transport/UnifiedTransport';
import type { MuxPacket } from '../transport/TransportMux';
import { WorldCrdt, type WorldOperation } from './WorldCrdt';
export class CrdtTransportBridge {
  private readonly transport: UnifiedTransport; private readonly world: WorldCrdt; private readonly listener: EventListener;
  constructor(transport: UnifiedTransport, world: WorldCrdt) { this.transport = transport; this.world = world; this.listener = event => { const packet = (event as CustomEvent<MuxPacket>).detail; if (packet.channel !== 'MOD') return; void this.receive(packet.payload); }; transport.addEventListener('packet', this.listener); }
  async broadcast(operations: readonly WorldOperation[]) { for (let offset = 0; offset < operations.length; offset += 512) { const payload = new TextEncoder().encode(JSON.stringify({ type: 'WORLD_CRDT', operations: operations.slice(offset, offset + 512) })); if (payload.byteLength > 1024 * 1024) throw new Error('CRDT transport chunk exceeds 1 MiB'); await this.transport.send('MOD', payload); } }
  close() { this.transport.removeEventListener('packet', this.listener); }
  private async receive(payload: Uint8Array) { try { const value = JSON.parse(new TextDecoder().decode(payload)) as { type?: string; operations?: WorldOperation[] }; if (value.type === 'WORLD_CRDT' && Array.isArray(value.operations)) await this.world.merge(value.operations); } catch { return; } }
}
