export interface EncoderPressureSample { encodeQueue: number; frameTimeMs: number; }

export class BitrateController {
  private bitrate: number;
  private calmSamples = 0;
  private readonly minimum: number;
  private readonly maximum: number;
  constructor(minimum = 400_000, initial = 2_500_000, maximum = 8_000_000) {
    this.minimum = minimum; this.maximum = maximum;
    this.bitrate = Math.max(minimum, Math.min(maximum, initial));
  }
  sample(pressure: EncoderPressureSample): number {
    if (pressure.encodeQueue > 3 || pressure.frameTimeMs > 20) {
      this.bitrate = Math.max(this.minimum, Math.round(this.bitrate * 0.8)); this.calmSamples = 0;
    } else if (pressure.encodeQueue === 0 && pressure.frameTimeMs < 15) {
      this.calmSamples++;
      if (this.calmSamples >= 30) { this.bitrate = Math.min(this.maximum, Math.round(this.bitrate * 1.1)); this.calmSamples = 0; }
    } else this.calmSamples = 0;
    return this.bitrate;
  }
  current(): number { return this.bitrate; }
}
