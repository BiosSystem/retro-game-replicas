import { describe, expect, it } from 'vitest';
import { WorldCrdt } from '../../net/crdt/WorldCrdt';
import { QuantumMeshSync, quantumCollapseOperation } from './QuantumCrdt';
import { QuantumStateSolver, equalSuperposition } from './QuantumStateSolver';
const actor = '5155414e54554d31';
describe('game quantum state solver', () => {
  it('preserves normalized probabilities during unitary phase evolution', () => { const solver = new QuantumStateSolver(7); solver.add(equalSuperposition('ore', 8)); for (let step = 0; step < 100; step++) solver.evolve(1 / 60); expect(solver.probabilities('ore').reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6); });
  it('collapses only inside camera observation range', () => { const solver = new QuantumStateSolver(2); solver.add(equalSuperposition('gate', 4, { x: 10, y: 0, z: 0 })); expect(solver.observe('gate', { x: 100, y: 0, z: 0 }, 5)).toBeUndefined(); expect(solver.observe('gate', { x: 10, y: 0, z: 0 }, 5)?.branch).toBeTypeOf('number'); });
  it('correlates entangled branches and converges collapse records', () => { const solver = new QuantumStateSolver(9); solver.add(equalSuperposition('a', 4)); solver.add(equalSuperposition('b', 4)); solver.entangle('pair', ['a', 'b']); const observed = solver.observe('a', { x: 0, y: 0, z: 0 })!; expect(solver.get('b').collapsed).toBe(observed.branch); const operation = quantumCollapseOperation(observed, 1, actor, { x: 0, y: 0, z: 0 }), left = new WorldCrdt(), right = new WorldCrdt(); left.mergeTrusted([operation]); right.mergeTrusted([operation]); expect(left.digest()).toBe(right.digest()); });
  it('publishes a signed collapse into the connected-world state', async () => { const solver = new QuantumStateSolver(13), sync = new QuantumMeshSync(); solver.add(equalSuperposition('mesh', 2)); const operation = await sync.publish(solver.observe('mesh', { x: 0, y: 0, z: 0 })!, { x: 1, y: 2, z: 3 }); expect(operation.signature.length).toBeGreaterThan(32); expect(sync.world.get('quantum:mesh')?.values.slice(4)).toEqual([1, 2, 3]); });
});
