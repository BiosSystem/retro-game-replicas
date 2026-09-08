import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { VFXManager } from '../../engine/VFXManager';
import { arcadeModRuntime } from '../../mods/ModRuntime';
import type { ArcadeMode } from '../../multiplayer/CoopSession';
import { advanceRacer, collisionSeverity, generateHorizonBackdrop, generateRoadSample, projectRoadScanline, RACER_TICK_SECONDS, shiftGear } from './RacerSystems';
import { GhostBrain, racerSensors } from '../../ai/neural/GhostBrain';

export default class NeonRacerScene extends Phaser.Scene {
  private road!: Phaser.GameObjects.Graphics; private world!: Phaser.GameObjects.Graphics; private hud!: Phaser.GameObjects.Text; private playerLane = 0; private speed = 0; private gear = 1; private nitro = 100; private distance = 0; private score = 0; private shiftHeld = false; private crashCooldown = 0; private difficulty = 'NORMAL'; private mode: ArcadeMode = 'SOLO'; private ghost!: GhostBrain; private ghostLane = 0; private ghostSpeed = 0; private ghostDistance = 0; private ghostDecisionMs = 0; private fixedRemainder = 0; private enginePulseAt = 0;
  constructor() { super('RacerScene'); }
  create(data: { difficulty?: string; mode?: ArcadeMode }) { this.difficulty = data.difficulty ?? 'NORMAL'; this.mode = data.mode ?? 'SOLO'; this.playerLane = 0; this.speed = 0; this.gear = 1; this.nitro = 100; this.distance = 0; this.score = 0; this.ghostLane = 0; this.ghostSpeed = 0; this.ghostDistance = 0; this.ghostDecisionMs = 0; this.fixedRemainder = 0; this.enginePulseAt = 0; this.ghost = new GhostBrain('retro_racer_ghost_v1', localStorage); this.road = this.add.graphics(); this.world = this.add.graphics(); this.hud = this.add.text(12, 10, '', { fontFamily: 'Courier', fontSize: '13px', color: '#ffffff' }).setDepth(20); this.add.text(320, 15, 'CYBER-RACER // HORIZON RUNNER', { fontFamily: 'Courier', fontSize: '18px', color: '#ff2ec4', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20); this.add.text(628, 42, 'STEER A/D  THROTTLE W  BRAKE S  SHIFT SPACE  NITRO SHIFT', { fontFamily: 'Courier', fontSize: '9px', color: '#88aaaa' }).setOrigin(1, 0).setDepth(20); this.input.keyboard?.on('keydown-ESC', () => { this.scene.pause(); this.scene.launch('PauseScene', { scene: this.scene.key }); }); this.events.once('shutdown', () => this.ghost.save()); AudioEngine.playTrack('racer'); }
  update(_time: number, delta: number) { const left = InputManager.isP1Down('LEFT'); const right = InputManager.isP1Down('RIGHT'); const throttle = InputManager.isP1Down('UP') ? 1 : 0; const brake = InputManager.isP1Down('DOWN'); const shift = InputManager.isP1Down('FIRE'); const boosting = (InputManager.isDown('ShiftLeft') || (shift && this.gear === 5)) && this.nitro > 0; this.fixedRemainder = Math.min(1 / 15, this.fixedRemainder + Math.min(delta, 50) / 1000); let shifted = false; while (this.fixedRemainder >= RACER_TICK_SECONDS) { if (shift && !this.shiftHeld && !shifted) { this.gear = shiftGear(this.gear, brake ? -1 : 1); AudioEngine.playEffect('COIN'); shifted = true; } this.stepRacer(left, right, throttle, brake, boosting); this.fixedRemainder -= RACER_TICK_SECONDS; } this.shiftHeld = shift; this.drawRoad(); this.drawWorld(); this.emitExhaust(boosting); this.hud.setText(`SCORE ${this.score}  SPEED ${Math.floor(this.speed)}  GEAR ${this.gear}  NITRO ${Math.floor(this.nitro)}  GHOST ${Math.floor(this.ghostDistance - this.distance)}`); }
  private stepRacer(left: boolean, right: boolean, throttle: number, brake: boolean, boosting: boolean) { this.speed = advanceRacer(this.speed, throttle, brake, this.gear, RACER_TICK_SECONDS); if (boosting) { this.speed += 85 * RACER_TICK_SECONDS; this.nitro = Math.max(0, this.nitro - 28 * RACER_TICK_SECONDS); } else this.nitro = Math.min(100, this.nitro + 4 * RACER_TICK_SECONDS); this.playerLane = Phaser.Math.Clamp(this.playerLane + (left === right ? 0 : left ? -1 : 1) * RACER_TICK_SECONDS * (0.8 + this.speed / 260), -1.15, 1.15); this.distance += this.speed * RACER_TICK_SECONDS; this.score += Math.floor(this.speed * RACER_TICK_SECONDS * (boosting ? 2 : 1)); this.crashCooldown = Math.max(0, this.crashCooldown - RACER_TICK_SECONDS * 1000); this.updateGhost(RACER_TICK_SECONDS * 1000, RACER_TICK_SECONDS); }
  private emitExhaust(boosting: boolean) { if (this.speed < 24 || this.time.now < this.enginePulseAt) return; const playerX = 320 + this.playerLane * 150; const color = boosting ? 0x00ffff : 0xff2ec4; VFXManager.playEngineExhaust(this, playerX, 468, color); AudioEngine.playTone(72 + Math.min(260, this.speed * 1.35), 'sawtooth', 0.04); this.enginePulseAt = this.time.now + 135; }
  private updateGhost(delta: number, dt: number) { this.ghostDecisionMs -= delta; const sample = generateRoadSample(Math.floor(this.ghostDistance / 30) + 4); if (this.ghostDecisionMs <= 0) { const reward = this.ghostSpeed / 300 - Math.max(0, Math.abs(this.ghostLane) - 1) * 2; const steer = this.ghost.decide(racerSensors(this.ghostLane, sample.curve, this.ghostSpeed, 0, sample.lane * 0.72, 0.8), reward); this.ghostLane = Phaser.Math.Clamp(this.ghostLane + steer * 0.09, -1.15, 1.15); this.ghostDecisionMs = 80; } this.ghostSpeed = advanceRacer(this.ghostSpeed, 1, false, Math.min(5, 1 + Math.floor(this.ghostSpeed / 65)), dt); this.ghostDistance += this.ghostSpeed * dt; }
  private drawRoad() { const horizon = 132; const segment = Math.floor(this.distance / 20); const curve = generateRoadSample(segment).curve; const backdrop = generateHorizonBackdrop(segment); this.road.clear(); for (let y = 0; y < horizon; y += 4) { const blend = y / horizon; this.road.fillStyle(blendColor(backdrop.top, backdrop.bottom, blend)).fillRect(0, y, 640, 4); } this.road.fillStyle(backdrop.sun, 0.92).fillCircle(500, 72, 34); for (const building of backdrop.city) this.road.fillStyle(building.color, 0.85).fillRect(building.x, horizon - building.height, building.width, building.height); this.road.fillStyle(0x050817).fillRect(0, horizon, 640, 348); for (let y = horizon; y < 480; y += 4) { const projected = projectRoadScanline(y, horizon, 640, curve); const stripe = (Math.floor(this.distance / 8) + Math.floor((1 - projected.scale) * 24)) % 2 === 0; this.road.fillStyle(stripe ? 0x20243a : 0x171b2e).fillRect(projected.center - projected.halfWidth, y, projected.halfWidth * 2, 4); this.road.fillStyle(0xff2ec4).fillRect(projected.center - projected.halfWidth, y, Math.max(1, projected.scale * 6), 4).fillRect(projected.center + projected.halfWidth - Math.max(1, projected.scale * 6), y, Math.max(1, projected.scale * 6), 4); if (stripe) this.road.fillStyle(0xffffcc).fillRect(projected.center - 2, y, 4, Math.max(1, projected.scale * 4)); } }
  private drawWorld() {
    this.world.clear();
    const base = Math.floor(this.distance / 30);
    const patches = arcadeModRuntime.stagePatches();
    const objects = Array.from({ length: 18 }, (_, index) => {
      const sample = generateRoadSample(base + index); const depth = 1 - index / 19;
      return { ...sample, depth, lane: sample.lane * 0.72 };
    });
    for (const patch of patches) for (const hazard of patch.hazards.slice(0, 12)) objects.push({ ...generateRoadSample(base + hazard.lane * 7), depth: 1 - hazard.offset * 0.8, lane: (hazard.lane / 7) * 2 - 1 });
    objects.sort((a, b) => a.depth - b.depth);
    for (const object of objects) {
      const scale = object.depth * object.depth; const y = 132 + scale * 330;
      const center = projectRoadScanline(y, 132, 640, generateRoadSample(base).curve).center;
      const x = center + object.lane * scale * 250; const size = 4 + scale * 34;
      const color = object.roadside === 'TREE' ? 0x00ff88 : object.roadside === 'SIGN' ? 0xffff00 : 0x00ccff;
      this.world.fillStyle(color, 0.2).fillCircle(x, y - size * 0.45, size * 0.72);
      this.world.fillStyle(color).fillTriangle(x, y - size * 1.4, x - size * 0.55, y, x + size * 0.55, y);
      this.world.fillStyle(0xffffff, 0.55).fillRect(x - size * 0.3, y - size * 0.55, size * 0.6, Math.max(1, size * 0.12));
      const severity = collisionSeverity(this.playerLane, object.lane, object.depth);
      if (severity > 0 && this.crashCooldown === 0) { this.speed *= 0.42; this.crashCooldown = 800; VFXManager.screenShake(this, 0.012, 180); AudioEngine.playEffect('EXPLOSION'); }
    }
    const ghostX = 320 + this.ghostLane * 135;
    this.world.fillStyle(0x00aaff, 0.58).fillRoundedRect(ghostX - 17, 410, 34, 24, 6).fillStyle(0x07172a).fillRect(ghostX - 9, 413, 18, 7);
    const playerX = 320 + this.playerLane * 150; const car = this.crashCooldown > 0 ? 0xffffff : 0xff2ec4;
    this.world.fillStyle(0x050817).fillRoundedRect(playerX - 25, 449, 50, 28, 7);
    this.world.fillStyle(car).fillRoundedRect(playerX - 21, 445, 42, 27, 7);
    this.world.fillStyle(0x171b2e).fillRect(playerX - 12, 448, 24, 9);
    this.world.fillStyle(0x00ffff).fillRect(playerX - 17, 463, 10, 5).fillRect(playerX + 7, 463, 10, 5);
    this.world.lineStyle(1, 0xffffff, 0.8).strokeRoundedRect(playerX - 21, 445, 42, 27, 7);
    if (this.distance >= 10000 || this.ghostDistance >= 10000) this.finish();
  }
  private finish() { this.scene.pause(); this.ghost.save(); const key = `${this.difficulty}-${this.mode}`; const winner = this.distance >= this.ghostDistance ? 'HUMAN WINS' : 'GHOST WINS'; this.scene.launch('GameOverScene', { scene: this.scene.key, title: `FINISH LINE\n${winner}`, score: this.score, difficulty: key, restartData: { difficulty: this.difficulty, mode: this.mode }, submitScore: true, color: '#00ffcc' }); }
}
function blendColor(first: number, second: number, amount: number) { const blend = (shift: number) => Math.round(((first >>> shift) & 0xff) + (((second >>> shift) & 0xff) - ((first >>> shift) & 0xff)) * amount); return (blend(16) << 16) | (blend(8) << 8) | blend(0); }
