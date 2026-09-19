import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { VFXManager } from '../../engine/VFXManager';
import { CoopSession, type ArcadeMode } from '../../multiplayer/CoopSession';
import type { PlayerId } from '../../multiplayer/MultiInput';
import { ArcadeHud } from '../../ui/arcade/NeonUi';
import { deterministicAngle, shortestAngleDelta, spiralWave, type CabinetDifficulty, type WaveSpec } from './CabinetWaveSystems';

interface SpiralShot { sprite: Phaser.GameObjects.Rectangle; angle: number; owner: PlayerId; radius: number; }
interface SpiralWisp { sprite: Phaser.GameObjects.Image; angle: number; radius: number; hp: number; }

const CENTER_X = 320;
const CENTER_Y = 268;
const ORBIT_RADIUS = 150;

export default class NeonSpiralScene extends Phaser.Scene {
  private readonly pilots = new Map<PlayerId, Phaser.GameObjects.Image>();
  private readonly angles: Record<PlayerId, number> = { 1: -Math.PI / 2, 2: Math.PI / 2 };
  private shots: SpiralShot[] = [];
  private wisps: SpiralWisp[] = [];
  private session = new CoopSession('SOLO');
  private hud!: ArcadeHud;
  private stage = 1;
  private score = 0;
  private shields = 5;
  private spawned = 0;
  private nextSpawnAt = 0;
  private fireReady: Record<PlayerId, number> = { 1: 0, 2: 0 };
  private difficulty: CabinetDifficulty = 'NORMAL';
  private mode: ArcadeMode = 'SOLO';
  private wave!: WaveSpec;
  private ended = false;

  constructor() { super('SpiralScene'); }

  create(data: { difficulty?: CabinetDifficulty; mode?: ArcadeMode }) {
    this.difficulty = data?.difficulty ?? 'NORMAL'; this.mode = data?.mode ?? 'SOLO'; this.session = new CoopSession(this.mode);
    this.stage = 1; this.score = 0; this.shields = 5; this.spawned = 0; this.shots = []; this.wisps = []; this.fireReady = { 1: 0, 2: 0 }; this.ended = false;
    this.createTextures();
    this.add.rectangle(320, 240, 640, 480, 0x090012).setDepth(-2);
    this.add.grid(320, 260, 640, 440, 32, 32, 0x090012, 1, 0xff2ec4, 0.08).setDepth(-1);
    for (let index = 0; index < 42; index++) {
      const x = (index * 149 + 37) % 640; const y = 76 + (index * 83) % 382; const radius = index % 7 === 0 ? 2 : 1;
      this.add.circle(x, y, radius, index % 3 ? 0x9d5cff : 0x00dfff, 0.22 + (index % 5) * 0.08).setDepth(-1);
    }
    this.add.text(320, 14, 'PRISM SPIRAL // ORBITAL SURVIVAL', { fontFamily: 'Courier', fontSize: '19px', color: '#ff2ec4', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(628, 42, 'ORBIT A/D OR ARROWS  FIRE SPACE/ENTER  ESC PAUSE', { fontFamily: 'Courier', fontSize: '9px', color: '#aa7799' }).setOrigin(1, 0);
    for (const radius of [72, 112, ORBIT_RADIUS, 196]) this.add.circle(CENTER_X, CENTER_Y, radius).setStrokeStyle(1, radius === ORBIT_RADIUS ? 0xff2ec4 : 0x602050, radius === ORBIT_RADIUS ? 0.65 : 0.22);
    this.add.star(CENTER_X, CENTER_Y, 8, 16, 31, 0xfff2aa).setStrokeStyle(2, 0xff2ec4, 0.75);
    this.hud = new ArcadeHud(this, 8, 38, 624, 0xff2ec4);
    this.createPilot(1, 0x00ffff); if (this.mode !== 'SOLO') this.createPilot(2, 0xffff44);
    this.createStage(); this.input.keyboard?.on('keydown-ESC', () => this.openPause());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => AudioEngine.stopTrack()); AudioEngine.playTrack('racer'); this.updateHud();
  }

  update(_time: number, delta: number) {
    if (this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    this.movePilot(1, dt); if (this.pilots.has(2)) this.movePilot(2, dt);
    this.spawnWisps(); this.stepShots(dt); this.stepWisps(dt);
    if (this.spawned >= this.wave.count && this.wisps.length === 0) {
      this.stage += 1; this.createStage(); AudioEngine.playEffect('STAGE_CLEAR'); VFXManager.floatingText(this, CENTER_X, CENTER_Y, `PRISM TIER ${this.stage}`, '#ffddff');
    }
  }

  private createStage() { this.wave = spiralWave(this.stage, this.difficulty); this.spawned = 0; this.nextSpawnAt = this.time?.now ?? 0; }
  private createPilot(player: PlayerId, color: number) { const pilot = this.add.image(0, 0, 'spiral-pilot').setTint(color); this.pilots.set(player, pilot); this.positionPilot(player); }
  private positionPilot(player: PlayerId) {
    const pilot = this.pilots.get(player); if (!pilot) return;
    const angle = this.angles[player]; pilot.setPosition(CENTER_X + Math.cos(angle) * ORBIT_RADIUS, CENTER_Y + Math.sin(angle) * ORBIT_RADIUS).setRotation(angle + Math.PI / 2);
  }

  private movePilot(player: PlayerId, dt: number) {
    const left = player === 1 ? InputManager.isP1Down('LEFT') : InputManager.isP2Down('LEFT');
    const right = player === 1 ? InputManager.isP1Down('RIGHT') : InputManager.isP2Down('RIGHT');
    this.angles[player] += (left === right ? 0 : left ? -1 : 1) * dt * 2.8; this.positionPilot(player);
    const fire = player === 1 ? InputManager.isP1Down('FIRE') : InputManager.isP2Down('FIRE');
    if (fire && this.time.now >= this.fireReady[player]) this.fire(player);
  }

  private fire(owner: PlayerId) {
    const angle = this.angles[owner]; const radius = ORBIT_RADIUS + 16;
    const shot = this.add.rectangle(CENTER_X + Math.cos(angle) * radius, CENTER_Y + Math.sin(angle) * radius, 14, 4, owner === 1 ? 0x00ffff : 0xffff44).setRotation(angle);
    this.shots.push({ sprite: shot, angle, owner, radius }); this.fireReady[owner] = this.time.now + 135; AudioEngine.playEffect('LASER');
  }

  private spawnWisps() {
    while (this.spawned < this.wave.count && this.time.now >= this.nextSpawnAt) {
      const angle = deterministicAngle(this.stage, this.spawned); const hp = this.stage % 4 === 0 && this.spawned === 0 ? 3 : 1;
      const sprite = this.add.image(0, 0, 'spiral-wisp').setTint(hp > 1 ? 0xff2255 : 0xb638ff).setScale(hp > 1 ? 1.35 : 1);
      this.wisps.push({ sprite, angle, radius: 242, hp }); this.positionWisp(this.wisps[this.wisps.length - 1]); this.spawned += 1; this.nextSpawnAt += this.wave.intervalMs;
    }
  }

  private stepShots(dt: number) {
    for (const shot of [...this.shots]) {
      shot.radius += 500 * dt; shot.sprite.setPosition(CENTER_X + Math.cos(shot.angle) * shot.radius, CENTER_Y + Math.sin(shot.angle) * shot.radius);
      const target = this.wisps.find(wisp => Math.abs(shortestAngleDelta(shot.angle, wisp.angle)) < 0.09 && Math.abs(shot.radius - wisp.radius) < 18);
      if (target) { this.damageWisp(target, shot.owner); this.destroyShot(shot); }
      else if (shot.radius > 272) this.destroyShot(shot);
    }
  }

  private stepWisps(dt: number) {
    for (const wisp of [...this.wisps]) {
      wisp.radius -= this.wave.speed * dt; wisp.angle += Math.sin(wisp.radius * 0.06 + this.stage) * dt * 0.38; this.positionWisp(wisp);
      if (wisp.radius > ORBIT_RADIUS - 14) continue;
      VFXManager.playExplosion(this, wisp.sprite.x, wisp.sprite.y, 0xff2255); wisp.sprite.destroy(); this.wisps = this.wisps.filter(candidate => candidate !== wisp); this.shields -= 1;
      AudioEngine.playEffect('EXPLOSION'); VFXManager.screenShake(this, 0.013, 130); this.updateHud(); if (this.shields <= 0) this.finish();
    }
  }

  private damageWisp(wisp: SpiralWisp, owner: PlayerId) {
    wisp.hp -= 1; VFXManager.playHit(this, wisp.sprite.x, wisp.sprite.y, 0xffaaff);
    if (wisp.hp > 0) { wisp.sprite.setTint(0xffffff); return; }
    this.session.score(owner, 50 + this.stage * 10, this.time.now); this.score = this.session.totalScore(); VFXManager.playExplosion(this, wisp.sprite.x, wisp.sprite.y, 0xff2ec4);
    wisp.sprite.destroy(); this.wisps = this.wisps.filter(candidate => candidate !== wisp); AudioEngine.playEffect('EXPLOSION'); this.updateHud();
  }

  private createTextures() {
    const make = (key: string, size: number, draw: (graphics: Phaser.GameObjects.Graphics) => void) => { if (this.textures.exists(key)) return; const graphics = this.add.graphics(); draw(graphics); graphics.generateTexture(key, size, size); graphics.destroy(); };
    make('spiral-pilot', 28, graphics => { graphics.fillStyle(0x32135c).fillTriangle(14, 1, 27, 23, 14, 19).fillTriangle(14, 1, 1, 23, 14, 19); graphics.fillStyle(0xffffff, .9).fillTriangle(14, 5, 20, 20, 14, 16).fillTriangle(14, 5, 8, 20, 14, 16); graphics.fillStyle(0x080014).fillCircle(14, 12, 3); graphics.lineStyle(1, 0xffffff, .85).strokeTriangle(14, 1, 27, 23, 14, 19).strokeTriangle(14, 1, 1, 23, 14, 19); });
    make('spiral-wisp', 26, graphics => { graphics.fillStyle(0x36114f, .9).fillCircle(13, 13, 11).fillTriangle(13, 0, 17, 8, 9, 8).fillTriangle(13, 26, 17, 18, 9, 18).fillTriangle(0, 13, 8, 9, 8, 17).fillTriangle(26, 13, 18, 9, 18, 17); graphics.fillStyle(0xffffff, .75).fillCircle(13, 13, 5); graphics.fillStyle(0x13051d).fillCircle(13, 13, 2); graphics.lineStyle(1, 0xffd5ff, .85).strokeCircle(13, 13, 11); });
  }

  private positionWisp(wisp: SpiralWisp) { wisp.sprite.setPosition(CENTER_X + Math.cos(wisp.angle) * wisp.radius, CENTER_Y + Math.sin(wisp.angle) * wisp.radius); }
  private destroyShot(shot: SpiralShot) { shot.sprite.destroy(); this.shots = this.shots.filter(candidate => candidate !== shot); }
  private updateHud() { const state = this.session.snapshot(); this.hud?.set({ score: this.score, stage: this.stage, health: this.shields / 5 * 100, combo: state.multiplier, status: `${this.mode}  SHIELD ${this.shields}/5  WAVE ${this.spawned}/${this.wave?.count ?? 0}` }); }
  private openPause() { if (!this.ended) { this.scene.pause(); this.scene.launch('PauseScene', { scene: this.scene.key }); } }
  private finish() { if (this.ended) return; this.ended = true; this.scene.pause(); this.scene.launch('GameOverScene', { scene: this.scene.key, title: `ORBIT COLLAPSED\nTIER ${this.stage}`, score: this.score, difficulty: `${this.difficulty}-${this.mode}`, restartData: { difficulty: this.difficulty, mode: this.mode }, submitScore: true, color: '#ff2ec4' }); }
}
