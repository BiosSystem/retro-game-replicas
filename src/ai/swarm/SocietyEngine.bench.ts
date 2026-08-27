import { bench, describe } from 'vitest';
import { SwarmSociety } from './SocietyEngine';
describe('local society inference', () => { bench('run one 24-agent INT4 conversation round', async () => { const society = new SwarmSociety(24, 8); await society.runRound('portal resource trade'); }, { time: 500 }); });
