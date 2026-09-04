import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { VFXManager } from '../../engine/VFXManager';
import { CoopSession, type ArcadeMode } from '../../multiplayer/CoopSession';
import type { PlayerId } from '../../multiplayer/MultiInput';
import { ArcadeHud } from '../../ui/arcade/NeonUi';
import { deterministicLane, isNear, relayWave, type CabinetDifficulty, type WaveSpec } from './CabinetWaveSystems';
import relayRooftop from '../../assets/relay/neon-relay-rooftop-v3.jpg';

interface RelayShot { sprite: Phaser.GameObjects.Rectangle; owner: PlayerId; }
interface RelayDrone { sprite: Phaser.GameObjects.Polygon; hp: number; }

export default class NeonRelayScene extends Phaser.Scene {
  private readonly lanes = [112, 216, 320, 424, 528];
  private readonly ships = new Map<PlayerId, Phaser.GameObjects.Triangle>();
  private shots: RelayShot[] = [];
  private drones: RelayDrone[] = [];
  private session = new CoopSession('SOLO');
  private hud!: ArcadeHud;
  private stage = 1;
  private score = 0;
  private integrity = 6;
  private spawned = 0;
  private nextSpawnAt = 0;
  private fireReady: Record<PlayerId, number> = { 1: 0, 2: 0 };
  private difficulty: CabinetDifficulty = 'NORMAL';
  private mode: ArcadeMode = 'SOLO';
  private wave!: WaveSpec;
  private ended = false;

  constructor() { super('RelayScene'); }

  preload() {
    if (!this.textures.exists('neon-relay-rooftop')) this.load.image('neon-relay-rooftop', relayRooftop);
  }

  create(data: { difficulty?: CabinetDifficulty; mode?: ArcadeMode }) {
    this.difficulty = data?.difficulty ?? 'NORMAL';
    this.mode = data?.mode ?? 'SOLO';
    this.session = new CoopSession(this.mode); this.stage = 1; this.score = 0; this.ended = false;
    this.shots = []; this.drones = []; this.fireReady = { 1: 0, 2: 0 };
    this.createStage();
    this.add.image(320, 240, 'neon-relay-rooftop').setScale(2).setDepth(-3);
    this.add.rectangle(320, 240, 640, 480, 0x020611, 0.28).setDepth(-2);
    this.add.text(320, 14, 'NEON RELAY // SIGNAL DEFENSE', { fontFamily: 'Courier', fontSize: '19px', color: '#00eaff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(628, 42, 'MOVE A/D OR ARROWS  FIRE SPACE/ENTER  ESC PAUSE', { fontFamily: 'Courier', fontSize: '9px', color: '#7799aa' }).setOrigin(1, 0);
    this.hud = new ArcadeHud(this, 8, 38, 624, 0x00dfff);
    for (const x of this.lanes) this.add.line(x, 96, 0, 0, 0, 315, 0x00dfff, 0.18);
    this.add.rectangle(320, 442, 564, 22, 0x06273d, 0.82).setStrokeStyle(2, 0x00dfff, 0.7);
    this.createShip(1, 320, 407, 0x00ffff);
    if (this.mode !== 'SOLO') this.createShip(2, 424, 407, 0xffff44);
    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => AudioEngine.stopTrack());
    AudioEngine.playTrack('vector'); this.updateHud();
  }

  update(_time: number, delta: number) {
    if (this.ended) return;
    const dt = Math.min(delta, 50) / 1000;
    this.moveShip(1, dt); if (this.ships.has(2)) this.moveShip(2, dt);
    this.spawnDrones(); this.stepShots(dt); this.stepDrones(dt);
    if (this.spawned >= this.wave.count && this.drones.length === 0) {
      this.stage += 1; this.createStage(); AudioEngine.playEffect('STAGE_CLEAR'); VFXManager.floatingText(this, 320, 245, `RELAY TIER ${this.stage}`, '#00ffff');
    }
  }

  private createStage() {
    this.wave = relayWave(this.stage, this.difficulty); this.integrity = Math.min(6, Math.max(this.integrity || 6, this.wave.integrity)); this.spawned = 0; this.nextSpawnAt = this.time?.now ?? 0;
  }

  private createShip(player: PlayerId, x: number, y: number, color: number) {
    const ship = this.add.triangle(x, y, 0, 18, 18, 18, 9, 0, color).setStrokeStyle(2, 0xffffff, 0.75);
    ship.setData('player', player); this.ships.set(player, ship);
  }

  private moveShip(player: PlayerId, dt: number) {
    const ship = this.ships.get(player); if (!ship) return;
    const left = player === 1 ? InputManager.isP1Down('LEFT') : InputManager.isP2Down('LEFT');
    const right = player === 1 ? InputManager.isP1Down('RIGHT') : InputManager.isP2Down('RIGHT');
    ship.x = Phaser.Math.Clamp(ship.x + (left === right ? 0 : left ? -1 : 1) * 270 * dt, 52, 588);
    const fire = player === 1 ? InputManager.isP1Down('FIRE') : InputManager.isP2Down('FIRE');
    if (fire && this.time.now >= this.fireReady[player]) this.fire(ship, player);
  }

  private fire(ship: Phaser.GameObjects.Triangle, owner: PlayerId) {
    const shot = this.add.rectangle(ship.x, ship.y - 20, 4, 16, owner === 1 ? 0x00ffff : 0xffff44);
    this.shots.push({ sprite: shot, owner }); this.fireReady[owner] = this.time.now + 150; AudioEngine.playEffect('LASER');
  }

  private spawnDrones() {
    while (this.spawned < this.wave.count && this.time.now >= this.nextSpawnAt) {
      const lane = deterministicLane(this.stage, this.spawned, this.lanes.length);
      const x = this.lanes[lane]; const hp = this.stage % 5 === 0 && this.spawned === 0 ? 3 : 1;
      const color = hp > 1 ? 0xff2ec4 : lane % 2 ? 0x50aaff : 0x00ff9d;
      const sprite = this.add.polygon(x, 75, [0, -12, 11, 0, 0, 12, -11, 0], color).setStrokeStyle(2, 0xffffff, 0.45);
      sprite.setData('speed', this.wave.speed + lane * 3); this.drones.push({ sprite, hp }); this.spawned += 1; this.nextSpawnAt += this.wave.intervalMs;
    }
  }

  private stepShots(dt: number) {
    for (const shot of [...this.shots]) {
      shot.sprite.y -= 520 * dt;
      const drone = this.drones.find(candidate => isNear(shot.sprite.x, shot.sprite.y, candidate.sprite.x, candidate.sprite.y, 17));
      if (drone) { this.damageDrone(drone, shot.owner); shot.sprite.destroy(); this.shots = this.shots.filter(candidate => candidate !== shot); }
      else if (shot.sprite.y < 62) { shot.sprite.destroy(); this.shots = this.shots.filter(candidate => candidate !== shot); }
    }
  }

  private stepDrones(dt: number) {
    for (const drone of [...this.drones]) {
      drone.sprite.y += Number(drone.sprite.getData('speed')) * dt;
      drone.sprite.rotation += dt * 2.4;
      if (drone.sprite.y < 420) continue;
      VFXManager.playExplosion(this, drone.sprite.x, 432, 0xff2255); drone.sprite.destroy(); this.drones = this.drones.filter(candidate => candidate !== drone);
      this.integrity -= 1; AudioEngine.playEffect('EXPLOSION'); VFXManager.screenShake(this, 0.012, 120); this.updateHud();
      if (this.integrity <= 0) this.finish();
    }
  }

  private damageDrone(drone: RelayDrone, owner: PlayerId) {
    drone.hp -= 1; VFXManager.playHit(this, drone.sprite.x, drone.sprite.y, 0x00ffff);
    if (drone.hp > 0) { drone.sprite.setFillStyle(0xffffff); return; }
    this.session.score(owner, 40 + this.stage * 8, this.time.now); this.score = this.session.totalScore();
    VFXManager.playExplosion(this, drone.sprite.x, drone.sprite.y, 0x00dfff); drone.sprite.destroy(); this.drones = this.drones.filter(candidate => candidate !== drone); AudioEngine.playEffect('EXPLOSION'); this.updateHud();
  }

  private updateHud() {
    const state = this.session.snapshot();
    this.hud?.set({ score: this.score, stage: this.stage, health: this.integrity / 6 * 100, combo: state.multiplier, status: `${this.mode}  RELAY ${this.integrity}/6  WAVE ${this.spawned}/${this.wave?.count ?? 0}` });
  }

  private openPause() { if (!this.ended) { this.scene.pause(); this.scene.launch('PauseScene', { scene: this.scene.key }); } }
  private finish() {
    if (this.ended) return;
    this.ended = true; this.scene.pause(); this.scene.launch('GameOverScene', { scene: this.scene.key, title: `RELAY LOST\nTIER ${this.stage}`, score: this.score, difficulty: `${this.difficulty}-${this.mode}`, restartData: { difficulty: this.difficulty, mode: this.mode }, submitScore: true, color: '#00dfff' });
  }
}
