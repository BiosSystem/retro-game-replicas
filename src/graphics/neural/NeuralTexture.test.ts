import { describe, expect, it } from 'vitest';
import { proceduralTexture, sampleNeuralTexture, upscaleNeuralTexture } from './NeuralTexture';
describe('neural texture synthesis', () => {
  it('produces deterministic high-frequency 4x output', () => { const source = proceduralTexture(41, 32, 32), a = upscaleNeuralTexture(source, 4, 43), b = upscaleNeuralTexture(source, 4, 43); expect(a.checksum).toBe(b.checksum); expect(a.width).toBe(128); expect(a.checksum).not.toBe(source.checksum); });
  it('reuses a caller-owned output pool', () => { const source = proceduralTexture(47, 16, 16), pool = new Uint8Array(64 * 64 * 4), result = upscaleNeuralTexture(source, 4, 49, pool); expect(result.pixels).toBe(pool); expect(result.pixels.every(value => value >= 0 && value <= 255)).toBe(true); });
  it('samples bounded material modulation', () => { const value = sampleNeuralTexture(upscaleNeuralTexture(proceduralTexture(53, 8, 8), 2, 59), 1.2, -3.7); expect(Object.values(value).every(channel => channel >= .55 && channel <= 1.05)).toBe(true); });
});
