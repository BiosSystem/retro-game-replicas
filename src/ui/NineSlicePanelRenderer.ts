import Phaser from 'phaser';
import { createNeonPanel } from './arcade/NeonUi';
import { CabinetPalette, type CabinetPaletteName, type NineSlicePanel } from './NineSlicePanel';

export interface MountedNineSlicePanel {
  panel: Phaser.GameObjects.Container;
  header: Phaser.GameObjects.Text;
  scanlines: Phaser.GameObjects.Graphics;
}

export function mountNineSlicePanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, spec: NineSlicePanel): MountedNineSlicePanel {
  const panel = createNeonPanel(scene, x, y, width, height, toColor(spec.palette), .78);
  const header = scene.add.text(0, -height / 2 + 8, spec.header, { fontFamily: "'Share Tech Mono', Courier", fontSize: '10px', color: CabinetPalette[spec.palette], letterSpacing: 2 }).setOrigin(.5);
  const scanlines = scene.add.graphics();
  if (spec.scanlines) {
    scanlines.fillStyle(0x000000, .10);
    for (let row = -height / 2 + 2; row < height / 2 - 2; row += 4) scanlines.fillRect(-width / 2 + 2, row, width - 4, 1);
  }
  panel.add([header, scanlines]);
  return { panel, header, scanlines };
}

function toColor(palette: CabinetPaletteName) { return Number.parseInt(CabinetPalette[palette].slice(1), 16); }
