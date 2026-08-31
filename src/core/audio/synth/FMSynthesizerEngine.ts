import { AudioVoiceAllocator } from '../../../audio/AudioVoiceAllocator';
import { buildAdsrCurve, createLfsrNoiseBuffer, DEFAULT_FM_PATCH, midiToFrequency, type FmPatch, type SynthWaveform } from './SynthPrimitives';

interface SynthVoice {
  carrier: OscillatorNode;
  modulator: OscillatorNode;
  noise: AudioBufferSourceNode;
  waveformGain: GainNode;
  noiseGain: GainNode;
  modulationGain: GainNode;
  envelope: GainNode;
  filter: BiquadFilterNode;
}

export interface SynthDiagnostics { active: number; dropped: number; capacity: number; }

/**
 * Keep a fixed set of continuous WebAudio graphs alive. Triggering a note only
 * writes AudioParam automation, so the realtime path creates no JavaScript or
 * WebAudio nodes.
 */
export class FMSynthesizerEngine {
  private readonly voices: SynthVoice[] = [];
  private readonly allocator: AudioVoiceAllocator;
  private readonly destination: AudioNode;
  private readonly context: BaseAudioContext;
  private readonly pulseWaves: Readonly<Record<'pulse12' | 'pulse25', PeriodicWave>>;
  private voiceCursor = 0;

  constructor(context: BaseAudioContext, destination: AudioNode = context.destination, voiceCount = 16) {
    if (!Number.isInteger(voiceCount) || voiceCount < 1 || voiceCount > 64) throw new Error('Synth voice count must be between 1 and 64');
    this.context = context; this.destination = destination;
    this.pulseWaves = { pulse12: this.createPulseWave(0.125), pulse25: this.createPulseWave(0.25) };
    this.allocator = new AudioVoiceAllocator(voiceCount);
    for (let index = 0; index < voiceCount; index += 1) this.voices.push(this.createVoice(index));
  }

  trigger(note: number, octave: number, patch: FmPatch = DEFAULT_FM_PATCH, time = this.context.currentTime, gateSeconds = 0.12) {
    if (!this.allocator.acquire(time, gateSeconds + patch.envelope.release)) return false;
    const voice = this.voices[this.voiceCursor];
    this.voiceCursor = (this.voiceCursor + 1) % this.voices.length;
    const frequency = midiToFrequency(note, octave);
    const start = Math.max(this.context.currentTime, time);
    const end = start + Math.max(0.005, gateSeconds);
    const curve = buildAdsrCurve(start, gateSeconds, patch.envelope, patch.gain);
    const carrierFrequency = Math.max(1, frequency * Math.max(0.01, patch.carrierRatio));

    voice.carrier.frequency.setValueAtTime(carrierFrequency, start);
    voice.modulator.frequency.setValueAtTime(Math.max(1, frequency * Math.max(0.01, patch.modulatorRatio)), start);
    voice.modulationGain.gain.setValueAtTime(Math.max(0, patch.modulationIndex * carrierFrequency), start);
    voice.filter.type = patch.filter.mode;
    voice.filter.frequency.setValueAtTime(Math.max(20, patch.filter.frequency), start);
    voice.filter.Q.setValueAtTime(Math.max(0.0001, patch.filter.q), start);
    this.setWaveform(voice, patch.waveform, start);
    voice.envelope.gain.cancelScheduledValues(start);
    for (const point of curve) voice.envelope.gain.exponentialRampToValueAtTime(point.value, point.time);
    return end > start;
  }

  diagnostics(at = this.context.currentTime): SynthDiagnostics { return this.allocator.snapshot(at); }

  dispose() {
    for (const voice of this.voices) {
      voice.carrier.stop(); voice.modulator.stop(); voice.noise.stop();
      voice.carrier.disconnect(); voice.modulator.disconnect(); voice.noise.disconnect();
      voice.waveformGain.disconnect(); voice.noiseGain.disconnect(); voice.modulationGain.disconnect(); voice.envelope.disconnect(); voice.filter.disconnect();
    }
  }

  private createVoice(index: number): SynthVoice {
    const carrier = this.context.createOscillator();
    const modulator = this.context.createOscillator();
    const noise = this.context.createBufferSource();
    const waveformGain = this.context.createGain();
    const noiseGain = this.context.createGain();
    const modulationGain = this.context.createGain();
    const envelope = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const noiseBuffer = this.context.createBuffer(1, 32768, this.context.sampleRate);
    noiseBuffer.getChannelData(0).set(createLfsrNoiseBuffer(noiseBuffer.length, index + 1));
    noise.buffer = noiseBuffer; noise.loop = true;
    waveformGain.gain.value = 1; noiseGain.gain.value = 0; envelope.gain.value = 0.0001;
    modulator.connect(modulationGain).connect(carrier.frequency);
    carrier.connect(waveformGain).connect(filter); noise.connect(noiseGain).connect(filter); filter.connect(envelope).connect(this.destination);
    carrier.start(); modulator.start(); noise.start();
    return { carrier, modulator, noise, waveformGain, noiseGain, modulationGain, envelope, filter };
  }

  private setWaveform(voice: SynthVoice, waveform: SynthWaveform, at: number) {
    const isNoise = waveform === 'noise';
    voice.waveformGain.gain.setValueAtTime(isNoise ? 0 : 1, at);
    voice.noiseGain.gain.setValueAtTime(isNoise ? 1 : 0, at);
    voice.carrier.type = waveform === 'triangle' ? 'triangle' : waveform === 'saw' ? 'sawtooth' : 'square';
    if (waveform === 'pulse12' || waveform === 'pulse25') voice.carrier.setPeriodicWave(this.pulseWaves[waveform]);
    voice.carrier.detune.setValueAtTime(0, at);
  }

  private createPulseWave(duty: number) {
    const harmonics = 32; const real = new Float32Array(harmonics + 1); const imaginary = new Float32Array(harmonics + 1);
    for (let harmonic = 1; harmonic <= harmonics; harmonic += 1) imaginary[harmonic] = (2 * Math.sin(Math.PI * harmonic * duty)) / (Math.PI * harmonic);
    return this.context.createPeriodicWave(real, imaginary, { disableNormalization: false });
  }
}
