import type Phaser from 'phaser';

/** Draw four bounded analyser taps, with a procedural idle trace before audio starts. */
export class ChannelVisualizer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly samples: Uint8Array<ArrayBuffer>[] = [];
  private readonly labels: Phaser.GameObjects.Text[] = [];

  private readonly analysers: readonly AnalyserNode[];
  constructor(scene: Phaser.Scene, analysers: readonly AnalyserNode[], x: number, y: number) {
    this.analysers = analysers;
    this.graphics = scene.add.graphics().setDepth(20);
    for (let channel = 0; channel < 4; channel += 1) {
      this.samples.push(new Uint8Array(128));
      this.labels.push(scene.add.text(x, y + channel * 34 - 13, `CH${channel + 1}`, { fontFamily: 'Courier', fontSize: '8px', color: '#55ffbb' }).setDepth(21));
    }
  }

  update(time: number) {
    const x = 410; const y = 62; const width = 210;
    this.graphics.clear();
    for (let channel = 0; channel < 4; channel += 1) {
      const baseY = y + channel * 34; const analyser = this.analysers[channel]; const data = this.samples[channel];
      if (analyser) analyser.getByteTimeDomainData(data); else for (let index = 0; index < data.length; index += 1) data[index] = 128 + Math.sin(time * .004 + index * .2 * (channel + 1)) * 18;
      this.graphics.lineStyle(1, 0x166644, .55).strokeRect(x, baseY - 13, width, 26).lineStyle(1, 0x55ffbb, .9);
      for (let index = 1; index < data.length; index += 1) this.graphics.lineBetween(x + (index - 1) / (data.length - 1) * width, baseY + (data[index - 1] - 128) / 9, x + index / (data.length - 1) * width, baseY + (data[index] - 128) / 9);
    }
  }
  destroy() { this.graphics.destroy(); this.labels.forEach(label => label.destroy()); }
}
