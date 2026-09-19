import Phaser from "phaser";
import { LocalDialogueEngine } from "../../ai/nlp/DialogueEngine";
import { compileInt4Pipeline } from "../../ai/nlp/WebGpuInt4";
import { AudioEngine } from "../../engine/AudioEngine";
import { InputManager } from "../../engine/InputManager";
import { buildPortalViews } from "../../engine/portals/PortalStencilPipeline";
import {
  magnitude,
  transitionBody,
  type Portal,
} from "../../engine/portals/PortalPhysics";
import {
  buildBvh,
  traceGlobalIllumination,
} from "../../graphics/raytracing/BvhTracer";
import {
  compileRayTracingPipeline,
  RAYTRACE_BVH_WGSL,
} from "../../graphics/raytracing/RayTracingCompute";
import { TemporalDenoiser } from "../../graphics/raytracing/TemporalDenoiser";
import { avatarRecipe } from "../../meta/dna/AvatarDna";
import { DnaStore } from "../../meta/dna/DnaGossip";
import {
  generateParadoxLevel,
  initialParadoxPlayer,
  makeAnchor,
  stepParadox,
  updateGuards,
  type ParadoxLevel,
  type ParadoxPlayer,
} from "./ParadoxSystems";

export default class NeonParadoxScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private level: ParadoxLevel = generateParadoxLevel(0);
  private player: ParadoxPlayer = initialParadoxPlayer();
  private portals: Portal[] = [];
  private anchorSlot = 0;
  private shadow = 0;
  private dialogue = new LocalDialogueEngine();
  private lastDialogue = 0;
  private denoiser = new TemporalDenoiser();
  private avatarTier = 0;
  private dnaVictories = 0;
  private playerName = "bios";
  constructor() {
    super("ParadoxScene");
  }
  create() {
    this.level = generateParadoxLevel(0);
    this.player = initialParadoxPlayer();
    this.portals = [
      makeAnchor(1, 2, { x: -6, y: 1.8, z: -2 }, 0),
      makeAnchor(2, 1, { x: 6, y: 1.8, z: 2 }, Math.PI),
    ];
    this.anchorSlot = 0;
    this.dialogue = new LocalDialogueEngine();
    this.denoiser = new TemporalDenoiser();
    this.loadAvatarContext();
    this.gfx = this.add.graphics();
    this.hud = this.add
      .text(10, 43, "", {
        fontFamily: "Courier",
        fontSize: "12px",
        color: "#ffffff",
      })
      .setDepth(5);
    this.dialogueText = this.add
      .text(320, 425, "", {
        fontFamily: "Courier",
        fontSize: "12px",
        color: "#00ffcc",
        align: "center",
        wordWrap: { width: 590 },
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(320, 20, "NEON PARADOX // IMPOSSIBLE HEIST", {
        fontFamily: "Courier",
        fontSize: "18px",
        color: "#ff2ec4",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(320, 463, "MOVE WASD  TURN ARROWS  THROW ANCHOR SPACE  PAUSE ESC", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#8899bb",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.input.keyboard?.on("keydown-SPACE", () => this.throwAnchor());
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    AudioEngine.playTrack("paradox");
  }
  update(time: number, delta: number) {
    const dt = Math.min(50, delta) / 1000,
      forward =
        Number(InputManager.isP1Down("UP")) -
        Number(InputManager.isP1Down("DOWN")),
      strafe =
        Number(InputManager.isDown("KeyD")) -
        Number(InputManager.isDown("KeyA")),
      turn =
        Number(InputManager.isP1Down("RIGHT")) -
        Number(InputManager.isP1Down("LEFT"));
    const previous = { x: this.player.x, y: 1.1, z: this.player.z };
    this.player = stepParadox(this.player, { forward, strafe, turn }, dt);
    const transitioned = transitionBody(
      {
        id: 0,
        previousPosition: previous,
        position: { x: this.player.x, y: 1.1, z: this.player.z },
        velocity: { x: this.player.vx, y: 0, z: this.player.vz },
        gravity: { x: 0, y: -9.8, z: 0 },
        portalCooldown: 0,
      },
      this.portals,
      dt,
    );
    this.player.x = transitioned.body.position.x;
    this.player.z = transitioned.body.position.z;
    this.player.vx = transitioned.body.velocity.x;
    this.player.vz = transitioned.body.velocity.z;
    const bvh = buildBvh(this.level.boxes);
    const light = traceGlobalIllumination(
      bvh,
      { x: this.player.x, y: 1.1, z: this.player.z },
      { x: 0, y: -1, z: 0.01 },
      { x: 4, y: 5, z: -3 },
      2,
      this.level.room,
    );
    this.shadow = Math.max(0, Math.min(1, light.x + light.y + light.z));
    this.level.guards = updateGuards(
      this.level.guards,
      this.player,
      this.shadow,
      dt,
    );
    this.player.detected = Math.max(
      ...this.level.guards.map((guard) => guard.alert),
      0,
    );
    if (
      Math.hypot(
        this.player.x - this.level.objective.x,
        this.player.z - this.level.objective.z,
      ) < 1
    ) {
      this.player.loot++;
      this.player.room++;
      this.level = generateParadoxLevel(this.player.room);
      AudioEngine.playEffect("POWER_UP");
    }
    if (time - this.lastDialogue > 2200) {
      this.dialogueText.setText(
        this.dialogue.speak({
          npc: this.player.detected > 0.5 ? "warden" : "echo",
          player: this.playerName,
          avatarTier: this.avatarTier,
          victories: this.dnaVictories + this.player.loot,
          stealth: 1 - this.shadow,
          room: this.player.room,
          objective: "steal vault key",
        }),
      );
      this.lastDialogue = time;
    }
    this.draw(time);
  }
  private loadAvatarContext() {
    this.avatarTier = 0;
    this.dnaVictories = 0;
    this.playerName = "bios";
    try {
      const dna = new DnaStore(localStorage).load();
      if (!dna) return;
      this.avatarTier = avatarRecipe(dna).economyTier;
      this.dnaVictories = dna.stats.reduce((sum, stat) => sum + stat.wins, 0);
      this.playerName = dna.player;
    } catch {
      return;
    }
  }
  private throwAnchor() {
    const id = this.anchorSlot + 1,
      linkedId = id === 1 ? 2 : 1,
      distance = 4;
    const position = {
      x: this.player.x + Math.cos(this.player.angle) * distance,
      y: 1.8,
      z: this.player.z + Math.sin(this.player.angle) * distance,
    };
    const anchor = makeAnchor(id, linkedId, position, this.player.angle);
    const existing = this.portals.findIndex((portal) => portal.id === id);
    if (existing >= 0) this.portals[existing] = anchor;
    else this.portals.push(anchor);
    this.anchorSlot = 1 - this.anchorSlot;
    AudioEngine.playEffect("LASER");
  }
  private draw(time: number) {
    this.gfx
      .clear()
      .fillGradientStyle(0x030515, 0x0b1230, 0x251035, 0x071128)
      .fillRect(0, 0, 640, 480);
    const horizon = 230;
    for (let x = -20; x < 680; x += 58) {
      const height = 34 + ((x * 17) % 71 + 71) % 71;
      this.gfx
        .fillStyle(0x0a1831, 0.86)
        .fillRect(x, horizon - height, 42, height)
        .lineStyle(1, x % 116 ? 0x265780 : 0xa24791, 0.28)
        .strokeRect(x, horizon - height, 42, height);
      for (let y = horizon - height + 12; y < horizon - 8; y += 15)
        this.gfx.fillStyle(x % 116 ? 0x56d9e7 : 0xff6bcf, 0.36).fillRect(x + 9, y, 5, 3);
    }
    for (let i = 1; i <= 12; i++) {
      const y = horizon + 210 / i;
      this.gfx.lineStyle(1, 0x224488, 0.2).lineBetween(0, y, 640, y);
    }
    for (let i = -8; i <= 8; i++) {
      const x = 320 + i * 44;
      this.gfx.lineStyle(1, 0x1a6688, 0.22).lineBetween(320, horizon, x, 445);
    }
    const pulse = Math.sin(time * 0.004) * 3;
    const views = buildPortalViews(
      {
        position: { x: this.player.x, y: 1.1, z: this.player.z },
        forward: {
          x: Math.cos(this.player.angle),
          y: 0,
          z: Math.sin(this.player.angle),
        },
        up: { x: 0, y: 1, z: 0 },
      },
      this.portals,
      4,
    );
    for (let depth = 4; depth >= 1; depth--) {
      const size = 150 / depth + pulse,
        x = depth % 2 ? 170 : 470;
      this.gfx
        .lineStyle(
          Math.max(1, 5 - depth),
          depth % 2 ? 0x00ffcc : 0xff2ec4,
          0.25 + depth * 0.14,
        )
        .strokeEllipse(x, 245, size, size * 1.45);
    }
    for (const portal of this.portals) {
      const side = portal.id === 1 ? 170 : 470;
      const color = portal.id === 1 ? 0x00ffcc : 0xff2ec4;
      this.gfx
        .fillStyle(color, 0.08)
        .fillEllipse(side, 245, 122 + pulse, 174 + pulse)
        .lineStyle(3, color, 0.92)
        .strokeEllipse(side, 245, 92 + pulse, 142 + pulse)
        .lineStyle(1, 0xe8fbff, 0.64)
        .strokeEllipse(side, 245, 65 + pulse, 111 + pulse);
    }
    for (const guard of this.level.guards) {
      const dx = guard.x - this.player.x,
        dz = guard.z - this.player.z,
        distance = Math.max(1, Math.hypot(dx, dz)),
        relative = wrap(Math.atan2(dz, dx) - this.player.angle);
      if (Math.abs(relative) > 1.2) continue;
      const x = 320 + Math.tan(relative) * 250,
        height = 130 / distance;
      const color = guard.alert > 0.5 ? 0xff2255 : 0xffcc00;
      this.gfx
        .fillStyle(color, 0.14)
        .fillCircle(x, horizon - height * 0.18, height * 0.42)
        .fillStyle(color, 0.94)
        .fillTriangle(x, horizon - height, x - height * 0.26, horizon, x + height * 0.26, horizon)
        .fillStyle(0xeaffff, 0.9)
        .fillRect(x - height * 0.11, horizon - height * 0.64, height * 0.22, Math.max(2, height * 0.07));
    }
    const objectiveAngle = wrap(
        Math.atan2(
          this.level.objective.z - this.player.z,
          this.level.objective.x - this.player.x,
        ) - this.player.angle,
      ),
      objectiveDistance = Math.max(
        1,
        Math.hypot(
          this.level.objective.x - this.player.x,
          this.level.objective.z - this.player.z,
        ),
      );
    if (Math.abs(objectiveAngle) < 1.2)
      { const x = 320 + Math.tan(objectiveAngle) * 250, size = Math.max(4, 30 / objectiveDistance); this.gfx.fillStyle(0x00ff6e, 0.18).fillCircle(x, horizon, size * 2.4).fillStyle(0xc9ffe0, 0.92).fillTriangle(x, horizon - size, x - size, horizon, x, horizon + size).fillTriangle(x, horizon - size, x + size, horizon, x, horizon + size); }
    const taa = this.denoiser.resolve({
      color: Float32Array.of(this.shadow, this.shadow * 0.6, 1 - this.shadow),
      depth: Float32Array.of(objectiveDistance),
      motion: Float32Array.of(this.player.vx * 0.01, this.player.vz * 0.01),
    });
    this.gfx
      .fillStyle(0x001020, Math.max(0.05, Math.min(0.55, 0.5 - taa[0])))
      .fillRect(0, 45, 640, 400);
    this.hud.setText(
      `ROOM ${this.player.room}  LOOT ${this.player.loot}  SHADOW ${(1 - this.shadow).toFixed(2)}  ALERT ${this.player.detected.toFixed(2)}  PORTAL VIEWS ${views.length}  INT4 ${this.dialogue.parameterBytes()}B`,
    );
  }
  paradoxDiagnostics() {
    const before = {
      id: 1,
      previousPosition: { x: 0, y: 0, z: 1 },
      position: { x: 0, y: 0, z: -0.1 },
      velocity: { x: 0, y: 0, z: -7 },
      gravity: { x: 0, y: -9.8, z: 0 },
      portalCooldown: 0,
    };
    const portals = [
      makeAnchor(1, 2, { x: 0, y: 0, z: 0 }, Math.PI / 2),
      makeAnchor(2, 1, { x: 8, y: 0, z: 0 }, 0),
    ];
    const after = transitionBody(before, portals, 1 / 60).body;
    const views = buildPortalViews(
      {
        position: { x: 0, y: 1, z: 4 },
        forward: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 1, z: 0 },
      },
      portals,
      4,
    );
    return {
      speedBefore: magnitude(before.velocity),
      speedAfter: magnitude(after.velocity),
      maximumDepth: Math.max(...views.map((view) => view.depth)),
      views: views.length,
      rayShaderBytes: RAYTRACE_BVH_WGSL.length,
      parameters: this.dialogue.parameterBytes(),
    };
  }
  async gpuDiagnostics() {
    const [nlp, raytrace] = await Promise.all([
      compileInt4Pipeline(),
      compileRayTracingPipeline(),
    ]);
    return { nlp, raytrace };
  }
}
function wrap(angle: number) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
