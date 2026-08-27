import { ChiptuneSequencer, WebAudioTrackerBackend } from '../audio/bgm/ChiptuneSequencer';
import { TRACKS } from '../audio/bgm/tracks';
import type { SoundPatch } from '../audio/patches/SoundPatch';
import { SoundPatchStore } from '../audio/patches/SoundPatchStore';
import type { SpatialAudioBridge } from '../audio/spatial/RelativisticAudioWorklet';

export type AudioEffect = 'LASER' | 'EXPLOSION' | 'COIN' | 'POWER_UP' | 'STAGE_CLEAR';
export interface ToneStep { frequency: number; type: OscillatorType; duration: number; delay: number; endFrequency?: number; }

export function getEffectPlan(effect: AudioEffect): { tones: ToneStep[]; noise: boolean } {
    if (effect === 'LASER') return { tones: [{ frequency: 880, type: 'square', duration: 0.12, delay: 0, endFrequency: 220 }], noise: false };
    if (effect === 'EXPLOSION') return { tones: [{ frequency: 90, type: 'sawtooth', duration: 0.4, delay: 0, endFrequency: 35 }], noise: true };
    if (effect === 'COIN') return { tones: [{ frequency: 988, type: 'square', duration: 0.08, delay: 0 }, { frequency: 1319, type: 'square', duration: 0.12, delay: 0.08 }], noise: false };
    if (effect === 'POWER_UP') return { tones: [440, 554, 659, 880].map((frequency, index) => ({ frequency, type: 'triangle', duration: 0.12, delay: index * 0.07 })), noise: false };
    return { tones: [523, 659, 784, 1047].map((frequency, index) => ({ frequency, type: 'square', duration: 0.18, delay: index * 0.11 })), noise: false };
}

export class AudioEngine {
    private static ctx: AudioContext | null = null;
    private static masterGain: GainNode | null = null;
    private static bgmInterval: number | null = null;
    private static currentTrack: { track: number[], speedMs: number, type: OscillatorType } | null = null;
    private static noiseBuffer: AudioBuffer | null = null;
    private static musicGain: GainNode | null = null;
    private static sequencer: ChiptuneSequencer | null = null;
    private static pendingTrack: keyof typeof TRACKS | null = null;

    public static initialize() {
        if (this.ctx) return;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        
        const savedVolume = localStorage.getItem('retro_master_volume');
        if (savedVolume !== null) {
            this.masterGain.gain.value = parseFloat(savedVolume);
        } else {
            this.masterGain.gain.value = 0.5;
        }

        this.masterGain.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = Number(localStorage.getItem('retro_music_volume') ?? '0.55');
        this.musicGain.connect(this.masterGain);
        this.sequencer = new ChiptuneSequencer(new WebAudioTrackerBackend(this.ctx, this.musicGain));
        if (this.pendingTrack) this.sequencer.play(TRACKS[this.pendingTrack]);
        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) void this.sequencer?.suspend();
            else void this.sequencer?.resume();
        });
        
        if (this.currentTrack && !this.bgmInterval) {
            this.playBGM(this.currentTrack.track, this.currentTrack.speedMs, this.currentTrack.type);
        }
    }

    public static setVolume(val: number) {
        const volume = Math.max(0, Math.min(1, val));
        if (this.masterGain) this.masterGain.gain.value = volume;
        localStorage.setItem('retro_master_volume', volume.toString());
    }

    public static setMusicVolume(val: number) {
        const volume = Math.max(0, Math.min(1, val));
        if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.03);
        localStorage.setItem('retro_music_volume', volume.toString());
    }

    public static playTrack(id: keyof typeof TRACKS) {
        const track = TRACKS[id];
        if (!track) return;
        this.pendingTrack = id;
        this.currentTrack = null;
        this.stopBGM();
        this.sequencer?.play(track);
    }

    public static stopTrack() { this.pendingTrack = null; this.sequencer?.stop(); }
    public static setTrackTimeWarp(tempoScale: number, pitchSemitones: number) { this.sequencer?.setTimeWarp(tempoScale, pitchSemitones); }
    public static async createRelativisticSpatialBridge(): Promise<SpatialAudioBridge | null> {
        if (!this.ctx || !this.masterGain) return null;
        const { installRelativisticSpatialWorklet } = await import('../audio/spatial/RelativisticAudioWorklet');
        return installRelativisticSpatialWorklet(this.ctx, this.masterGain);
    }

    public static playTone(frequency: number, type: OscillatorType = 'square', duration: number = 0.1) {
        if (!this.ctx || !this.masterGain) return;

        this.scheduleTone(frequency, type, duration, this.ctx.currentTime);
    }

    public static playEffect(effect: AudioEffect) {
        if (!this.ctx || !this.masterGain) return;
        const custom = new SoundPatchStore(localStorage).assigned(effect);
        if (custom) { this.playPatch(custom); return; }
        const now = this.ctx.currentTime;
        const plan = getEffectPlan(effect);
        for (const tone of plan.tones) this.scheduleTone(tone.frequency, tone.type, tone.duration, now + tone.delay, tone.endFrequency);
        if (plan.noise) this.playNoise(0.45, now);
    }

    public static playPatch(patch: SoundPatch) {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime; const end = now + patch.duration;
        const gain = this.ctx.createGain(); const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.setValueAtTime(patch.filterHz, now);
        gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(patch.gain, now + patch.attack); gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(end, now + patch.attack + patch.decay));
        filter.connect(gain); gain.connect(this.masterGain);
        if (patch.waveform === 'noise') {
            if (!this.noiseBuffer) return;
            const source = this.ctx.createBufferSource(); source.buffer = this.noiseBuffer; source.loop = true; source.connect(filter); source.start(now); source.stop(end); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
            return;
        }
        const oscillator = this.ctx.createOscillator();
        if (patch.waveform === 'pulse') oscillator.setPeriodicWave(this.createPulseWave(this.ctx, patch.dutyCycle)); else oscillator.type = patch.waveform;
        oscillator.frequency.setValueAtTime(patch.frequency, now); oscillator.frequency.exponentialRampToValueAtTime(patch.endFrequency, end);
        oscillator.connect(filter); oscillator.start(now); oscillator.stop(end); oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
    }

    private static scheduleTone(frequency: number, type: OscillatorType, duration: number, startAt: number, endFrequency = frequency) {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, startAt);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), startAt + duration);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.35, startAt + Math.min(0.01, duration / 4));
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startAt);
        osc.stop(startAt + duration + 0.01);
    }

    private static playNoise(duration: number, startAt: number) {
        if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
        const source = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        source.buffer = this.noiseBuffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, startAt);
        filter.frequency.exponentialRampToValueAtTime(80, startAt + duration);
        gain.gain.setValueAtTime(0.45, startAt);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start(startAt);
        source.stop(startAt + duration);
    }

    private static createNoiseBuffer(ctx: AudioContext) {
        const length = Math.floor(ctx.sampleRate * 0.5);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const channel = buffer.getChannelData(0);
        let value = 0x12345678;
        for (let index = 0; index < length; index++) {
            value ^= value << 13;
            value ^= value >>> 17;
            value ^= value << 5;
            channel[index] = (value / 0x7fffffff) * 0.6;
        }
        return buffer;
    }

    private static createPulseWave(ctx: AudioContext, dutyCycle: number) {
        const harmonics = 32; const real = new Float32Array(harmonics); const imaginary = new Float32Array(harmonics);
        for (let harmonic = 1; harmonic < harmonics; harmonic++) imaginary[harmonic] = 2 * Math.sin(Math.PI * harmonic * dutyCycle) / (Math.PI * harmonic);
        return ctx.createPeriodicWave(real, imaginary, { disableNormalization: false });
    }

    public static playBGM(track: number[], speedMs: number = 150, type: OscillatorType = 'square') {
        this.currentTrack = { track, speedMs, type };
        this.stopBGM();
        if (!this.ctx || track.length === 0) return;
        
        let i = 0;
        this.bgmInterval = window.setInterval(() => {
            if (track[i] > 0) {
                // Play note for 80% of the step duration for a staccato chiptune feel
                this.playTone(track[i], type, (speedMs / 1000) * 0.8);
            }
            i = (i + 1) % track.length;
        }, speedMs);
    }

    public static stopBGM() {
        if (this.bgmInterval !== null) {
            window.clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}
