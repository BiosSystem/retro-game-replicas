import { expect, it } from 'vitest';
import { garbageSirenState, GlassShardEmitter, ReactiveGridPulse } from './TetrisPulseEffects';

it('maps garbage queues to bounded siren states', () => {
  expect([0, 1, 3, 6].map(garbageSirenState)).toEqual(['OFF', 'WATCH', 'ALERT', 'CRITICAL']);
});

it('decays grid pulses and expires shard emitters', () => {
  const pulse = new ReactiveGridPulse(); pulse.trigger(); expect(pulse.update(360)).toBe(0);
  const shards = new GlassShardEmitter(); shards.emit(100, 50); expect(shards.update(120)).toBe(true); expect(shards.update(150)).toBe(false);
});
