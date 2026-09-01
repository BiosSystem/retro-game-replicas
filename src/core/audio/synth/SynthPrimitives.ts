export const SYNTH_WAVEFORMS = ['pulse12', 'pulse25', 'pulse50', 'triangle', 'saw', 'noise'] as const;
export type SynthWaveform = (typeof SYNTH_WAVEFORMS)[number];

export const FILTER_MODES = ['lowpass', 'highpass', 'bandpass'] as const;
export type SynthFilterMode = (typeof FILTER_MODES)[number];

export interface AdsrEnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface EnvelopePoint {
  time: number;
  value: number;
}

export interface FmPatch {
  waveform: SynthWaveform;
  carrierRatio: number;
  modulatorRatio: number;
  modulationIndex: number;
  gain: number;
  envelope: AdsrEnvelope;
  filter: { mode: SynthFilterMode; frequency: number; q: number };
}

export const DEFAULT_FM_PATCH: FmPatch = {
  waveform: 'pulse50',
  carrierRatio: 1,
  modulatorRatio: 2,
  modulationIndex: 0.25,
  gain: 0.18,
  envelope: { attack: 0.008, decay: 0.08, sustain: 0.72, release: 0.12 },
  filter: { mode: 'lowpass', frequency: 8000, q: 0.7 },
};

export function clampUnit(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }

export function sanitizeEnvelope(envelope: AdsrEnvelope): AdsrEnvelope {
  return {
    attack: Math.max(0.001, Math.min(5, envelope.attack)),
    decay: Math.max(0.001, Math.min(5, envelope.decay)),
    sustain: clampUnit(envelope.sustain),
    release: Math.max(0.001, Math.min(10, envelope.release)),
  };
}

/** Return exponential ADSR automation points for a gate ending at gateSeconds. */
export function buildAdsrCurve(startTime: number, gateSeconds: number, envelope: AdsrEnvelope, peak = 1): readonly EnvelopePoint[] {
  const safe = sanitizeEnvelope(envelope);
  const start = Math.max(0, startTime);
  const gateEnd = start + Math.max(safe.attack + safe.decay, gateSeconds);
  const sustainAt = Math.max(start + safe.attack + safe.decay, gateEnd);
  return [
    { time: start, value: 0.0001 },
    { time: start + safe.attack, value: Math.max(0.0001, peak) },
    { time: start + safe.attack + safe.decay, value: Math.max(0.0001, peak * safe.sustain) },
    { time: sustainAt, value: Math.max(0.0001, peak * safe.sustain) },
    { time: sustainAt + safe.release, value: 0.0001 },
  ];
}

export function midiToFrequency(note: number, octave = 0) {
  return 440 * Math.pow(2, ((Math.round(note) + Math.round(octave) * 12) - 69) / 12);
}

/** 16-bit maximal-length LFSR. Keep its state explicit for deterministic rendering. */
export class LfsrNoise {
  private state: number;

  constructor(seed = 0x1) { this.state = (seed & 0xffff) || 0x1; }

  nextBit() {
    const feedback = ((this.state >>> 0) ^ (this.state >>> 2) ^ (this.state >>> 3) ^ (this.state >>> 5)) & 1;
    this.state = ((this.state >>> 1) | (feedback << 15)) & 0xffff;
    return this.state & 1;
  }

  nextSample() { return this.nextBit() === 0 ? -1 : 1; }
  snapshot() { return this.state; }
}

export function createLfsrNoiseBuffer(length: number, seed = 0x1) {
  const samples = new Float32Array(Math.max(1, Math.floor(length)));
  const lfsr = new LfsrNoise(seed);
  for (let index = 0; index < samples.length; index += 1) samples[index] = lfsr.nextSample();
  return samples;
}
