import type { SynthFilterMode } from './SynthPrimitives';

/** Lightweight Chamberlin state-variable filter for offline and Worklet-safe DSP paths. */
export class StateVariableFilter {
  private low = 0;
  private band = 0;
  private sampleRate: number;
  private mode: SynthFilterMode;
  private frequency: number;
  private q: number;

  constructor(sampleRate: number, mode: SynthFilterMode = 'lowpass', frequency = 1200, q = 0.7) {
    this.sampleRate = sampleRate; this.mode = mode; this.frequency = frequency; this.q = q;
  }

  configure(mode: SynthFilterMode, frequency: number, q: number) {
    this.mode = mode; this.frequency = Math.max(10, Math.min(this.sampleRate * 0.45, frequency)); this.q = Math.max(0.05, Math.min(24, q));
  }

  process(input: number) {
    const f = 2 * Math.sin(Math.PI * this.frequency / this.sampleRate);
    const damping = Math.min(2 * (1 - Math.pow(this.q, -0.25)), Math.min(2, 2 / f - f * 0.5));
    this.low += f * this.band;
    const high = input - this.low - damping * this.band;
    this.band += f * high;
    return this.mode === 'lowpass' ? this.low : this.mode === 'highpass' ? high : this.band;
  }

  reset() { this.low = 0; this.band = 0; }
}
