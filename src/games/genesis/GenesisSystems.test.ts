import { describe, expect, it } from 'vitest';
import { GENESIS_MILESTONES, genesisStability, habitatFromTerrain } from './GenesisSystems';
describe('Neon Genesis universe', () => {
  it('maps terrain deformation into bounded habitat gradients', () => { const habitat = habitatFromTerrain(12, -8, 4); expect(Object.values(habitat).every(value => value >= 0 && value <= 1)).toBe(true); expect(habitatFromTerrain(12, -8, 0)).not.toEqual(habitat); });
  it('synthesizes fifteen prior engine milestones', () => { expect(GENESIS_MILESTONES).toHaveLength(15); expect(new Set(GENESIS_MILESTONES).size).toBe(15); });
  it('keeps 1,000 generations, entanglement, and society state stable', async () => { const result = await genesisStability(1000); expect(result.generations).toBe(1000); expect(result.fitness).toBeGreaterThan(.5); expect(result.quantumBranch).toBe(result.entangledBranch); expect(result.agents).toBe(8); expect(result.leader).toMatch(/^agent-/); });
});
