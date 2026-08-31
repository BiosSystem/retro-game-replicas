export interface CabinetLightPulse {
  x: number;
  y: number;
  color: number;
  intensity: number;
  remainingMs: number;
}

export class CabinetLightPool {
  private readonly capacity: number;
  private readonly pulses: CabinetLightPulse[] = [];

  constructor(capacity = 8) { if (capacity < 1) throw new Error('Light pool capacity must be positive'); this.capacity = capacity; }

  emit(x: number, y: number, color: number, intensity = 1, durationMs = 260) {
    const pulse: CabinetLightPulse = { x, y, color, intensity: Math.max(0, intensity), remainingMs: Math.max(1, durationMs) };
    if (this.pulses.length < this.capacity) this.pulses.push(pulse);
    else this.pulses[this.oldestIndex()] = pulse;
  }

  update(deltaMs: number) {
    for (let index = this.pulses.length - 1; index >= 0; index--) {
      this.pulses[index].remainingMs -= Math.max(0, deltaMs);
      if (this.pulses[index].remainingMs <= 0) this.pulses.splice(index, 1);
    }
    return this.snapshot();
  }

  snapshot() { return this.pulses.map(pulse => ({ ...pulse })); }

  private oldestIndex() { return this.pulses.reduce((oldest, pulse, index) => pulse.remainingMs < this.pulses[oldest].remainingMs ? index : oldest, 0); }
}
