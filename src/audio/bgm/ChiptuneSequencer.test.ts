import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChiptuneSequencer, WebAudioTrackerBackend, type ScheduledVoice, type TrackerBackend } from './ChiptuneSequencer';
import { TRACKS } from './tracks';

class FakeBackend implements TrackerBackend {
  currentTime = 10;
  events: ScheduledVoice[] = [];
  disposedAt: number[] = [];
  gains: number[] = [];
  schedule(event: ScheduledVoice) { this.events.push(event); }
  disposeBefore(time: number) { this.disposedAt.push(time); }
  setGain(value: number) { this.gains.push(value); }
  async suspend() {}
  async resume() {}
}

describe('ChiptuneSequencer', () => {
  afterEach(() => vi.useRealTimers());

  it('schedules four voices against the audio clock inside 100 ms', () => {
    vi.useFakeTimers();
    const backend = new FakeBackend();
    const sequencer = new ChiptuneSequencer(backend);
    sequencer.play(TRACKS.plaza, 0);
    expect(backend.events.map(event => event.voice)).toEqual(['LEAD', 'ARP', 'BASS', 'DRUMS']);
    expect(backend.events.every(event => event.time >= 10.03 && event.time < 10.1)).toBe(true);
    sequencer.stop(0);
  });

  it('advances and wraps tracker steps without timer drift', () => {
    vi.useFakeTimers();
    const backend = new FakeBackend();
    const sequencer = new ChiptuneSequencer(backend);
    sequencer.play(TRACKS.space, 0);
    for (let index = 0; index < 16; index++) { backend.currentTime += 0.15; sequencer.scheduleWindow(); }
    expect(sequencer.getStep()).toBeLessThan(16);
    expect(backend.events.every((event, index, events) => index === 0 || event.time >= events[index - 1].time - 0.5)).toBe(true);
    sequencer.stop(0);
  });

  it('requests ended-node disposal and cross-fade gain changes', () => {
    vi.useFakeTimers();
    const backend = new FakeBackend();
    const sequencer = new ChiptuneSequencer(backend);
    sequencer.play(TRACKS.sprint);
    expect(backend.disposedAt[0]).toBeCloseTo(9.9);
    sequencer.stop();
    expect(backend.gains).toEqual([0.0001, 1, 0.0001]);
  });

  it('disconnects and releases ended Web Audio voices', () => {
    class Param { value = 0; setValueAtTime() {} exponentialRampToValueAtTime() {} cancelScheduledValues() {} }
    class Node { connect(target: Node) { return target; } disconnect() {} }
    class Source extends Node { onended: (() => void) | null = null; frequency = new Param(); type: OscillatorType = 'square'; setPeriodicWave() {} start() {} stop() {} }
    class Gain extends Node { gain = new Param(); }
    const sources: Source[] = [];
    const context = {
      currentTime: 1, sampleRate: 100,
      createGain: () => new Gain(),
      createBuffer: () => ({ getChannelData: () => new Float32Array(40) }),
      createOscillator: () => { const source = new Source(); sources.push(source); return source; },
      createPeriodicWave: () => ({}),
      suspend: async () => {}, resume: async () => {},
    } as unknown as AudioContext;
    const backend = new WebAudioTrackerBackend(context, new Node() as unknown as AudioNode);
    backend.schedule({ voice: 'LEAD', time: 1, duration: 0.1, note: 69 });
    expect(backend.activeVoiceCount).toBe(2);
    sources.forEach(source => source.onended?.());
    expect(backend.activeVoiceCount).toBe(0);
  });
});
