import type { QualityTier } from '../PooledParticleSystem';

export interface CrtProfile { renderScale: number; persistence: number; barrel: number; bloom: boolean; chromaPixels: number; scanlineStrength: number; }

export function crtProfile(tier: QualityTier, reducedMotion = false): CrtProfile {
  if (tier === 'LOW') return { renderScale: 0.5, persistence: 0, barrel: 0, bloom: false, chromaPixels: 0, scanlineStrength: 0 };
  if (tier === 'MEDIUM') return { renderScale: 0.5, persistence: reducedMotion ? 0 : 0.08, barrel: 0.035, bloom: false, chromaPixels: 0.5, scanlineStrength: 0.1 };
  return { renderScale: 0.5, persistence: reducedMotion ? 0 : 0.14, barrel: 0.055, bloom: true, chromaPixels: 0.8, scanlineStrength: 0.18 };
}

export class PhosphorFrameBuffer {
  private read: Float32Array;
  private write: Float32Array;
  readonly pixelCount: number;
  constructor(pixelCount: number) { if (pixelCount < 1) throw new Error('Pixel count must be positive'); this.pixelCount = pixelCount; this.read = new Float32Array(pixelCount * 4); this.write = new Float32Array(pixelCount * 4); }
  blend(frame: ArrayLike<number>, persistence: number) {
    if (frame.length !== this.read.length) throw new Error('Frame size mismatch');
    const decay = Math.max(0, Math.min(0.95, persistence));
    for (let index = 0; index < this.write.length; index++) this.write[index] = Math.max(Number(frame[index]) || 0, this.read[index] * decay);
    const output = this.write; this.write = this.read; this.read = output; return output;
  }
  clear() { this.read.fill(0); this.write.fill(0); }
}
