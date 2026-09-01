import { FMSynthesizerEngine } from './synth/FMSynthesizerEngine';
import { DEFAULT_FM_PATCH, type FmPatch } from './synth/SynthPrimitives';
import { TrackerSequencer, type ScheduledTrackerCell, type TrackerSong } from './tracker/TrackerSequencer';

/** Bridge the pure tracker data model to bounded browser WebAudio playback. */
export class TrackerAudioRuntime {
  private readonly synth: FMSynthesizerEngine;
  private readonly sequencer: TrackerSequencer;
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly patches = new Map<number, FmPatch>();
  private readonly context: AudioContext;

  constructor(context: AudioContext, destination: AudioNode) {
    this.context = context;
    this.synth = new FMSynthesizerEngine(context, destination, 16);
    this.sequencer = new TrackerSequencer({ get currentTime() { return context.currentTime; }, schedule: event => this.schedule(event) });
  }

  play(song: TrackerSong) { this.stop(); this.sequencer.play(song); this.sequencer.scheduleWindow(); this.timer = setInterval(() => this.sequencer.scheduleWindow(), 20); }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = undefined; this.sequencer.stop(); }
  setPatch(id: number, patch: FmPatch) { this.patches.set(id, structuredClone(patch)); }
  audition(midi: number, patch: FmPatch, channel = 0) { return this.synth.trigger(midi % 12, Math.floor(midi / 12), patch, this.context.currentTime, 0.2, channel); }
  analyser(channel: number) { return this.synth.analyser(channel); }
  dispose() { this.stop(); this.synth.dispose(); }

  private schedule(event: ScheduledTrackerCell) {
    const patch = this.patches.get(event.cell.patchId) ?? DEFAULT_FM_PATCH;
    this.synth.trigger(event.state.note + event.state.pitchOffset + event.state.vibrato, 0, patch, event.time, event.duration, ['CH1', 'CH2', 'CH3', 'CH4'].indexOf(event.channel));
  }
}
