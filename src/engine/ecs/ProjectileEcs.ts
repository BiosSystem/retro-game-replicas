export const MAX_PROJECTILES = 100_000;
export type ProjectileKind = 0 | 1 | 2;
export interface ProjectileSpawn { x: number; y: number; vx: number; vy: number; life?: number; kind?: ProjectileKind; }

export class ProjectileEcs {
  readonly capacity: number; readonly shared: boolean;
  readonly x: Float32Array; readonly y: Float32Array; readonly vx: Float32Array; readonly vy: Float32Array; readonly life: Float32Array; readonly kind: Uint8Array; readonly active: Uint8Array;
  activeCount = 0; private cursor = 0;
  constructor(capacity = MAX_PROJECTILES, preferShared = true) {
    this.capacity = clampInt(capacity, 1, MAX_PROJECTILES);
    this.shared = preferShared && typeof SharedArrayBuffer !== 'undefined' && globalThis.crossOriginIsolated === true;
    const floatBuffer = allocate(this.capacity * 5 * Float32Array.BYTES_PER_ELEMENT, this.shared);
    this.x = new Float32Array(floatBuffer, 0, this.capacity);
    this.y = new Float32Array(floatBuffer, this.capacity * 4, this.capacity);
    this.vx = new Float32Array(floatBuffer, this.capacity * 8, this.capacity);
    this.vy = new Float32Array(floatBuffer, this.capacity * 12, this.capacity);
    this.life = new Float32Array(floatBuffer, this.capacity * 16, this.capacity);
    const byteBuffer = allocate(this.capacity * 2, this.shared);
    this.kind = new Uint8Array(byteBuffer, 0, this.capacity);
    this.active = new Uint8Array(byteBuffer, this.capacity, this.capacity);
  }
  spawn(spec: ProjectileSpawn) {
    let index = this.cursor;
    for (let scanned = 0; scanned < this.capacity && this.active[index]; scanned++) index = (index + 1) % this.capacity;
    if (this.active[index]) return -1;
    this.x[index] = finite(spec.x); this.y[index] = finite(spec.y); this.vx[index] = finite(spec.vx); this.vy[index] = finite(spec.vy);
    this.life[index] = clamp(finite(spec.life ?? 8), 0.01, 120); this.kind[index] = clampInt(spec.kind ?? 0, 0, 2); this.active[index] = 1;
    this.cursor = (index + 1) % this.capacity; this.activeCount++; return index;
  }
  update(deltaSeconds: number, targetX = 320, targetY = 440) {
    const dt = clamp(finite(deltaSeconds), 0, 0.05); const turn = dt * 2.4;
    for (let i = 0; i < this.capacity; i++) {
      if (!this.active[i]) continue;
      if (this.kind[i] === 2) { const dx = targetX - this.x[i], dy = targetY - this.y[i], length = Math.hypot(dx, dy) || 1; const speed = Math.hypot(this.vx[i], this.vy[i]); this.vx[i] += (dx / length * speed - this.vx[i]) * turn; this.vy[i] += (dy / length * speed - this.vy[i]) * turn; }
      this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.life[i] -= dt;
      if (this.life[i] <= 0 || this.x[i] < -96 || this.x[i] > 736 || this.y[i] < -96 || this.y[i] > 576) this.remove(i);
    }
    return this.activeCount;
  }
  clear() { this.active.fill(0); this.activeCount = 0; this.cursor = 0; }
  kill(index: number) { if (Number.isInteger(index) && index >= 0 && index < this.capacity) this.remove(index); }
  private remove(index: number) { if (!this.active[index]) return; this.active[index] = 0; this.activeCount--; }
}
function allocate(bytes: number, shared: boolean) { return shared ? new SharedArrayBuffer(bytes) : new ArrayBuffer(bytes); }
function finite(value: number) { return Number.isFinite(value) ? value : 0; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function clampInt(value: number, min: number, max: number) { return Math.floor(clamp(finite(value), min, max)); }
