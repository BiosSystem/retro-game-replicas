import Phaser from "phaser";
import { cabinetSkinStore } from "../../core/graphics/vector/CabinetSkinStore";
import { encodeDecal } from "../../core/graphics/vector/DecalCodec";
import {
  CABINET_SLOTS,
  VectorArtModel,
  createVectorDocument,
} from "../../core/graphics/vector/VectorArtModel";
import { createNineSlicePanel } from "../../ui/NineSlicePanel";
import { mountNineSlicePanel } from "../../ui/NineSlicePanelRenderer";
import { CabinetDecalPreview } from "./CabinetDecalPreview";
import {
  VECTOR_TOOLS,
  VectorCanvasView,
  type VectorTool,
} from "./VectorCanvasView";

export default class DecalWorkshopScene extends Phaser.Scene {
  private canvas!: VectorCanvasView;
  private preview!: CabinetDecalPreview;
  private toolText!: Phaser.GameObjects.Text;
  private toolIndex = 0;
  private slotIndex = 0;
  constructor() {
    super("DecalWorkshopScene");
  }
  create() {
    const model = new VectorArtModel(
      cabinetSkinStore.get("MetaArcadeScene") ?? createVectorDocument(),
    );
    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0x020611, 0x0b1830, 0x17102b, 0x02050d).fillRect(0, 0, 640, 480);
    for (let x = 14; x < 640; x += 32) backdrop.lineStyle(1, x % 64 ? 0x1b6c76 : 0x74336e, .08).lineBetween(x, 28, x - 24, 456);
    backdrop.fillStyle(0x06111f, .9).fillRoundedRect(14, 18, 612, 444, 10).lineStyle(1, 0x45ddda, .42).strokeRoundedRect(14, 18, 612, 444, 10);
    mountNineSlicePanel(
      this,
      320,
      240,
      624,
      448,
      createNineSlicePanel("CABINET DECAL // VECTOR WORKSHOP", "CYAN_SYNTH"),
    );
    this.markCanvas("arcadeScene", "DecalWorkshopScene");
    this.markCanvas("decalPreview", this.previewSlot());
    this.add
      .text(
        320,
        42,
        "DRAG DRAW  RIGHT-DRAG PAN  WHEEL ZOOM  1-8 TOOL  [ ] PREVIEW  S SAVE  O EXPORT  ESC LOBBY",
        { fontFamily: "Courier", fontSize: "8px", color: "#aaffff" },
      )
      .setOrigin(0.5)
      .setDepth(22);
    this.add.text(24, 62, "VECTOR CANVAS", { fontFamily: "Courier", fontSize: "9px", color: "#65eee5", fontStyle: "bold" }).setDepth(22);
    this.add.text(424, 62, "LIVE CABINET PREVIEW", { fontFamily: "Courier", fontSize: "9px", color: "#ff79d6", fontStyle: "bold" }).setDepth(22);
    const palette = this.add.graphics().setDepth(21);
    [0x49f2e4, 0xff5bc8, 0xffd264, 0x7795ff, 0xf2f6ff].forEach((color, index) => palette.fillStyle(color, .9).fillRoundedRect(424 + index * 28, 392, 20, 12, 3));
    palette.lineStyle(1, 0xffffff, .25).strokeRoundedRect(420, 384, 154, 28, 5);
    this.canvas = new VectorCanvasView(
      this,
      model,
      22,
      78,
      370,
      330,
      (document) => this.preview.render(document),
    );
    this.preview = new CabinetDecalPreview(this, 510, 240);
    this.preview.render(model.document);
    this.toolText = this.add
      .text(320, 430, "", {
        fontFamily: "Courier",
        fontSize: "10px",
        color: "#ffcc66",
      })
      .setOrigin(0.5)
      .setDepth(22);
    this.updateTool();
    this.bindKeys();
  }
  private bindKeys() {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (event.key >= "1" && event.key <= "8") {
        this.toolIndex = Number(event.key) - 1;
        this.updateTool();
      } else if (event.key.toLowerCase() === "u") this.canvas.undo();
      else if (event.key.toLowerCase() === "y") this.canvas.redo();
      else if (event.key.toLowerCase() === "s")
        cabinetSkinStore.set("MetaArcadeScene", this.canvas.document());
      else if (event.key.toLowerCase() === "o") this.exportDecal();
      else if (event.key === "[" || event.key === "]") {
        this.slotIndex =
          (this.slotIndex +
            (event.key === "[" ? CABINET_SLOTS.length - 1 : 1)) %
          CABINET_SLOTS.length;
        this.preview.setSlot(
          CABINET_SLOTS[this.slotIndex],
          this.canvas.document(),
        );
        this.markCanvas("decalPreview", this.previewSlot());
        this.updateTool();
      } else if (event.key === "Escape") this.scene.start("LobbyScene");
    });
  }
  private markCanvas(name: string, value: string) {
    this.game.canvas.dataset[name] = value;
    const activeCanvas =
      document.querySelector<HTMLCanvasElement>("#app canvas");
    if (activeCanvas) activeCanvas.dataset[name] = value;
  }
  private previewSlot() {
    return CABINET_SLOTS[this.slotIndex];
  }
  private exportDecal() {
    const blob = new Blob([encodeDecal(this.canvas.document())], {
      type: "application/octet-stream",
    });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "cabinet.neonart";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }
  private updateTool() {
    const tool = VECTOR_TOOLS[this.toolIndex] as VectorTool;
    this.canvas.setTool(tool);
    this.toolText.setText(
      `TOOL: ${tool}  PREVIEW: ${this.previewSlot()}  SNAP: 8PX  HISTORY: 64`,
    );
  }
}
