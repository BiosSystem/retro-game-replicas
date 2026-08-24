export interface NetworkProfile { latencyMs: number; jitterMs: number; packetLoss: number; seed: number; }
export interface ScheduledPacket<T> { deliverAt: number; sequence: number; payload: T; }

export class NetworkConditionSimulator<T> {
  private random: () => number; private sequence = 0; private queue: ScheduledPacket<T>[] = []; private dropped = 0; private readonly profile: NetworkProfile;
  constructor(profile: NetworkProfile) { this.profile = profile; this.random = seeded(profile.seed); }
  send(payload: T, now: number) { if (this.random() < clamp(this.profile.packetLoss, 0, 1)) { this.dropped++; return false; } const jitter = (this.random() * 2 - 1) * Math.max(0, this.profile.jitterMs); this.queue.push({ deliverAt: now + Math.max(0, this.profile.latencyMs + jitter), sequence: this.sequence++, payload }); return true; }
  receive(now: number) { const ready = this.queue.filter(packet => packet.deliverAt <= now).sort((a, b) => a.deliverAt - b.deliverAt || a.sequence - b.sequence); this.queue = this.queue.filter(packet => packet.deliverAt > now); return ready.map(packet => packet.payload); }
  stats() { return { queued: this.queue.length, dropped: this.dropped, sent: this.sequence + this.dropped }; }
}
function seeded(seed: number) { let state = seed | 0 || 1; return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; }
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, value)); }
