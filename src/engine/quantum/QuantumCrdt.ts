import { CrdtTransportBridge } from '../../net/crdt/CrdtTransport';
import { WorldCrdt, createWorldIdentity, makeTrustedOperation, signWorldOperation, type WorldOperation } from '../../net/crdt/WorldCrdt';
import type { UnifiedTransport } from '../../net/transport/UnifiedTransport';
import type { QuantumObservation } from './QuantumStateSolver';

export function quantumCollapseOperation(observation: QuantumObservation, counter: number, actor: string, position: { x: number; y: number; z: number }): WorldOperation { return makeTrustedOperation('BODY', `quantum:${observation.id}`, counter, actor, [observation.branch, observation.probability, hashGroup(observation.entangled), counter, position.x, position.y, position.z]); }
export class QuantumMeshSync {
  readonly world: WorldCrdt; private readonly identity = createWorldIdentity(); private counter = 0; private bridge?: CrdtTransportBridge;
  constructor(world = new WorldCrdt(4096)) { this.world = world; }
  attach(transport: UnifiedTransport) { this.bridge?.close(); this.bridge = new CrdtTransportBridge(transport, this.world); }
  async publish(observation: QuantumObservation, position: { x: number; y: number; z: number }) { const identity = await this.identity, counter = ++this.counter, trusted = quantumCollapseOperation(observation, counter, identity.actor, position), operation = await signWorldOperation({ kind: trusted.kind, key: trusted.key, clock: trusted.clock, values: trusted.values, removed: false }, identity); await this.world.merge([operation]); await this.bridge?.broadcast([operation]); return operation; }
  close() { this.bridge?.close(); this.bridge = undefined; }
}
function hashGroup(ids: readonly string[]) { let hash = 2166136261; for (const id of ids) for (let index = 0; index < id.length; index++) hash = Math.imul(hash ^ id.charCodeAt(index), 16777619); return (hash >>> 0) % 1_000_000; }
