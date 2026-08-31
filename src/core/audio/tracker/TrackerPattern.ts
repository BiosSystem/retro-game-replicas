export const TRACKER_CHANNELS = ['CH1', 'CH2', 'CH3', 'CH4'] as const;
export type TrackerChannel = (typeof TRACKER_CHANNELS)[number];
export const TRACKER_CHANNEL_COUNT = TRACKER_CHANNELS.length;
export const TRACKER_CELL_BYTES = 6;
export const TRACKER_ROWS = [32, 64] as const;

export const TRACKER_EFFECTS = {
  ARPEGGIO: 0x0,
  PORTAMENTO_UP: 0x1,
  PORTAMENTO_DOWN: 0x2,
  VIBRATO: 0x4,
  VOLUME_SLIDE: 0xA,
} as const;
export type TrackerEffectType = (typeof TRACKER_EFFECTS)[keyof typeof TRACKER_EFFECTS];

export interface TrackerCell {
  note: number;
  octave: number;
  patchId: number;
  volume: number;
  effectType: number;
  effectValue: number;
}

export interface EffectState { note: number; volume: number; pitchOffset: number; vibrato: number; }

function asByte(value: number) { return Math.max(0, Math.min(255, Math.round(Number.isFinite(value) ? value : 0))); }
function channelIndex(channel: TrackerChannel) { return TRACKER_CHANNELS.indexOf(channel); }

/** Packed row-major matrix: row -> channel -> six uint8 columns. */
export class TrackerPattern {
  readonly data: Uint8Array;
  readonly rows: number;

  constructor(rows: number = 64, packed?: Uint8Array) {
    if (rows !== 32 && rows !== 64) throw new Error('Tracker patterns must contain 32 or 64 rows');
    const byteLength = rows * TRACKER_CHANNEL_COUNT * TRACKER_CELL_BYTES;
    if (packed && packed.length !== byteLength) throw new Error('Tracker pattern payload has an invalid length');
    this.rows = rows; this.data = packed ? new Uint8Array(packed) : new Uint8Array(byteLength);
  }

  getCell(row: number, channel: TrackerChannel): TrackerCell {
    const offset = this.offset(row, channel);
    return {
      note: this.data[offset], octave: this.data[offset + 1], patchId: this.data[offset + 2],
      volume: this.data[offset + 3], effectType: this.data[offset + 4], effectValue: this.data[offset + 5],
    };
  }

  setCell(row: number, channel: TrackerChannel, cell: TrackerCell) {
    const offset = this.offset(row, channel);
    this.data[offset] = asByte(cell.note); this.data[offset + 1] = asByte(cell.octave); this.data[offset + 2] = asByte(cell.patchId);
    this.data[offset + 3] = asByte(cell.volume); this.data[offset + 4] = asByte(cell.effectType); this.data[offset + 5] = asByte(cell.effectValue);
  }

  clone() { return new TrackerPattern(this.rows, this.data); }

  private offset(row: number, channel: TrackerChannel) {
    if (!Number.isInteger(row) || row < 0 || row >= this.rows) throw new RangeError('Tracker row is outside the pattern');
    const index = channelIndex(channel);
    if (index < 0) throw new RangeError('Unknown tracker channel');
    return (row * TRACKER_CHANNEL_COUNT + index) * TRACKER_CELL_BYTES;
  }
}

export function applyTrackerEffect(cell: TrackerCell, tick: number, state: EffectState): EffectState {
  const next: EffectState = { ...state };
  const effect = cell.effectType;
  const value = cell.effectValue;
  if (effect === TRACKER_EFFECTS.ARPEGGIO && value > 0) {
    const phase = Math.max(0, tick) % 3;
    next.note = state.note + (phase === 1 ? value >>> 4 : phase === 2 ? value & 0x0f : 0);
  } else if (effect === TRACKER_EFFECTS.PORTAMENTO_UP) next.pitchOffset = state.pitchOffset + value * Math.max(1, tick);
  else if (effect === TRACKER_EFFECTS.PORTAMENTO_DOWN) next.pitchOffset = state.pitchOffset - value * Math.max(1, tick);
  else if (effect === TRACKER_EFFECTS.VIBRATO) {
    const speed = Math.max(1, value >>> 4); const depth = value & 0x0f;
    next.vibrato = Math.sin((tick * speed * Math.PI) / 16) * depth;
  } else if (effect === TRACKER_EFFECTS.VOLUME_SLIDE) {
    const up = value >>> 4; const down = value & 0x0f;
    next.volume = Math.max(0, Math.min(255, state.volume + (up - down) * Math.max(1, tick)));
  }
  return next;
}
