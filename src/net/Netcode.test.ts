import { describe, expect, it } from 'vitest';
import { decodeInputFrame, encodeInputFrame, inputChecksum, type NetInputFrame } from './InputCodec';
import { NetworkConditionSimulator } from './NetworkConditionSimulator';
import { decodeRoom, encodeRoom } from './PeerLink';
import { RollbackSession, type RollbackAdapter } from './RollbackSession';

interface State { position: number; }
const adapter: RollbackAdapter<State> = { clone: state => ({ ...state }), step: (state, local, remote) => ({ position: state.position + local.axisX + remote.axisX }), checksum: state => state.position >>> 0 };
const frame = (number: number, axisX: number): NetInputFrame => ({ frame: number, buttons: 0, axisX, axisY: 0, checksum: inputChecksum(number, 0, axisX, 0) });

describe('enterprise netcode', () => {
  it('serializes fixed-width deterministic input frames', () => { const input = frame(42, -60); expect(decodeInputFrame(encodeInputFrame(input))).toEqual(input); expect(() => decodeInputFrame(new ArrayBuffer(2))).toThrow('length'); });
  it('rolls back predicted state when late remote input arrives', () => { const session = new RollbackSession({ position: 0 }, adapter); session.advance(frame(1, 1)); session.advance(frame(2, 1)); expect(session.snapshot().state.position).toBe(2); expect(session.receiveRemote(frame(1, 3))).toBe(true); expect(session.snapshot()).toMatchObject({ state: { position: 8 }, rollbacks: 1 }); });
  it('simulates deterministic latency, jitter, and packet loss', () => { const a = new NetworkConditionSimulator<number>({ latencyMs: 100, jitterMs: 20, packetLoss: 0.25, seed: 9 }); const b = new NetworkConditionSimulator<number>({ latencyMs: 100, jitterMs: 20, packetLoss: 0.25, seed: 9 }); for (let value = 0; value < 100; value++) { a.send(value, 0); b.send(value, 0); } expect(a.receive(200)).toEqual(b.receive(200)); expect(a.stats().dropped).toBeGreaterThan(0); });
  it('round-trips bounded manual signaling codes', () => { const code = encodeRoom({ version: 1, description: { type: 'offer', sdp: 'v=0\r\n' } }); expect(decodeRoom(code).description.type).toBe('offer'); expect(() => decodeRoom('bad')).toThrow('Invalid'); });
});
