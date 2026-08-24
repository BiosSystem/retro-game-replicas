import type { DrumHit, TrackerStep, TrackerTrack, TrackerVoice } from './tracks';

export interface ScheduledVoice { voice: TrackerVoice; time: number; duration: number; note?: number; chord?: number[]; drum?: DrumHit; }
export interface TrackerBackend { currentTime: number; schedule(event: ScheduledVoice): void; disposeBefore(time: number): void; setGain(value: number, at: number, rampSeconds: number): void; suspend(): Promise<void>; resume(): Promise<void>; }

export class ChiptuneSequencer {
  private readonly backend: TrackerBackend;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private track: TrackerTrack | undefined;
  private step = 0;
  private nextStepTime = 0;
  private readonly lookaheadMs = 25;
  private readonly scheduleAheadSeconds = 0.1;

  constructor(backend: TrackerBackend) { this.backend = backend; }

  play(track: TrackerTrack, fadeSeconds = 0.35) {
    this.stopTimer();
    this.track = track;
    this.step = 0;
    this.nextStepTime = this.backend.currentTime + 0.03;
    if (fadeSeconds > 0) {
      this.backend.setGain(0.0001, this.backend.currentTime, fadeSeconds / 2);
      this.backend.setGain(1, this.backend.currentTime + fadeSeconds / 2, fadeSeconds / 2);
    } else this.backend.setGain(1, this.backend.currentTime, 0);
    this.tick();
  }

  stop(fadeSeconds = 0.25) {
    this.stopTimer();
    this.backend.setGain(0.0001, this.backend.currentTime, fadeSeconds);
    this.track = undefined;
  }

  scheduleWindow(now = this.backend.currentTime) {
    if (!this.track) return 0;
    let scheduled = 0;
    while (this.nextStepTime < now + this.scheduleAheadSeconds) {
      this.scheduleStep(this.track, this.step, this.nextStepTime);
      this.advance(this.track);
      scheduled += 1;
    }
    this.backend.disposeBefore(now - 0.1);
    return scheduled;
  }

  getStep() { return this.step; }
  suspend() { this.stopTimer(); return this.backend.suspend(); }
  resume() { if (this.track) { this.nextStepTime = this.backend.currentTime + 0.03; this.tick(); } return this.backend.resume(); }

  private tick = () => {
    this.scheduleWindow();
    this.timer = setTimeout(this.tick, this.lookaheadMs);
  };

  private scheduleStep(track: TrackerTrack, step: number, time: number) {
    const stepDuration = 60 / track.bpm / track.stepsPerBeat;
    for (const voice of Object.keys(track.voices) as TrackerVoice[]) {
      const pattern = track.voices[voice];
      const data: TrackerStep = pattern[step % pattern.length];
      if (data.note || data.chord || data.drum) this.backend.schedule({ voice, time, duration: stepDuration * (data.gate ?? 0.72), note: data.note, chord: data.chord, drum: data.drum });
    }
  }

  private advance(track: TrackerTrack) {
    const length = Math.max(...Object.values(track.voices).map(pattern => pattern.length));
    this.step = (this.step + 1) % length;
    this.nextStepTime += 60 / track.bpm / track.stepsPerBeat;
  }

  private stopTimer() { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; }
}

export class WebAudioTrackerBackend implements TrackerBackend {
  private readonly context: AudioContext;
  private readonly mix: GainNode;
  private readonly channels = new Map<TrackerVoice, GainNode>();
  private readonly active = new Set<AudioScheduledSourceNode>();
  private noise: AudioBuffer;

  constructor(context: AudioContext, destination: AudioNode) {
    this.context = context;
    this.mix = context.createGain();
    this.mix.gain.value = 0.0001;
    this.mix.connect(destination);
    const levels: Record<TrackerVoice, number> = { LEAD: 0.18, ARP: 0.1, BASS: 0.2, DRUMS: 0.16 };
    for (const voice of Object.keys(levels) as TrackerVoice[]) {
      const gain = context.createGain();
      gain.gain.value = levels[voice];
      gain.connect(this.mix);
      this.channels.set(voice, gain);
    }
    this.noise = this.makeNoise();
  }

  get currentTime() { return this.context.currentTime; }
  get activeVoiceCount() { return this.active.size; }
  setGain(value: number, at: number, rampSeconds: number) { this.mix.gain.cancelScheduledValues(at); this.mix.gain.setValueAtTime(Math.max(0.0001, this.mix.gain.value), at); this.mix.gain.exponentialRampToValueAtTime(Math.max(0.0001, value), at + rampSeconds); }
  suspend() { return this.context.suspend(); }
  resume() { return this.context.resume(); }
  disposeBefore(_time: number) { /* Sources remove themselves through onended. */ }

  schedule(event: ScheduledVoice) {
    if (event.drum) this.scheduleDrum(event);
    else if (event.voice === 'ARP' && event.chord) event.chord.forEach((note, index) => this.scheduleTone(event, note + (index % 2) * 12, index * event.duration / event.chord!.length));
    else if (event.note) this.scheduleTone(event, event.note, 0);
  }

  private scheduleTone(event: ScheduledVoice, midi: number, offset: number) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const start = event.time + offset;
    const duration = event.voice === 'ARP' ? event.duration / 3 : event.duration;
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    oscillator.type = event.voice === 'BASS' ? 'triangle' : 'square';
    if (event.voice === 'LEAD') oscillator.setPeriodicWave(this.makePulseWave(start % 0.5 < 0.25 ? 0.25 : 0.5));
    oscillator.frequency.setValueAtTime(frequency, start);
    if (event.voice === 'BASS') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.015, start + duration);
    if (event.voice === 'LEAD') {
      const vibrato = this.context.createOscillator();
      const depth = this.context.createGain();
      vibrato.frequency.value = 6;
      depth.gain.value = 4;
      vibrato.connect(depth).connect(oscillator.frequency);
      this.trackSource(vibrato, start, start + duration);
    }
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(1, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(this.channels.get(event.voice)!);
    this.trackSource(oscillator, start, start + duration + 0.01);
  }

  private scheduleDrum(event: ScheduledVoice) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noise;
    filter.type = event.drum === 'KICK' ? 'lowpass' : 'highpass';
    filter.frequency.value = event.drum === 'KICK' ? 160 : event.drum === 'SNARE' ? 1200 : 5000;
    envelope.gain.setValueAtTime(event.drum === 'HAT' ? 0.35 : 0.8, event.time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, event.time + event.duration);
    source.connect(filter).connect(envelope).connect(this.channels.get('DRUMS')!);
    this.trackSource(source, event.time, event.time + event.duration);
  }

  private trackSource(source: AudioScheduledSourceNode, start: number, stop: number) {
    this.active.add(source);
    source.onended = () => { source.disconnect(); this.active.delete(source); };
    source.start(start);
    source.stop(stop);
  }

  private makeNoise() {
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * 0.4), this.context.sampleRate);
    const values = buffer.getChannelData(0);
    let seed = 0x43ad3f;
    for (let index = 0; index < values.length; index++) { seed = (seed * 16807) % 2147483647; values[index] = seed / 1073741824 - 1; }
    return buffer;
  }

  private makePulseWave(duty: number) {
    const harmonics = 24;
    const real = new Float32Array(harmonics + 1);
    const imag = new Float32Array(harmonics + 1);
    for (let harmonic = 1; harmonic <= harmonics; harmonic++) {
      real[harmonic] = (2 / (harmonic * Math.PI)) * Math.sin(2 * Math.PI * harmonic * duty);
      imag[harmonic] = (2 / (harmonic * Math.PI)) * (1 - Math.cos(2 * Math.PI * harmonic * duty));
    }
    return this.context.createPeriodicWave(real, imag, { disableNormalization: false });
  }
}
