import { bench, describe } from 'vitest';
import { createPopulation, evolvePopulation } from './GeneticEngine';
const population = createPopulation(4096, 11), habitat = { temperature: .7, moisture: .4, fluid: .3, elevation: .6 };
describe('genetic crossover and mutation', () => { bench('evolve 4,096 genomes', () => { evolvePopulation(population, habitat, 12, .08); }, { time: 500 }); });
