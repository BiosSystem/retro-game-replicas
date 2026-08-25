import { describe, expect, it } from 'vitest';
import { GENETIC_FITNESS_WGSL, geneticDispatchSize } from './GeneticCompute';
import { GeneticEcosystem, createPopulation, evolvePopulation, genomeFitness } from './GeneticEngine';
const habitat = { temperature: .8, moisture: .3, fluid: .2, elevation: .7 };
describe('genetic ecosystem', () => {
  it('reproduces deterministic crossover and mutation', () => { const source = createPopulation(128, 7), a = evolvePopulation(source, habitat, 9), b = evolvePopulation(source, habitat, 9); expect([...a.population]).toEqual([...b.population]); expect(a.bestFitness).toBeGreaterThan(0); });
  it('selects genomes adapted to terrain gradients', () => { const adapted = Float32Array.of(.8,.3,.2,.7,.5,.5,.2,.5), hostile = Float32Array.of(0,1,1,0,.5,.5,.2,.5); expect(genomeFitness(adapted, habitat)).toBeGreaterThan(genomeFitness(hostile, habitat)); });
  it('remains bounded across 1,000 generations', () => { const ecosystem = new GeneticEcosystem(32, 4); let result = ecosystem.evolve(habitat); for (let generation = 1; generation < 1000; generation++) result = ecosystem.evolve(habitat); expect(result.generation).toBe(1000); expect([...result.population].every(value => value >= 0 && value <= 1)).toBe(true); expect(result.meanFitness).toBeGreaterThan(.5); });
  it('publishes a bounded WebGPU fitness contract', () => { expect(geneticDispatchSize(4096)).toBe(64); expect(geneticDispatchSize(1e9)).toBe(64); expect(GENETIC_FITNESS_WGSL).toContain('@workgroup_size(64)'); });
});
