import type Phaser from 'phaser';
import { buildAdsrCurve, DEFAULT_FM_PATCH, type FmPatch, type SynthFilterMode, type SynthWaveform } from '../../core/audio/synth/SynthPrimitives';

const RATIOS = [0.5, 1, 2, 3, 4] as const;
export class PatchEditorModel {
  readonly patch: FmPatch;
  private readonly listeners = new Set<(patch: Readonly<FmPatch>) => void>();
  constructor(patch: FmPatch = DEFAULT_FM_PATCH) { this.patch = structuredClone(patch); }
  subscribe(listener: (patch: Readonly<FmPatch>) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  setEnvelope(key: keyof FmPatch['envelope'], value: number) { this.patch.envelope[key] = Math.max(key === 'sustain' ? 0 : 0.001, Math.min(key === 'sustain' ? 1 : 5, value)); this.emit(); }
  setRatio(operator: 'carrierRatio' | 'modulatorRatio', value: number) { this.patch[operator] = RATIOS.reduce((best, current) => Math.abs(current - value) < Math.abs(best - value) ? current : best, RATIOS[0]); this.emit(); }
  setWaveform(value: SynthWaveform) { this.patch.waveform = value; this.emit(); }
  setFilter(mode: SynthFilterMode, frequency: number, q: number) { this.patch.filter = { mode, frequency: Math.max(20, Math.min(18000, frequency)), q: Math.max(0.1, Math.min(24, q)) }; this.emit(); }
  setModulationIndex(value: number) { this.patch.modulationIndex = Math.max(0, Math.min(8, value)); this.emit(); }
  private emit() { this.listeners.forEach(listener => listener(this.patch)); }
}

export class PatchEditorPanel {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  readonly model: PatchEditorModel;
  private readonly x: number;
  private readonly y: number;
  constructor(scene: Phaser.Scene, model: PatchEditorModel, x: number, y: number) {
    this.model = model; this.x = x; this.y = y;
    this.graphics = scene.add.graphics().setDepth(20); this.label = scene.add.text(x, y + 95, '', { fontFamily: 'Courier', fontSize: '9px', color: '#ffccff', align: 'center' }).setOrigin(.5).setDepth(21); this.render();
  }
  render() {
    const points = buildAdsrCurve(0, .4, this.model.patch.envelope, 1); const graphic = this.graphics.clear().lineStyle(1, 0xff2ec4, .7).strokeRect(this.x - 120, this.y - 60, 240, 120).lineStyle(2, 0xffb4ef, .9);
    for (let index = 1; index < points.length; index += 1) graphic.lineBetween(this.x - 110 + points[index - 1].time * 180, this.y + 42 - points[index - 1].value * 82, this.x - 110 + points[index].time * 180, this.y + 42 - points[index].value * 82);
    this.label.setText(`FM ${this.model.patch.modulatorRatio}x:${this.model.patch.carrierRatio}x  IDX ${this.model.patch.modulationIndex.toFixed(1)}\n${this.model.patch.waveform.toUpperCase()}  ${this.model.patch.filter.mode.toUpperCase()} ${Math.round(this.model.patch.filter.frequency)}Hz Q${this.model.patch.filter.q.toFixed(1)}`);
  }
  destroy() { this.graphics.destroy(); this.label.destroy(); }
}
