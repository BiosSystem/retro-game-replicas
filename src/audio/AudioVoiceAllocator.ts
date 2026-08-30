export interface AudioVoiceSnapshot { active: number; dropped: number; capacity: number; }

export class AudioVoiceAllocator {
  private readonly releaseTimes: Float64Array;
  private active = 0;
  private dropped = 0;
  private readonly capacity: number;

  constructor(capacity = 24) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 256) throw new Error('Audio voice capacity must be between 1 and 256');
    this.capacity = capacity;
    this.releaseTimes = new Float64Array(capacity);
  }

  acquire(at: number, duration: number) {
    const now = Number.isFinite(at) ? at : 0;
    this.releaseBefore(now);
    if (this.active >= this.capacity) { this.dropped += 1; return false; }
    this.releaseTimes[this.active] = now + Math.max(0.005, Math.min(30, Number.isFinite(duration) ? duration : 0.005));
    this.active += 1;
    return true;
  }

  releaseBefore(time: number) {
    const threshold = Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
    let write = 0;
    for (let index = 0; index < this.active; index++) if (this.releaseTimes[index] > threshold) this.releaseTimes[write++] = this.releaseTimes[index];
    this.active = write;
  }

  snapshot(at: number): AudioVoiceSnapshot { this.releaseBefore(at); return { active: this.active, dropped: this.dropped, capacity: this.capacity }; }
  reset() { this.active = 0; this.dropped = 0; }
}
