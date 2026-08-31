import { SongArranger } from './SongArranger';
import { applyTrackerEffect, TRACKER_CHANNELS, type EffectState, type TrackerChannel, type TrackerCell, type TrackerPattern } from './TrackerPattern';

export interface TrackerInstrument { id: number; name: string; }
export interface TrackerSong {
  bpm: number;
  speed: number;
  patterns: readonly TrackerPattern[];
  order: Uint16Array;
  instruments: readonly TrackerInstrument[];
  loopPosition?: number;
}

export interface ScheduledTrackerCell {
  channel: TrackerChannel;
  cell: TrackerCell;
  state: EffectState;
  time: number;
  duration: number;
}

export interface TrackerScheduler { currentTime: number; schedule(event: ScheduledTrackerCell): void; }

/** Lookahead sequencer. Call scheduleWindow from a stable 20-25ms host timer. */
export class TrackerSequencer {
  private readonly scheduler: TrackerScheduler;
  private readonly lookaheadSeconds: number;
  private song: TrackerSong | undefined;
  private arranger: SongArranger | undefined;
  private pattern: TrackerPattern | undefined;
  private row = 0;
  private tick = 0;
  private nextTickTime = 0;
  private readonly channelState: Record<TrackerChannel, EffectState> = {
    CH1: { note: 0, volume: 255, pitchOffset: 0, vibrato: 0 },
    CH2: { note: 0, volume: 255, pitchOffset: 0, vibrato: 0 },
    CH3: { note: 0, volume: 255, pitchOffset: 0, vibrato: 0 },
    CH4: { note: 0, volume: 255, pitchOffset: 0, vibrato: 0 },
  };
  private readonly reusableEvents: Record<TrackerChannel, ScheduledTrackerCell> = {
    CH1: { channel: 'CH1', cell: emptyCell(), state: { note: 0, volume: 0, pitchOffset: 0, vibrato: 0 }, time: 0, duration: 0 },
    CH2: { channel: 'CH2', cell: emptyCell(), state: { note: 0, volume: 0, pitchOffset: 0, vibrato: 0 }, time: 0, duration: 0 },
    CH3: { channel: 'CH3', cell: emptyCell(), state: { note: 0, volume: 0, pitchOffset: 0, vibrato: 0 }, time: 0, duration: 0 },
    CH4: { channel: 'CH4', cell: emptyCell(), state: { note: 0, volume: 0, pitchOffset: 0, vibrato: 0 }, time: 0, duration: 0 },
  };

  constructor(scheduler: TrackerScheduler, lookaheadSeconds = 0.12) { this.scheduler = scheduler; this.lookaheadSeconds = lookaheadSeconds; }

  play(song: TrackerSong, startTime = this.scheduler.currentTime + 0.02) {
    validateSong(song);
    this.song = song; this.arranger = new SongArranger(song.order, song.loopPosition ?? 0);
    this.pattern = song.patterns[this.arranger.currentPatternId()]; this.row = 0; this.tick = 0; this.nextTickTime = startTime;
  }

  stop() { this.song = undefined; this.arranger = undefined; this.pattern = undefined; }
  getPosition() { return { order: this.arranger?.currentPosition() ?? 0, row: this.row, tick: this.tick }; }
  tickDuration() { return this.song ? 2.5 / this.song.bpm : 0; }

  scheduleWindow(now = this.scheduler.currentTime) {
    if (!this.song || !this.pattern) return 0;
    let scheduled = 0;
    while (this.nextTickTime < now + this.lookaheadSeconds) { this.scheduleTick(); this.advance(); scheduled += 1; }
    return scheduled;
  }

  private scheduleTick() {
    if (!this.song || !this.pattern) return;
    for (const channel of TRACKER_CHANNELS) {
      const cell = this.pattern.getCell(this.row, channel);
      const prior = this.channelState[channel];
      const base: EffectState = cell.note > 0 ? { ...prior, note: cell.note + cell.octave * 12, volume: cell.volume } : prior;
      const state = applyTrackerEffect(cell, this.tick, base);
      this.channelState[channel] = state;
      if (cell.note > 0 && this.tick === 0) {
        const event = this.reusableEvents[channel];
        event.cell = cell; event.state = state; event.time = this.nextTickTime; event.duration = this.tickDuration() * this.song.speed;
        this.scheduler.schedule(event);
      }
    }
  }

  private advance() {
    if (!this.song || !this.pattern || !this.arranger) return;
    this.nextTickTime += this.tickDuration(); this.tick += 1;
    if (this.tick < this.song.speed) return;
    this.tick = 0; this.row += 1;
    if (this.row < this.pattern.rows) return;
    this.row = 0; this.pattern = this.song.patterns[this.arranger.advance()];
  }
}

function emptyCell(): TrackerCell { return { note: 0, octave: 0, patchId: 0, volume: 0, effectType: 0, effectValue: 0 }; }
function validateSong(song: TrackerSong) {
  if (song.bpm < 30 || song.bpm > 300 || !Number.isFinite(song.bpm)) throw new Error('Tracker BPM must be between 30 and 300');
  if (!Number.isInteger(song.speed) || song.speed < 1 || song.speed > 12) throw new Error('Tracker speed must be between 1 and 12 ticks per row');
  if (song.order.length === 0 || song.patterns.length === 0) throw new Error('Tracker song has no patterns');
  for (const patternId of song.order) if (!song.patterns[patternId]) throw new Error('Song order references a missing pattern');
}
