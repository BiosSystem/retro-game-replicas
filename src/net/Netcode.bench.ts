import { bench, describe } from 'vitest';
import { NetworkConditionSimulator } from './NetworkConditionSimulator';
describe('netcode packet stress', () => { bench('simulate 10000 packets with loss and jitter', () => { const simulator = new NetworkConditionSimulator<number>({ latencyMs: 120, jitterMs: 35, packetLoss: 0.08, seed: 77 }); for (let packet = 0; packet < 10000; packet++) simulator.send(packet, packet / 6); simulator.receive(3000); }, { time: 500 }); });
