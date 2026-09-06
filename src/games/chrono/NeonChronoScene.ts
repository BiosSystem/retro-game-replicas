import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { solveCausality } from '../../engine/temporal/CausalSolver';
import { TemporalRing } from '../../engine/temporal/TemporalRing';
import { TimelineBrancher } from '../../engine/temporal/TimelineBranch';
import { AdaptiveRaymarch, integrateAtmosphere } from '../../graphics/volumetric/Scattering';
import { VOLUMETRIC_WGSL } from '../../graphics/volumetric/VolumetricCompute';
import { compileVolumetricPipeline } from '../../graphics/volumetric/VolumetricCompute';
import { generateChronoChamber, initialChronoState, packChronoState, stepChrono, temporalPitch, unpackChronoState, type ChronoState } from './ChronoSystems';

interface CloneState extends ChronoState { id: number; }

export default class NeonChronoScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private ring = new TemporalRing(8);
  private branches = new TimelineBrancher();
  private state = initialChronoState();
  private clones = new Map<number, CloneState>();
  private frame = 0;
  private rewinding = false;
  private chamber = generateChronoChamber(0);
  private raymarch = new AdaptiveRaymarch('MEDIUM');
  private lastTapeTone = 0;
  constructor() { super('ChronoScene'); }

  create() {
    this.ring = new TemporalRing(8); this.branches = new TimelineBrancher(); this.state = initialChronoState(); this.clones.clear(); this.frame = 0; this.rewinding = false; this.chamber = generateChronoChamber(0); this.ring.record(0, packChronoState(this.state));
    this.gfx = this.add.graphics(); this.hud = this.add.text(10, 43, '', { fontFamily: 'Courier', fontSize: '12px', color: '#ffffff' }).setDepth(5);
    this.add.text(320, 20, 'NEON CHRONO // CAUSALITY LAB', { fontFamily: 'Courier', fontSize: '18px', color: '#00ffcc', fontStyle: 'bold' }).setOrigin(.5).setDepth(5);
    this.add.text(320, 462, 'MOVE WASD  JUMP SPACE  REWIND R  SPAWN CLONE C  PAUSE ESC', { fontFamily: 'Courier', fontSize: '11px', color: '#88aacc' }).setOrigin(.5).setDepth(5);
    this.input.keyboard?.on('keydown-C', () => this.spawnClone()); this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene')); AudioEngine.playTrack('chrono');
  }

  update(time: number, delta: number) {
    const wantsRewind = InputManager.isDown('KeyR') && this.frame > this.ring.oldestFrame();
    if (wantsRewind) {
      this.rewinding = true; AudioEngine.setTrackTimeWarp(.125, -12); this.frame--; const restored = this.ring.decode(this.frame); if (restored) this.state = unpackChronoState(restored);
      if (time - this.lastTapeTone > 90) { AudioEngine.playTone(temporalPitch(Math.max(.125, this.frame / Math.max(1, this.ring.newestFrame())), true), 'sawtooth', .07); this.lastTapeTone = time; }
      this.draw(delta); return;
    }
    if (this.rewinding) { this.ring.truncate(this.frame); this.rewinding = false; }
    const mask = InputManager.getP1Mask();
    const inSlowField = Math.abs(this.state.x - this.chamber.slowField.x) <= this.chamber.slowField.radius;
    const timeScale = inSlowField ? .28 : 1;
    AudioEngine.setTrackTimeWarp(timeScale, inSlowField ? -7 : 0);
    this.state = stepChrono(this.state, mask, this.chamber, Math.min(50, delta) / 1000, timeScale);
    this.branches.recordInput(this.frame, mask); this.stepClones(Math.min(50, delta) / 1000);
    this.frame++; this.ring.record(this.frame, packChronoState(this.state)); this.draw(delta);
  }

  private spawnClone() {
    if (this.frame < 2) return;
    try { const branch = this.branches.spawn(Math.max(this.ring.oldestFrame(), this.frame - 180), this.frame - 1); this.clones.set(branch.id, { ...unpackChronoState(this.ring.decode(branch.sourceStart) ?? packChronoState(this.state)), id: branch.id }); AudioEngine.playEffect('POWER_UP'); } catch { /* Keep the bounded clone set active. */ }
  }

  private stepClones(dt: number) {
    const active = this.branches.step();
    for (const playback of active) { const clone = this.clones.get(playback.clone.id); if (clone) Object.assign(clone, stepChrono(clone, playback.mask, this.chamber, dt)); }
    const activeIds = new Set(active.map(value => value.clone.id)); for (const id of this.clones.keys()) if (!activeIds.has(id)) this.clones.delete(id);
    const bodies = [{ id: 0, timeline: 0, x: this.state.x, y: this.state.y, width: 18, height: 30, inverseMass: 1 }, ...[...this.clones.values()].map(clone => ({ id: clone.id, timeline: clone.id, x: clone.x, y: clone.y, width: 18, height: 30, inverseMass: 1 }))];
    const result = solveCausality(bodies, [{ id: 1, x: this.chamber.switchX, y: 416, width: 32, height: 12 }]);
    for (const body of result.bodies) { if (body.id === 0) { this.state.x = body.x; this.state.y = body.y; } else { const clone = this.clones.get(body.id); if (clone) { clone.x = body.x; clone.y = body.y; } } }
    this.state.gateOpen = result.pressedSwitches.includes(1);
  }

  private draw(delta: number) {
    const fog = integrateAtmosphere(80, .62, .7, this.raymarch.adapt(delta));
    this.gfx.clear().fillGradientStyle(0x030510, 0x07122b, 0x11113a, 0x030510).fillRect(0, 0, 640, 480);
    for (let i = 0; i < 18; i++) { const alpha = .025 + fog.luminance * .35; this.gfx.fillStyle(i % 2 ? 0x2244ff : 0x00ffcc, alpha).fillCircle((i * 83 + this.frame * .35) % 680 - 20, 76 + i * 19, 34 + i % 4 * 13); }
    for (let x = 28; x < 640; x += 64) this.gfx.lineStyle(1, 0x4d7dba, .12).lineBetween(x, 63, x - 42, 425);
    for (let y = 105; y < 425; y += 48) this.gfx.lineStyle(1, 0x31527f, .14).lineBetween(0, y, 640, y);
    this.gfx.fillStyle(0x0b1730, .92).fillRect(0, 425, 640, 20).fillRect(0, 45, 640, 18).lineStyle(1, 0x4ca6dd, .48).lineBetween(0, 63, 640, 63).lineBetween(0, 425, 640, 425);
    for (const platform of this.chamber.platforms) this.gfx.fillStyle(0x172b4e).fillRect(platform.x, platform.y, platform.width, 10).fillStyle(0x62d8ff, .85).fillRect(platform.x, platform.y, platform.width, 2).lineStyle(1, 0x38679a, .8).strokeRect(platform.x, platform.y, platform.width, 10);
    this.gfx.fillStyle(0x2566ff, .1).fillCircle(this.chamber.slowField.x, 300, this.chamber.slowField.radius).lineStyle(2, 0x4e8cff, .45).strokeCircle(this.chamber.slowField.x, 300, this.chamber.slowField.radius * .72).lineStyle(1, 0x94bcff, .35).strokeCircle(this.chamber.slowField.x, 300, this.chamber.slowField.radius * .42);
    this.gfx.fillStyle(0xff2ec4, .09).fillRect(this.chamber.gravityZone.x, 63, this.chamber.gravityZone.width, 362).lineStyle(1, 0xff77de, .45).strokeRect(this.chamber.gravityZone.x, 63, this.chamber.gravityZone.width, 362);
    for (const laser of this.chamber.lasers) this.gfx.fillStyle(0xff2255, .16).fillRect(laser.x - 3, laser.y, 9, laser.height).fillStyle(0xffb2c9, .9).fillRect(laser.x, laser.y, 3, laser.height);
    const gateColor = this.state.gateOpen ? 0x00ff6e : 0xff2255; this.gfx.fillStyle(gateColor, .2).fillRect(this.chamber.gateX - 6, 275, 22, 150).lineStyle(2, gateColor, .92).strokeRect(this.chamber.gateX - 4, 280, 18, 145);
    this.gfx.fillStyle(0x684c0a).fillRect(this.chamber.switchX - 18, 415, 36, 10).fillStyle(0xffd75a).fillRect(this.chamber.switchX - 14, 418, 28, 4);
    for (const clone of this.clones.values()) { this.gfx.fillStyle(0x00aaff, .16).fillCircle(clone.x, clone.y - 20, 20).fillStyle(0x3fd8ff, .58).fillRoundedRect(clone.x - 8, clone.y - 27, 16, 24, 4).fillStyle(0xc1f8ff, .7).fillCircle(clone.x, clone.y - 31, 6); }
    const playerColor = this.rewinding ? 0xff2ec4 : 0x00ffcc; this.gfx.fillStyle(playerColor, .16).fillCircle(this.state.x, this.state.y - 19, 23).fillStyle(playerColor, .92).fillRoundedRect(this.state.x - 8, this.state.y - 27, 16, 24, 4).fillStyle(0xe7ffff).fillCircle(this.state.x, this.state.y - 31, 6).lineStyle(2, playerColor, .85).lineBetween(this.state.x - 10, this.state.y, this.state.x + 10, this.state.y);
    const stats = this.ring.stats(); this.hud.setText(`FRAME ${this.frame}  HISTORY ${(stats.frames / 60).toFixed(1)}S  DELTA ${stats.ratio.toFixed(2)}X  CLONES ${this.clones.size}  FOG ${this.raymarch.count()} STEPS${this.rewinding ? '  REWIND' : ''}`);
  }

  temporalDiagnostics(frames = 240) {
    const run = () => { let state = initialChronoState(); const chamber = generateChronoChamber(3); for (let frame = 0; frame < frames; frame++) state = stepChrono(state, frame % 90 < 60 ? 8 : 4, chamber, 1 / 60, frame % 47 < 8 ? .28 : 1); return packChronoState(state); };
    const first = run(), second = run();
    const collision = () => solveCausality([{ id: 0, timeline: 0, x: 10, y: 10, width: 18, height: 30, inverseMass: 1 }, { id: 1, timeline: 1, x: 16, y: 10, width: 18, height: 30, inverseMass: 1 }], [{ id: 4, x: 30, y: 10, width: 8, height: 20 }]);
    const collisionA = collision(), collisionB = collision();
    return { deterministic: first.every((value, index) => value === second[index]), causalDeterministic: JSON.stringify(collisionA) === JSON.stringify(collisionB), state: Array.from(first), shaderBytes: VOLUMETRIC_WGSL.length };
  }
  async volumetricDiagnostics() { return { status: await compileVolumetricPipeline(), shaderBytes: VOLUMETRIC_WGSL.length }; }
}
