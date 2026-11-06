import Phaser from "phaser";
import { AudioEngine } from "../../engine/AudioEngine";
import { BitrateController } from "../../engine/broadcasting/BitrateController";
import {
  probeBroadcastSupport,
  WebCodecsBroadcaster,
} from "../../engine/broadcasting/WebCodecsBroadcaster";
import { GridCoordinator, localGridPeer } from "../../net/grid/GridCoordinator";
import {
  NeonTerminal,
  NeonWindowManager,
  compileOsWebGpuLayout,
} from "./OsSystems";

export default class NeonOsScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private output!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private inputLine = "";
  private terminal = new NeonTerminal();
  private windows = new NeonWindowManager();
  constructor() {
    super("OsScene");
  }
  create() {
    this.terminal = new NeonTerminal();
    this.windows = new NeonWindowManager();
    this.windows.open("NEON SHELL");
    this.windows.open("GRID MONITOR");
    this.windows.open("BROADCAST");
    this.gfx = this.add.graphics();
    this.output = this.add
      .text(
        44,
        126,
        "NEON OS 1.0 READY\nTYPE HELP OR RUN 9 input|const 2|mul|return",
        {
          fontFamily: "Courier",
          fontSize: "12px",
          color: "#9fffd4",
          lineSpacing: 5,
          wordWrap: { width: 530 },
        },
      )
      .setDepth(3);
    this.prompt = this.add
      .text(44, 382, "> ", {
        fontFamily: "Courier",
        fontSize: "13px",
        color: "#ffffff",
      })
      .setDepth(3);
    this.draw();
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) =>
      this.onKey(event),
    );
    this.input.keyboard?.on("keydown-ESC", () =>
      this.scene.start("LobbyScene"),
    );
    AudioEngine.playTrack("plaza");
  }
  private draw() {
    const g = this.gfx.clear();
    g.fillGradientStyle(0x01040a, 0x020814, 0x071d2b, 0x090414).fillRect(
      0,
      0,
      640,
      480,
    );
    g.fillStyle(0x071624, .84).fillRoundedRect(16, 16, 608, 448, 10).lineStyle(1, 0x00ff99, 0.62).strokeRoundedRect(16, 16, 608, 448, 10);
    for (let x = 30; x < 612; x += 24) g.lineStyle(1, 0x1e5361, .14).lineBetween(x, 58, x - 30, 452);
    this.windows.list().forEach((window) => {
      g.fillStyle(0x03131b, 0.9).fillRect(
        window.x,
        window.y,
        window.width,
        window.height,
      );
      g.lineStyle(1, window.id === 1 ? 0x00ff99 : 0x8855ff, 0.8).strokeRect(
        window.x,
        window.y,
        window.width,
        window.height,
      );
      g.fillStyle(0x00ff99, 0.18).fillRect(
        window.x,
        window.y,
        window.width,
        18,
      );
      g.fillStyle(window.id === 1 ? 0x00ff99 : 0x9a73ff, .7).fillCircle(window.x + 10, window.y + 9, 3).fillStyle(0xffd56c, .6).fillCircle(window.x + 20, window.y + 9, 3);
      for (let row = window.y + 30; row < window.y + window.height - 8; row += 13) g.fillStyle(window.id === 1 ? 0x60e5b3 : 0xa890ff, .12).fillRect(window.x + 12, row, Math.max(16, window.width - 28 - ((row * 17) % 44)), 2);
    });
    this.add
      .text(320, 37, "NEON OS // PROGRAMMABLE ARCADE WORKSTATION", {
        fontFamily: "Courier",
        fontSize: "17px",
        color: "#00ff99",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.add
      .text(320, 449, "ENTER EXECUTE  ESC PAUSE  SAFE DSL ONLY", {
        fontFamily: "Courier",
        fontSize: "11px",
        color: "#778da8",
      })
      .setOrigin(0.5)
      .setDepth(3);
  }
  private onKey(event: KeyboardEvent) {
    if (event.key === "Escape") return;
    if (event.key === "Backspace") this.inputLine = this.inputLine.slice(0, -1);
    else if (event.key === "Enter") void this.run();
    else if (event.key.length === 1 && this.inputLine.length < 160)
      this.inputLine += event.key;
    this.prompt.setText(`> ${this.inputLine}_`);
  }
  private async run() {
    const command = this.inputLine;
    this.inputLine = "";
    this.prompt.setText("> _");
    try {
      const result = await this.terminal.execute(command);
      this.output.setText(
        `${this.output.text}\n> ${command}\n${result.output}`
          .split("\n")
          .slice(-12)
          .join("\n"),
      );
    } catch (error) {
      this.output.setText(
        `${this.output.text}\nFAULT ${(error as Error).message}`
          .split("\n")
          .slice(-12)
          .join("\n"),
      );
    }
  }
  async osDiagnostics() {
    const terminal = await this.terminal.execute(
      "RUN 9 input|const 2|mul|return",
    );
    const grid = new GridCoordinator();
    grid.addPeer({
      id: "leaving-peer",
      execute: async () => {
        throw new Error("peer left");
      },
    });
    grid.addPeer(localGridPeer("stable-peer"));
    const distributed = await grid.execute("GRADIENT_SUM", [1, 2, 3, 4], 2);
    const pressure = new BitrateController();
    const bitrate = pressure.sample({ encodeQueue: 6, frameTimeMs: 25 });
    return {
      compiler: terminal.value,
      grid: distributed.value,
      retries: distributed.retries,
      bitrate,
      broadcast: await probeBroadcastSupport(640, 480),
      webgpu: await compileOsWebGpuLayout(),
      windows: this.windows.list().length,
    };
  }
  async broadcastCaptureDiagnostics() {
    let packets = 0;
    const broadcaster = new WebCodecsBroadcaster(this.game.canvas, {
      width: 640,
      height: 480,
      onPacket: () => {
        packets++;
      },
    });
    const support = await broadcaster.start();
    if (!support.supported) return { support, accepted: false, packets: 0 };
    const accepted = broadcaster.capture(Math.round(performance.now() * 1000));
    await new Promise((resolve) => setTimeout(resolve, 50));
    broadcaster.stop();
    return { support, accepted, packets };
  }
}
