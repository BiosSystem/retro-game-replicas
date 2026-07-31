export class AudioEngine {
    private static ctx: AudioContext | null = null;
    private static masterGain: GainNode | null = null;
    private static bgmInterval: number | null = null;
    private static currentTrack: { track: number[], speedMs: number, type: OscillatorType } | null = null;

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
        
        if (this.currentTrack && !this.bgmInterval) {
            this.playBGM(this.currentTrack.track, this.currentTrack.speedMs, this.currentTrack.type);
        }
    }

    public static setVolume(val: number) {
        if (!this.masterGain) return;
        this.masterGain.gain.value = val;
        localStorage.setItem('retro_master_volume', val.toString());
    }

    public static playTone(frequency: number, type: OscillatorType = 'square', duration: number = 0.1) {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        // Envelope (ADSR - simplified)
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
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
