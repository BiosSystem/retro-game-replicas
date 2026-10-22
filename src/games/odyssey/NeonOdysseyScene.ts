import Phaser from "phaser";
import { AiDirector } from "../../ai/director/AiDirector";
import { traceAcoustics } from "../../audio/acoustics/AcousticTracer";
import { AudioEngine } from "../../engine/AudioEngine";
import { InputManager } from "../../engine/InputManager";
import { LodOctree } from "../../engine/voxel/LodOctree";
import {
  generateSurfaceNet,
  type SurfaceMesh,
} from "../../engine/voxel/SurfaceNets";
import { VoxelPlanet } from "../../engine/voxel/VoxelPlanet";
import { createAvatarDna } from "../../meta/dna/AvatarDna";
import { DnaStore } from "../../meta/dna/DnaGossip";
import {
  atmosphereFactor,
  flightAltitude,
  initialFlightState,
  marketQuote,
  stepFlight,
  type FlightState,
} from "./OdysseySystems";
export default class NeonOdysseyScene extends Phaser.Scene {
  private planet = new VoxelPlanet(0x0d155e, 96);
  private lod = new LodOctree(256, 5);
  private mesh!: SurfaceMesh;
  private ship: FlightState = initialFlightState();
  private director = new AiDirector(() => 0.51);
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private pressure = 0.5;
  private trades = 0;
  constructor() {
    super("OdysseyScene");
  }
  create() {
    this.planet = new VoxelPlanet(0x0d155e, 96);
    this.lod = new LodOctree(256, 5);
    this.ship = initialFlightState();
    this.director = new AiDirector(() => 0.51);
    this.trades = 0;
    try {
      const saved = localStorage.getItem("retro_odyssey_planet_v1");
      if (saved) this.planet.restore(JSON.parse(saved));
    } catch {
      localStorage.removeItem("retro_odyssey_planet_v1");
    }
    this.mesh = this.buildMesh();
    this.gfx = this.add.graphics();
    this.hud = this.add
      .text(10, 42, "", {
        fontFamily: "Courier",
        fontSize: "12px",
        color: "#fff",
      })
      .setDepth(5);
    this.add
      .text(320, 18, "NEON ODYSSEY // 6-DOF VOXEL FRONTIER", {
        fontFamily: "Courier",
        fontSize: "17px",
        color: "#00ffcc",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.input.keyboard?.on("keydown-T", () => this.trade());
    this.input.keyboard?.on("keydown-X", () => this.carve());
    this.input.keyboard?.on("keydown-ESC", () => this.exit());
    AudioEngine.playTrack("odyssey");
  }
  update(time: number, delta: number) {
    const input = {
      thrust: InputManager.isP1Down("FIRE") ? 1 : 0,
      strafeX:
        Number(InputManager.isDown("KeyE")) -
        Number(InputManager.isDown("KeyQ")),
      strafeY:
        Number(InputManager.isDown("ShiftLeft")) -
        Number(InputManager.isDown("ControlLeft")),
      pitch:
        Number(InputManager.isP1Down("DOWN")) -
        Number(InputManager.isP1Down("UP")),
      yaw:
        Number(InputManager.isP1Down("RIGHT")) -
        Number(InputManager.isP1Down("LEFT")),
      roll:
        Number(InputManager.isDown("KeyC")) -
        Number(InputManager.isDown("KeyZ")),
    };
    this.ship = stepFlight(this.ship, input, Math.min(50, delta) / 1000);
    const altitude = flightAltitude(this.ship, this.planet.radius),
      decision = this.director.update(time, {
        damageRate: 0,
        accuracy: 0.5,
        movementEntropy: Math.min(
          1,
          Math.abs(input.pitch) + Math.abs(input.yaw) + Math.abs(input.roll),
        ),
        nearMissRate: atmosphereFactor(altitude),
        lives: 3,
        stage: Math.floor(this.ship.tick / 3600) + 1,
      });
    this.pressure = decision.pressure;
    this.draw();
  }
  setAltitude(altitude: number) {
    this.ship.x = 0;
    this.ship.y = 0;
    this.ship.z = this.planet.radius + Math.max(-10, Math.min(2000, altitude));
    this.ship.vx = this.ship.vy = this.ship.vz = 0;
    return this.diagnostics();
  }
  diagnostics() {
    const altitude = flightAltitude(this.ship, this.planet.radius),
      nodes = this.lod.select({
        x: this.ship.x,
        y: this.ship.y,
        z: this.ship.z,
      }),
      acoustic = traceAcoustics(
        { x: this.ship.x + 20, y: this.ship.y, z: this.ship.z },
        { x: this.ship.x, y: this.ship.y, z: this.ship.z },
        (p) => -this.planet.density(p.x, p.y, p.z),
        32,
      );
    return {
      altitude,
      nodes: nodes.length,
      morphMin: Math.min(...nodes.map((n) => n.morph)),
      morphMax: Math.max(...nodes.map((n) => n.morph)),
      occlusion: acoustic.occlusion,
      diffraction: acoustic.diffraction,
    };
  }
  private buildMesh() {
    return generateSurfaceNet(
      18,
      240,
      { x: -120, y: -120, z: -120 },
      (x, y, z) => this.planet.density(x, y, z),
    );
  }
  private carve() {
    const length = Math.hypot(this.ship.x, this.ship.y, this.ship.z) || 1;
    this.planet.carve(
      {
        x: (this.ship.x / length) * this.planet.radius,
        y: (this.ship.y / length) * this.planet.radius,
        z: (this.ship.z / length) * this.planet.radius,
      },
      10,
      24,
    );
    this.mesh = this.buildMesh();
    localStorage.setItem(
      "retro_odyssey_planet_v1",
      JSON.stringify(this.planet.snapshot()),
    );
    AudioEngine.playEffect("EXPLOSION");
  }
  private trade() {
    const price = marketQuote(
      this.planet.seed,
      this.trades % 4,
      this.ship.tick,
      this.pressure,
    );
    if (this.ship.credits >= price) {
      this.ship.credits -= price;
      this.trades++;
      AudioEngine.playEffect("COIN");
    }
  }
  private draw() {
    const d = this.diagnostics(),
      atmosphere = atmosphereFactor(d.altitude),
      planetRadius = Phaser.Math.Clamp(
        22000 / Math.max(50, d.altitude + 120),
        126,
        190,
      );
    this.gfx
      .clear()
      .fillGradientStyle(0x020713, 0x020713, 0x0b1427, 0x030613)
      .fillRect(0, 0, 640, 480);
    this.gfx
      .fillStyle(0x23385b, 0.2)
      .fillCircle(110, 190, 120)
      .fillStyle(0x4a205b, 0.16)
      .fillCircle(540, 330, 150);
    for (let i = 0; i < 90; i++) {
      const x = (Math.imul(i + 1, 97) + this.ship.tick * 0.03) % 640,
        y = Math.imul(i + 3, 53) % 480;
      this.gfx.fillStyle(0xffffff, 0.2 + (i % 5) * 0.1).fillCircle(x, y, 1);
    }
    this.gfx
      .fillStyle(0x071c35 + Math.floor(atmosphere * 20) * 0x010100, 0.95)
      .fillCircle(320, 260, planetRadius);
    this.gfx
      .fillStyle(0x1e8878, 0.36)
      .fillEllipse(278, 220, planetRadius * .72, planetRadius * .34)
      .fillStyle(0x3c9b68, .29)
      .fillEllipse(362, 292, planetRadius * .88, planetRadius * .42)
      .fillStyle(0x8fc968, .22)
      .fillEllipse(302, 332, planetRadius * .52, planetRadius * .2)
      .fillStyle(0x020713, .42)
      .fillCircle(320 + planetRadius * .62, 260, planetRadius);
    this.gfx
      .lineStyle(2, 0x4bc7d2, 0.5)
      .strokeCircle(320, 260, planetRadius + 4);
    for (let band = -0.6; band <= 0.6; band += 0.3)
      this.gfx
        .lineStyle(1, 0x1a7586, 0.45)
        .strokeEllipse(
          320,
          260 + band * planetRadius,
          planetRadius * 1.65,
          Math.max(6, planetRadius * 0.24 * (1 - Math.abs(band) * 0.5)),
        );
    for (let arc = 0; arc < 4; arc++) this.gfx.lineStyle(1, arc % 2 ? 0x70fff0 : 0x4d86dd, .12 + arc * .05).strokeEllipse(320, 260, planetRadius * (2.25 + arc * .22), planetRadius * (.42 + arc * .08));
    const stride = Math.max(3, Math.floor(this.mesh.positions.length / 900));
    for (let i = 0; i < this.mesh.positions.length; i += stride) {
      const x = this.mesh.positions[i] ?? 0,
        y = this.mesh.positions[i + 1] ?? 0,
        z = this.mesh.positions[i + 2] ?? 0,
        scale = planetRadius / this.planet.radius;
      if (z > 0)
        this.gfx
          .fillStyle(0x00ffcc, 0.18)
          .fillCircle(320 + x * scale, 260 + y * scale, 1);
    }
    const shipY = Math.max(84, 260 - planetRadius - 24), shipPulse = 18 + Math.sin(this.ship.tick * .08) * 3;
    this.gfx.fillStyle(0xff2ec4, .1).fillCircle(320, shipY, shipPulse)
      .fillStyle(0x101a3b, .96).fillTriangle(320, shipY - 13, 307, shipY + 10, 333, shipY + 10)
      .lineStyle(2, 0xff62d4, .95).strokeTriangle(320, shipY - 13, 307, shipY + 10, 333, shipY + 10)
      .fillStyle(0xbfffff, .9).fillEllipse(320, shipY, 9, 6)
      .fillStyle(0x6efce8, .8).fillTriangle(313, shipY + 10, 318, shipY + 20, 320, shipY + 10).fillTriangle(320, shipY + 10, 322, shipY + 20, 327, shipY + 10);
    const beaconX = 320 + Math.cos(this.ship.tick * .012) * (planetRadius + 34), beaconY = 260 + Math.sin(this.ship.tick * .012) * (planetRadius + 34) * .35;
    this.gfx.fillStyle(0xffd65a, .16).fillCircle(beaconX, beaconY, 13).lineStyle(1, 0xffe89b, .85).strokeCircle(beaconX, beaconY, 5).lineBetween(beaconX - 8, beaconY, beaconX + 8, beaconY).lineBetween(beaconX, beaconY - 8, beaconX, beaconY + 8);
    this.hud.setText(
      `ALT ${d.altitude.toFixed(1)}  LOD NODES ${d.nodes}  MORPH ${d.morphMin.toFixed(2)}-${d.morphMax.toFixed(2)}\nVEL ${Math.hypot(this.ship.vx, this.ship.vy, this.ship.vz).toFixed(1)}  FUEL ${this.ship.fuel.toFixed(0)}  CR ${this.ship.credits}  TRADES ${this.trades}\nACOUSTIC OCC ${d.occlusion.toFixed(2)}  DIFF ${d.diffraction.toFixed(2)}  X CRATER  T TRADE`,
    );
  }
  private exit() {
    void this.publishDna();
    this.scene.start("LobbyScene");
  }
  private async publishDna() {
    try {
      const keys = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
          "sign",
          "verify",
        ])) as CryptoKeyPair,
        dna = await createAvatarDna(
          "PILOT",
          [
            {
              game: "OdysseyScene",
              score: this.ship.credits,
              wins: this.trades,
              plays: 1,
            },
          ],
          keys,
        );
      new DnaStore(localStorage).save(dna);
      window.dispatchEvent(
        new CustomEvent("arcade-dna-submit", { detail: dna }),
      );
    } catch {
      return;
    }
  }
}
