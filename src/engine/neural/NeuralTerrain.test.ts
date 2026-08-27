import { describe, expect, it } from 'vitest';
import { generateNeuralTerrain, sampleNeuralTerrain } from './NeuralTerrain';

describe('fixed-point neural terrain', () => {
  it('generates identical chunks from identical seed coordinates', () => { const a = generateNeuralTerrain(71, 4, -3), b = generateNeuralTerrain(71, 4, -3); expect(a.checksum).toBe(b.checksum); expect(a.elevation).toEqual(b.elevation); });
  it('changes geological fields across seeds and coordinates', () => { expect(generateNeuralTerrain(71, 0, 0).checksum).not.toBe(generateNeuralTerrain(72, 0, 0).checksum); expect(sampleNeuralTerrain(71, 0, 0)).not.toEqual(sampleNeuralTerrain(71, 5, 3)); });
  it('bounds classifications and geological outputs', () => { const chunk = generateNeuralTerrain(93, 100, -100, 128); expect(Math.max(...chunk.biome)).toBeLessThan(5); expect(Math.max(...chunk.erosion)).toBeLessThanOrEqual(255); expect(chunk.elevation).toHaveLength(16_384); });
});
