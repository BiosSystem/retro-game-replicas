import { bench, describe } from 'vitest';
import { generateNeuralTerrain } from './NeuralTerrain';
describe('neural terrain throughput', () => { bench('generate 65,536 deterministic terrain samples', () => { for (let index = 0; index < 4; index++) generateNeuralTerrain(101, index, -index, 128); }); });
