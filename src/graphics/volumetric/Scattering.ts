export interface Vec3 { x: number; y: number; z: number; }
export interface ScatteringSample { rayleigh: number; mie: number; transmittance: number; luminance: number; }
export type VolumetricProfile = 'LOW' | 'MEDIUM' | 'HIGH';

const RAYLEIGH_SCALE = 5.8e-6;

export function rayleighCoefficient(wavelengthNm: number) {
  const wavelength = Math.max(380, Math.min(780, wavelengthNm)) * 1e-9;
  const reference = 550e-9;
  return RAYLEIGH_SCALE * (reference / wavelength) ** 4;
}

export function miePhase(cosTheta: number, anisotropy = 0.76) {
  const g = Math.max(-0.95, Math.min(0.95, anisotropy));
  const denominator = Math.max(1e-6, 1 + g * g - 2 * g * Math.max(-1, Math.min(1, cosTheta)));
  return (1 - g * g) / (4 * Math.PI * denominator ** 1.5);
}

export class AdaptiveRaymarch {
  private steps: number;
  private readonly minimum: number;
  private readonly maximum: number;
  constructor(profile: VolumetricProfile = 'MEDIUM') {
    this.minimum = profile === 'LOW' ? 8 : profile === 'MEDIUM' ? 12 : 20;
    this.maximum = profile === 'LOW' ? 20 : profile === 'MEDIUM' ? 40 : 72;
    this.steps = profile === 'LOW' ? 12 : profile === 'MEDIUM' ? 24 : 48;
  }
  adapt(frameMs: number) {
    if (frameMs > 18) this.steps = Math.max(this.minimum, this.steps - 2);
    else if (frameMs < 13) this.steps = Math.min(this.maximum, this.steps + 1);
    return this.steps;
  }
  count() { return this.steps; }
}

export function integrateAtmosphere(distance: number, density: number, cosTheta: number, steps: number): ScatteringSample {
  const count = Math.max(1, Math.min(96, Math.floor(steps)));
  const length = Math.max(0, Math.min(10000, distance));
  const step = length / count;
  const baseDensity = Math.max(0, Math.min(8, density));
  let opticalDepth = 0;
  let rayleigh = 0;
  let mie = 0;
  for (let i = 0; i < count; i++) {
    const normalized = (i + 0.5) / count;
    const localDensity = baseDensity * Math.exp(-normalized * 1.75);
    opticalDepth += localDensity * step;
    const visibility = Math.exp(-opticalDepth * 0.014);
    rayleigh += visibility * localDensity * rayleighCoefficient(550) * step;
    mie += visibility * localDensity * miePhase(cosTheta) * 0.0021 * step;
  }
  const transmittance = Math.exp(-opticalDepth * 0.014);
  return { rayleigh, mie, transmittance, luminance: rayleigh + mie };
}
