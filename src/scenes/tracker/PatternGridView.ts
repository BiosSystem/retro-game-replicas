import type Phaser from 'phaser';
import { TRACKER_CHANNELS, TrackerPattern, type TrackerCell, type TrackerChannel } from '../../core/audio/tracker/TrackerPattern';

export const TRACKER_PIANO_KEYS = {
  z: 48, s: 49, x: 50, d: 51, c: 52, v: 53, g: 54, b: 55, h: 56, n: 57, j: 58, m: 59,
  q: 60, '2': 61, w: 62, '3': 63, e: 64, r: 65, '5': 66, t: 67, '6': 68, y: 69, '7': 70, u: 71,
} as const;

export interface TrackerCursor { row: number; channel: number; column: number; }
const EMPTY_CELL: TrackerCell = { note: 0, octave: 0, patchId: 0, volume: 0, effectType: 0, effectValue: 0 };

export class PatternGridModel {
  cursor: TrackerCursor = { row: 0, channel: 0, column: 0 };
  playheadRow = 0;

  readonly pattern: TrackerPattern;
  constructor(pattern: TrackerPattern) { this.pattern = pattern; }

  move(rowDelta: number, channelDelta: number, columnDelta = 0) {
    this.cursor.row = wrap(this.cursor.row + rowDelta, this.pattern.rows);
    this.cursor.channel = wrap(this.cursor.channel + channelDelta, TRACKER_CHANNELS.length);
    this.cursor.column = wrap(this.cursor.column + columnDelta, 6);
    return this.cursor;
  }

  setPlayhead(row: number) { this.playheadRow = wrap(row, this.pattern.rows); }
  selectedChannel(): TrackerChannel { return TRACKER_CHANNELS[this.cursor.channel]; }
  selectedCell() { return this.pattern.getCell(this.cursor.row, this.selectedChannel()); }

  insertPianoKey(key: string, patchId = 1, volume = 0x7f) {
    const midi = TRACKER_PIANO_KEYS[key.toLowerCase() as keyof typeof TRACKER_PIANO_KEYS];
    if (midi === undefined) return false;
    const cell = this.selectedCell();
    this.pattern.setCell(this.cursor.row, this.selectedChannel(), { ...cell, note: (midi % 12) + 1, octave: Math.floor(midi / 12) - 1, patchId, volume });
    this.move(1, 0); return true;
  }

  clearSelected() { this.pattern.setCell(this.cursor.row, this.selectedChannel(), EMPTY_CELL); }
  format(row: number, channel: TrackerChannel) { return formatCell(this.pattern.getCell(row, channel)); }
}

export class PatternGridView {
  private readonly text: Phaser.GameObjects.Text;
  private readonly playhead: Phaser.GameObjects.Rectangle;
  private readonly cursor: Phaser.GameObjects.Rectangle;
  private topRow = 0;

  readonly model: PatternGridModel;
  constructor(scene: Phaser.Scene, model: PatternGridModel, x: number, y: number, width = 610, height = 300) {
    this.model = model;
    this.text = scene.add.text(x, y, '', { fontFamily: 'Courier New, monospace', fontSize: '10px', color: '#8eeeff', lineSpacing: 2 }).setOrigin(0).setDepth(20);
    this.playhead = scene.add.rectangle(x + width / 2, y + height / 2, width, 13, 0x00ffcc, 0.10).setDepth(19);
    this.cursor = scene.add.rectangle(x, y, 140, 13).setStrokeStyle(1, 0xffffaa, 0.9).setOrigin(0).setDepth(21);
    this.render();
  }

  render() {
    const visibleRows = 20; this.topRow = Math.max(0, Math.min(this.model.pattern.rows - visibleRows, this.model.playheadRow - 10));
    const lines = [' ROW  CH1 LEAD          CH2 HARM          CH3 BASS          CH4 NOISE'];
    for (let row = this.topRow; row < Math.min(this.model.pattern.rows, this.topRow + visibleRows); row += 1) {
      lines.push(`${row.toString(16).toUpperCase().padStart(2, '0')}  ${TRACKER_CHANNELS.map(channel => this.model.format(row, channel)).join('  ')}`);
    }
    this.text.setText(lines.join('\n'));
    this.playhead.setY(this.text.y + 16 + (this.model.playheadRow - this.topRow) * 13);
    this.cursor.setPosition(this.text.x + 35 + this.model.cursor.channel * 145, this.text.y + 16 + (this.model.cursor.row - this.topRow) * 13);
  }

  destroy() { this.text.destroy(); this.playhead.destroy(); this.cursor.destroy(); }
}

export function formatCell(cell: TrackerCell) {
  if (cell.note === 0 && cell.patchId === 0) return '--- -- -- ---';
  const note = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'][(cell.note - 1) % 12];
  const fx = `${cell.effectType.toString(16).toUpperCase()}${cell.effectValue.toString(16).toUpperCase().padStart(2, '0')}`;
  return `${note}${cell.octave.toString(16).toUpperCase()} ${cell.patchId.toString(16).toUpperCase().padStart(2, '0')} ${cell.volume.toString(16).toUpperCase().padStart(2, '0')} ${fx}`;
}

function wrap(value: number, size: number) { return ((value % size) + size) % size; }
