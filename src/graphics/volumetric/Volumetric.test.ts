import { describe, expect, it } from 'vitest';
import { AdaptiveRaymarch, integrateAtmosphere, miePhase, rayleighCoefficient } from './Scattering';
import { VOLUMETRIC_WGSL, volumetricDispatch } from './VolumetricCompute';

describe('volumetric scattering', () => {
  it('scatters blue wavelengths more strongly', () => {
    expect(rayleighCoefficient(450)).toBeGreaterThan(rayleighCoefficient(650));
    expect(miePhase(1)).toBeGreaterThan(miePhase(-1));
  });
  it('adapts bounded ray steps to frame pressure', () => {
    const march = new AdaptiveRaymarch('MEDIUM');
    for (let i = 0; i < 20; i++) march.adapt(25);
    expect(march.count()).toBe(12);
    for (let i = 0; i < 40; i++) march.adapt(8);
    expect(march.count()).toBe(40);
  });
  it('returns finite fog integration and a compilable shader contract', () => {
    const sample = integrateAtmosphere(90, 0.8, 0.7, 24);
    expect(sample.luminance).toBeGreaterThan(0);
    expect(sample.transmittance).toBeGreaterThan(0);
    expect(VOLUMETRIC_WGSL).toContain('@compute @workgroup_size(8, 8)');
    expect(volumetricDispatch(640, 480)).toEqual({ x: 80, y: 60 });
  });
});
