import Phaser from 'phaser';
import type { SpatialAudioBridge } from '../../audio/spatial/RelativisticAudioWorklet';
import { AudioEngine } from '../../engine/AudioEngine';
import { InputManager } from '../../engine/InputManager';
import { projectSplatCloud } from '../../graphics/volumetric/splatting';
import { SimdPhysicsCore } from '../../engine/physics/simd';
import { arcadeSaveStates, epochSaveBridge, type EpochSaveProvider } from '../../engine/persistence/SaveStateServices';
import { captureSaveThumbnail } from '../../engine/persistence/SaveStateThumbnail';
import { epochCore, epochDiagnostics, epochWeather } from './EpochSystems';
import { ArcadeHud } from '../../ui/arcade/NeonUi';

export default class NeonEpochScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: ArcadeHud;
  private readonly seed = 173;
  private core = epochCore(this.seed);
  private cameraX = 0;
  private cameraZ = -58;
  private heading = 0;
  private elapsed = 0;
  private spatialAudio: SpatialAudioBridge | null = null;
  private spatialAudioPending: Promise<SpatialAudioBridge | null> | null = null;
  private readonly audioBlock = new Float32Array(1_024);
  private audioPhase = 0;
  private audioConfigureFrame = 0;
  private spatialUnderruns = 0;
  private simdPhysics: SimdPhysicsCore | null = null;
  private readonly saveStates = arcadeSaveStates;
  private readonly saveProvider: EpochSaveProvider = {
    save: async slot => { await this.persistState(slot); },
    load: async slot => { await this.restoreSlot(slot, true); },
  };

  constructor() { super('EpochScene'); }

  create() {
    this.core = epochCore(this.seed);
    this.cameraX = 0;
    this.cameraZ = -58;
    this.heading = 0;
    this.elapsed = 0;
    this.spatialUnderruns = 0;
    this.gfx = this.add.graphics();
    this.hud = new ArcadeHud(this, 8, 8, 624, 0x8effc1);
    this.add.text(320, 462, 'WASD TRAVERSE  Q/E TURN  ESC PAUSE', { fontFamily: 'Courier', fontSize: '11px', color: '#9db7aa' }).setOrigin(0.5).setDepth(5);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene'));
    AudioEngine.playTrack('odyssey');
    void this.initializeSpatialAudio();
    void this.restoreState();
    this.time.addEvent({ delay: 15_000, loop: true, callback: () => this.scheduleAutosave() });
    this.events.once('shutdown', () => {
      this.saveStates.cancelAutosave();
      void this.persistState('neon_epoch', false);
      epochSaveBridge.detach(this.saveProvider);
      this.spatialAudio?.close();
      this.spatialAudio = null;
    });
    this.draw();
  }

  update(_time: number, delta: number) {
    const dt = Math.max(0, Math.min(0.05, delta / 1000));
    this.elapsed += dt;
    this.heading += (Number(InputManager.isDown('KeyE')) - Number(InputManager.isDown('KeyQ'))) * dt * 1.2;
    const forward = Number(InputManager.isDown('KeyW')) - Number(InputManager.isDown('KeyS'));
    const strafe = Number(InputManager.isDown('KeyD')) - Number(InputManager.isDown('KeyA'));
    this.cameraX += (Math.cos(this.heading) * strafe + Math.sin(this.heading) * forward) * dt * 14;
    this.cameraZ += (Math.cos(this.heading) * forward - Math.sin(this.heading) * strafe) * dt * 14;
    if (Math.floor(this.elapsed * 10) % 4 === 0) this.core.fluid.step();
    this.renderSpatialAudio();
    this.draw();
  }

  private async initializeSpatialAudio() {
    if (this.spatialAudio) return this.spatialAudio;
    this.spatialAudioPending ??= AudioEngine.createRelativisticSpatialBridge();
    this.spatialAudio = await this.spatialAudioPending;
    this.spatialAudioPending = null;
    return this.spatialAudio;
  }

  private async restoreState() {
    this.simdPhysics = await SimdPhysicsCore.create();
    if (this.simdPhysics && this.scene.isActive()) epochSaveBridge.attach(this.saveProvider);
    await this.restoreSlot('neon_epoch', false);
  }

  private async restoreSlot(slot: string, required: boolean) {
    if (!this.simdPhysics) {
      if (required) throw new Error('Wasm physics state is still initializing');
      return;
    }
    const saved = await this.saveStates.load(slot);
    if (!saved) {
      if (required) throw new Error('Save slot is empty');
      return;
    }
    if (saved.epochSeed !== this.seed) throw new Error('Save slot belongs to another world seed');
    if (!this.scene.isActive()) return;
    this.simdPhysics.restoreMemory(saved.wasmMemory);
    this.cameraX = saved.players[0].x;
    this.cameraZ = saved.players[0].y;
    this.heading = saved.players[0].vx ?? 0;
    this.draw();
  }

  private scheduleAutosave() {
    if (!this.simdPhysics) return;
    this.saveStates.scheduleAutosave(() => ({
      slot: 'neon_epoch',
      wasmMemory: this.simdPhysics!.copyMemory(),
      players: [{ x: this.cameraX, y: this.cameraZ, vx: this.heading }],
      epochSeed: this.seed,
      thumbnail: captureSaveThumbnail(this.game.canvas),
    }), 250);
  }

  private async persistState(slot = 'neon_epoch', required = true) {
    if (!this.simdPhysics) {
      if (required) throw new Error('Wasm physics state is still initializing');
      return;
    }
    await this.saveStates.save({
      slot,
      wasmMemory: this.simdPhysics.copyMemory(),
      players: [{ x: this.cameraX, y: this.cameraZ, vx: this.heading }],
      epochSeed: this.seed,
      thumbnail: captureSaveThumbnail(this.game.canvas),
    });
  }

  private renderSpatialAudio() {
    if (!this.spatialAudio) return;
    const weather = epochWeather(this.seed, this.elapsed);
    const frequency = 72 + weather.rain * 44 + Math.abs(weather.wind);
    for (let index = 0; index < this.audioBlock.length; index++) {
      this.audioPhase = (this.audioPhase + frequency / 48_000) % 1;
      const wind = Math.sin(this.audioPhase * Math.PI * 2) * 0.035;
      const rain = Math.sin(this.audioPhase * Math.PI * 2 * 5.03) * weather.rain * 0.018;
      this.audioBlock[index] = wind + rain;
    }
    this.spatialAudio.write(this.audioBlock);
    const underruns = this.spatialAudio.underruns();
    if (underruns > this.spatialUnderruns) {
      window.dispatchEvent(new CustomEvent('arcade-audio-underrun', { detail: { count: underruns - this.spatialUnderruns } }));
      this.spatialUnderruns = underruns;
    }
    if (++this.audioConfigureFrame % 30 === 0) this.spatialAudio.configure({ distanceMeters: 12 + weather.rain * 38, listenerTowardSource: Math.sin(this.heading) * 8, sourceTowardListener: weather.wind * 0.35, timeDilation: 1, speedOfSound: 343 });
  }

  private draw() {
    const graphics = this.gfx.clear();
    const weather = epochWeather(this.seed, this.elapsed);
    const sky = Phaser.Display.Color.GetColor(4 + Math.round(weather.cloudCover * 8), 19 + Math.round((1 - weather.cloudCover) * 20), 29 + Math.round((1 - weather.cloudCover) * 32));
    graphics.fillGradientStyle(sky, sky, 0x07190f, 0x020705).fillRect(0, 0, 640, 480);
    graphics.fillStyle(0x0c2517, 0.95).fillRect(0, 280, 640, 180);
    const projected = projectSplatCloud(this.core.cloud, { x: this.cameraX, y: 5, z: this.cameraZ, yaw: this.heading, pitch: -0.03, focalLength: 330, near: 0.5 }, 640, 480, 1_000);
    for (const splat of projected) {
      const color = Phaser.Display.Color.GetColor(Math.min(255, Math.round(splat.red * 255)), Math.min(255, Math.round(splat.green * 255)), Math.min(255, Math.round(splat.blue * 255)));
      graphics.fillStyle(color, Math.min(0.72, splat.opacity)).fillEllipse(splat.x, splat.y, Math.min(42, splat.radiusX * 5), Math.min(36, splat.radiusY * 5));
    }
    for (let index = 0; index < Math.floor(weather.rain * 90); index++) {
      const x = (index * 83 + Math.floor(this.elapsed * weather.wind * 9)) % 680 - 20;
      const y = (index * 47 + Math.floor(this.elapsed * 210)) % 430;
      graphics.lineStyle(1, 0x9cecff, 0.26).lineBetween(x, y, x - weather.wind * 0.18, y + 9);
    }
    for (let x = 0; x < this.core.fluid.width; x++) {
      const value = this.core.fluid.cells[(this.core.fluid.height - 1) * this.core.fluid.width + x];
      if (value) graphics.fillStyle(0x18bfff, 0.12 + value / 512).fillRect(x * (640 / this.core.fluid.width), 411 - value * 0.04, 14, 20 + value * 0.04);
    }
    graphics.fillStyle(0xffffff, 0.9).fillCircle(320, 247, 3).lineStyle(1, 0x8effc1, 0.7).strokeCircle(320, 247, 8);
    this.hud.set({ score: this.core.cloud.count, stage: this.core.architectures, health: 100 - weather.rain * 40, status: `${weather.temperature.toFixed(1)} C  WIND ${weather.wind.toFixed(1)}  SAVE ${this.saveStates.backend}` });
  }

  async epochDiagnostics() {
    await this.initializeSpatialAudio();
    return { ...await epochDiagnostics(this.seed), workletMode: this.spatialAudio?.mode ?? 'UNAVAILABLE' };
  }
}
