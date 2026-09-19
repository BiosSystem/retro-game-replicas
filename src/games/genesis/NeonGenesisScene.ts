import Phaser from "phaser";
import {
  createPopulation,
  type Habitat,
} from "../../ai/genetics/GeneticEngine";
import { GeneticWorkerClient } from "../../ai/genetics/GeneticWorkerClient";
import { SwarmSociety, type SocietyRound } from "../../ai/swarm/SocietyEngine";
import { AudioEngine } from "../../engine/AudioEngine";
import { InputManager } from "../../engine/InputManager";
import {
  QuantumStateSolver,
  equalSuperposition,
} from "../../engine/quantum/QuantumStateSolver";
import { QuantumMeshSync } from "../../engine/quantum/QuantumCrdt";
import { VoxelPlanet } from "../../engine/voxel/VoxelPlanet";
import type { UnifiedTransport } from "../../net/transport/UnifiedTransport";
import { generateNexusCabinets } from "../nexus/NexusSystems";
import { genesisStability, habitatFromTerrain } from "./GenesisSystems";

export default class NeonGenesisScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private dialogue!: Phaser.GameObjects.Text;
  private x = 0;
  private z = 0;
  private deformation = 0;
  private generation = 0;
  private population: Float32Array<ArrayBufferLike> = createPopulation(256, 31);
  private fitness = 0;
  private diversity = 0;
  private nextEvolution = 0;
  private evolving = false;
  private evolutionBackend: "PENDING" | "WORKER" | "CPU" = "PENDING";
  private nextSociety = 0;
  private societyRound?: SocietyRound;
  private worker?: GeneticWorkerClient;
  private society = new SwarmSociety(24, 37);
  private quantum = new QuantumStateSolver(41);
  private readonly mesh = new QuantumMeshSync();
  private readonly observed = new Set<string>();
  private planet = new VoxelPlanet(43, 96);
  private readonly cabinets = generateNexusCabinets(47, 3);
  constructor() {
    super("GenesisScene");
  }
  create() {
    this.x = 0;
    this.z = 0;
    this.deformation = 0;
    this.generation = 0;
    this.population = createPopulation(256, 31);
    this.worker = new GeneticWorkerClient();
    this.society = new SwarmSociety(24, 37);
    this.quantum = new QuantumStateSolver(41);
    this.planet = new VoxelPlanet(43, 96);
    this.quantum.add(
      equalSuperposition("stellar-ore", 8, { x: 8, y: 0, z: 0 }),
    );
    this.quantum.add(equalSuperposition("deep-ore", 8, { x: -8, y: 0, z: 0 }));
    this.quantum.entangle("resource-pair", ["stellar-ore", "deep-ore"]);
    this.gfx = this.add.graphics();
    this.hud = this.add
      .text(10, 43, "", {
        fontFamily: "Courier",
        fontSize: "12px",
        color: "#ffffff",
      })
      .setDepth(5);
    this.dialogue = this.add
      .text(320, 430, "CIVILIZATIONS INITIALIZING", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#ffcc00",
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(320, 18, "NEON GENESIS // UNIVERSE SANDBOX", {
        fontFamily: "Courier",
        fontSize: "19px",
        color: "#ff44cc",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(320, 463, "MOVE WASD  TERRAFORM SPACE  OBSERVE Q  PAUSE ESC", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#8fa8c8",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.input.keyboard?.on("keydown-SPACE", () => this.terraform());
    this.input.keyboard?.on("keydown-Q", () => this.observe());
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    this.events.once("shutdown", () => {
      this.worker?.destroy();
      this.worker = undefined;
    });
    this.nextEvolution = this.time.now;
    this.nextSociety = this.time.now;
    AudioEngine.playTrack("odyssey");
  }
  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000,
      dx =
        Number(InputManager.isDown("KeyD")) -
        Number(InputManager.isDown("KeyA")),
      dz =
        Number(InputManager.isDown("KeyS")) -
        Number(InputManager.isDown("KeyW"));
    this.x += dx * dt * 8;
    this.z += dz * dt * 8;
    this.quantum.evolve(dt);
    if (time >= this.nextEvolution && !this.evolving) void this.evolve();
    if (time >= this.nextSociety) {
      this.nextSociety = time + 3500;
      void this.society
        .runRound(`portal terrain generation ${this.generation}`)
        .then((round) => {
          this.societyRound = round;
          this.dialogue.setText(
            `${round.leader.toUpperCase()} // ${round.consensus} // ${round.events[0].statement.toUpperCase()}`,
          );
        });
    }
    this.draw(time);
  }
  private async evolve() {
    this.evolving = true;
    try {
      const habitat = habitatFromTerrain(this.x, this.z, this.deformation),
        result = await this.worker!.evolve(
          this.population,
          habitat,
          53 ^ this.generation,
          0.08,
        );
      this.population = result.population;
      this.fitness = result.meanFitness;
      this.diversity = result.diversity;
      this.evolutionBackend = result.backend;
      this.generation++;
      this.nextEvolution = this.time.now + 900;
    } catch {
      return;
    } finally {
      this.evolving = false;
    }
  }
  private terraform() {
    this.deformation = Math.min(128, this.deformation + 1);
    this.planet.carve({ x: this.x, y: 95, z: this.z }, 3, 7);
    AudioEngine.playEffect("EXPLOSION");
  }
  private observe() {
    this.observeResource(this.x >= 0 ? "stellar-ore" : "deep-ore", 20);
  }
  private observeResource(target: string, range: number) {
    if (this.observed.has(target)) return;
    const camera = { x: this.x, y: 0, z: this.z },
      observation = this.quantum.observe(target, camera, range);
    if (observation) {
      this.observed.add(target);
      void this.mesh.publish(observation, camera);
      this.dialogue.setText(
        `OBSERVED ${target.toUpperCase()} BRANCH ${observation.branch} // LINKED ${observation.entangled.join(" ")}`,
      );
      AudioEngine.playEffect("POWER_UP");
    }
  }
  private draw(time: number) {
    const g = this.gfx.clear(),
      habitat: Habitat = habitatFromTerrain(this.x, this.z, this.deformation);
    g.fillGradientStyle(0x020612, 0x10234a, 0x3a164c, 0x061c29).fillRect(
      0,
      0,
      640,
      480,
    );
    for (let band = 0; band < 5; band++) g.fillStyle(0x154f70 + band * 0x050300, .18).fillEllipse(320, 412 - band * 18, 760 - band * 88, 126 - band * 11);
    g.fillStyle(0x112d32, .96).fillEllipse(320, 278, 510, 218).fillStyle(0x1d5c4d, .94).fillEllipse(320, 264, 430, 180).fillStyle(0x4c8a4c, .66).fillEllipse(320, 250, 334, 126);
    for (let index = 0; index < 32; index++) {
      const x = 106 + ((index * 73) % 430), y = 218 + ((index * 47) % 116), size = 5 + index % 8;
      g.fillStyle(index % 3 ? 0x155b4a : 0x2b7d58, .76).fillTriangle(x, y - size, x - size, y + size, x + size, y + size).fillStyle(0x8be389, .52).fillCircle(x, y - size * .25, Math.max(1.5, size * .25));
    }
    for (let index = 0; index < 120; index++) {
      const angle = index * 2.39996 + time * 0.00002,
        radius = 15 + index * 2.4,
        px = 320 + Math.cos(angle) * radius,
        py = 230 + Math.sin(angle) * radius * 0.55;
      g.fillStyle(
        index % 5 ? 0x4488ff : 0xff44cc,
        0.25 + (index % 3) * 0.15,
      ).fillCircle(px, py, index % 7 ? 1 : 2);
    }
    for (let index = 0; index < 64; index++) {
      const trait = this.population[index * 8],
        angle = (index / 64) * Math.PI * 2 + time * 0.0001,
        radius = 70 + this.population[index * 8 + 3] * 90;
      g.fillStyle(
        Phaser.Display.Color.HSLToColor(trait, 0.85, 0.55).color,
        0.75,
      ).fillCircle(
        320 + Math.cos(angle) * radius,
        240 + Math.sin(angle) * radius * 0.5,
        1 + this.population[index * 8 + 6] * 3,
      );
    }
    for (const cabinet of this.cabinets) { const x = 320 + cabinet.x * 7, y = 240 + cabinet.z * 3.5; g.fillStyle(0x071a26, .92).fillRoundedRect(x - 4, y - 7, 8, 11, 2).lineStyle(1, 0x00ffcc, .58).strokeRoundedRect(x - 4, y - 7, 8, 11, 2).fillStyle(0xa9ffff, .72).fillRect(x - 2, y - 5, 4, 2); }
    const probabilities = this.quantum.probabilities("stellar-ore");
    probabilities.forEach((probability, index) =>
      g
        .fillStyle(0xffcc00, 0.5 + probability * 0.5)
        .fillCircle(90 + index * 18, 75, 2 + probability * 8),
    );
    const leader = this.societyRound?.leader ?? "pending",
      consensus = this.societyRound?.consensus ?? "OBSERVE";
    this.hud.setText(
      `GEN ${this.generation}  FITNESS ${this.fitness.toFixed(3)}  DIVERSITY ${this.diversity.toFixed(3)}  LIFE 256\nTEMP ${habitat.temperature.toFixed(2)}  WATER ${habitat.moisture.toFixed(2)}  FLUID ${habitat.fluid.toFixed(2)}  ELEV ${habitat.elevation.toFixed(2)}\nSOCIETY 24  LEADER ${leader.toUpperCase()}  CONSENSUS ${consensus}  TERRAFORM ${this.deformation}`,
    );
    g.fillStyle(0x00ffcc, .14).fillCircle(320, 240, 34 + Math.sin(time * .004) * 4)
      .fillStyle(0xffffff, 0.9)
      .fillCircle(320, 240, 5)
      .lineStyle(1, 0x00ffcc, 0.8)
      .strokeCircle(320, 240, 12 + Math.sin(time * 0.004) * 3);
  }
  async genesisDiagnostics() {
    return genesisStability(1000);
  }
  genesisRuntime() {
    return { generation: this.generation, backend: this.evolutionBackend };
  }
  genesisGpuDiagnostics() {
    return this.society.compileWebGpu();
  }
  attachWorldTransport(transport: UnifiedTransport) {
    this.mesh.attach(transport);
  }
}
