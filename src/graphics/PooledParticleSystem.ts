export interface ParticleBurst { x: number; y: number; count: number; speedMin: number; speedMax: number; lifeMs: number; color: number; size?: number; }
export interface ParticleDrawTarget { fillStyle: string | CanvasGradient | CanvasPattern; fillRect(x: number, y: number, width: number, height: number): void; clearRect(x: number, y: number, width: number, height: number): void; }

export class PooledParticleSystem {
  readonly capacity: number;
  private readonly x: Float32Array; private readonly y: Float32Array; private readonly vx: Float32Array; private readonly vy: Float32Array;
  private readonly life: Float32Array; private readonly maxLife: Float32Array; private readonly size: Float32Array; private readonly color: Uint32Array;
  private cursor = 0; private active = 0; private randomState = 0x45d9f3b;

  constructor(capacity = 4096) {
    if (capacity <= 0) throw new Error('Particle capacity must be positive');
    this.capacity = capacity;
    this.x = new Float32Array(capacity); this.y = new Float32Array(capacity); this.vx = new Float32Array(capacity); this.vy = new Float32Array(capacity);
    this.life = new Float32Array(capacity); this.maxLife = new Float32Array(capacity); this.size = new Float32Array(capacity); this.color = new Uint32Array(capacity);
  }

  emit(burst: ParticleBurst) {
    const count = Math.min(this.capacity, Math.max(0, Math.floor(burst.count)));
    for (let emitted = 0; emitted < count; emitted++) {
      const index = this.acquire(); const angle = this.random() * Math.PI * 2; const speed = burst.speedMin + this.random() * (burst.speedMax - burst.speedMin);
      this.x[index] = burst.x; this.y[index] = burst.y; this.vx[index] = Math.cos(angle) * speed; this.vy[index] = Math.sin(angle) * speed;
      this.life[index] = burst.lifeMs; this.maxLife[index] = burst.lifeMs; this.size[index] = burst.size ?? 3; this.color[index] = burst.color;
    }
  }

  update(deltaMs: number) {
    const dt = Math.max(0, Math.min(100, deltaMs)) / 1000;
    for (let index = 0; index < this.capacity; index++) {
      if (this.life[index] <= 0) continue;
      this.life[index] -= deltaMs; this.x[index] += this.vx[index] * dt; this.y[index] += this.vy[index] * dt; this.vx[index] *= 0.985; this.vy[index] = this.vy[index] * 0.985 + 15 * dt;
      if (this.life[index] <= 0) { this.life[index] = 0; this.active -= 1; }
    }
    return this.active;
  }

  render(target: ParticleDrawTarget, width: number, height: number) {
    target.clearRect(0, 0, width, height);
    this.forEachActive((x, y, size, color, alpha) => { target.fillStyle = `rgba(${color >> 16 & 255},${color >> 8 & 255},${color & 255},${alpha})`; target.fillRect(x, y, size, size); });
  }

  forEachActive(draw: (x: number, y: number, size: number, color: number, alpha: number) => void) {
    for (let index = 0; index < this.capacity; index++) if (this.life[index] > 0) draw(this.x[index], this.y[index], this.size[index], this.color[index], this.life[index] / this.maxLife[index]);
  }
  get activeCount() { return this.active; }

  private acquire() {
    for (let checked = 0; checked < this.capacity; checked++) { const index = (this.cursor + checked) % this.capacity; if (this.life[index] <= 0) { this.cursor = (index + 1) % this.capacity; this.active += 1; return index; } }
    const index = this.cursor; this.cursor = (this.cursor + 1) % this.capacity; return index;
  }
  private random() { let x = this.randomState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.randomState = x | 0; return (x >>> 0) / 4294967296; }
}

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW';
export class AdaptiveQualityController {
  private samples: number[] = [];
  sample(fps: number) { this.samples.push(Math.max(0, fps)); if (this.samples.length > 6) this.samples.shift(); return this.tier; }
  get tier(): QualityTier { const average = this.samples.length ? this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length : 60; return average < 42 ? 'LOW' : average < 54 ? 'MEDIUM' : 'HIGH'; }
  get particleBudget() { return this.tier === 'LOW' ? 0.35 : this.tier === 'MEDIUM' ? 0.65 : 1; }
  get resolutionScale() { return this.tier === 'LOW' ? 0.7 : this.tier === 'MEDIUM' ? 0.85 : 1; }
}
