import { bench, describe } from 'vitest';
import { DenseQNetwork } from './DenseQNetwork';
const network = new DenseQNetwork(6, 12, 3, () => 0.51); const sensors = [0.1, -0.2, 0.7, 0.4, -0.5, 0.8];
describe('neural inference stress', () => { bench('run 10000 local ghost inferences', () => { for (let index = 0; index < 10000; index++) network.forward(sensors); }, { time: 500 }); });
