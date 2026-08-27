import { describe, expect, it } from 'vitest';
import { EPOCH_ARCHITECTURES, epochCore, epochDiagnostics, epochWeather } from './EpochSystems';

describe('Neon Epoch', () => {
  it('synthesizes nineteen established architectures', () => {
    expect(EPOCH_ARCHITECTURES).toHaveLength(19);
    expect(new Set(EPOCH_ARCHITECTURES).size).toBe(19);
  });

  it('keeps splats, fluid, and weather deterministic', () => {
    const first = epochCore(173, 8_192);
    const second = epochCore(173, 8_192);
    expect(first.splatChecksum).toBe(second.splatChecksum);
    expect(first.fluidChecksum).toBe(second.fluidChecksum);
    expect(first.fluid.mass()).toBe(first.initialMass);
    expect(epochWeather(173, 25)).toEqual(epochWeather(173, 25));
  });

  it('runs SIMD, audio allocation, and WebGPU capability diagnostics', async () => {
    const result = await epochDiagnostics(173, 4_096);
    expect(result.physicsBackend).toBe('WASM_SIMD_128');
    expect(result.maximumError).toBe(0);
    expect(result.fluidConserved).toBe(true);
    expect(result.audioCapacity).toBe(16_384);
    expect(result.delaySamples).toBe(4_800);
    expect(['SHARED', 'MESSAGE']).toContain(result.audioRing);
    expect(['COMPILED', 'UNAVAILABLE']).toContain(result.gaussianGpu);
  });
});
