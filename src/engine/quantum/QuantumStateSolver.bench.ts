import { bench, describe } from 'vitest';
import { QuantumStateSolver, equalSuperposition } from './QuantumStateSolver';
describe('quantum game-state collapse', () => { bench('calculate 10,000 camera collapses', () => { for (let index = 0; index < 10_000; index++) { const solver = new QuantumStateSolver(index); solver.add(equalSuperposition(`q:${index}`, 8)); solver.observe(`q:${index}`, { x: 0, y: 0, z: 0 }); } }, { time: 500 }); });
