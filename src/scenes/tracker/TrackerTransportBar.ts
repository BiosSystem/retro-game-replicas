import type Phaser from 'phaser';
import { SongArranger } from '../../core/audio/tracker/SongArranger';

export type TrackerTransportState = 'STOPPED' | 'PLAYING_SONG' | 'PLAYING_PATTERN' | 'RECORDING';
export class TrackerTransportModel {
  state: TrackerTransportState = 'STOPPED'; loop = true; bpm = 120; speed = 6;
  playSong() { this.state = 'PLAYING_SONG'; }
  playPattern() { this.state = 'PLAYING_PATTERN'; }
  stop() { this.state = 'STOPPED'; }
  record() { this.state = this.state === 'RECORDING' ? 'STOPPED' : 'RECORDING'; }
  setBpm(value: number) { this.bpm = Math.max(30, Math.min(300, Math.round(value))); }
  setSpeed(value: number) { this.speed = Math.max(1, Math.min(12, Math.round(value))); }
}

export class PlaylistModel {
  readonly order: number[];
  constructor(order: number[]) { this.order = order; }
  move(from: number, to: number) { if (from < 0 || to < 0 || from >= this.order.length || to >= this.order.length) return false; const [entry] = this.order.splice(from, 1); this.order.splice(to, 0, entry); return true; }
  arranger(loopPosition = 0) { return new SongArranger(new Uint16Array(this.order), loopPosition); }
}

export class TrackerTransportBar {
  private readonly text: Phaser.GameObjects.Text;
  readonly model: TrackerTransportModel;
  constructor(scene: Phaser.Scene, model: TrackerTransportModel, x: number, y: number) { this.model = model; this.text = scene.add.text(x, y, '', { fontFamily: 'Courier', fontSize: '11px', color: '#00ffcc' }).setOrigin(.5).setDepth(22); this.render(); }
  render() { this.text.setText(`[F5 PLAY] [F6 PATTERN] [F8 STOP] [F9 REC]  ${this.model.loop ? 'LOOP' : 'ONCE'}  BPM ${this.model.bpm}  SPEED ${this.model.speed}  ${this.model.state}`); }
  destroy() { this.text.destroy(); }
}
