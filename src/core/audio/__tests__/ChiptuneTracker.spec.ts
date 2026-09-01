import { describe, expect, it } from 'vitest';
import { buildAdsrCurve, LfsrNoise } from '../synth/SynthPrimitives';
import { StateVariableFilter } from '../synth/StateVariableFilter';
import { decodeSong, encodeSong, SongCodecError } from '../tracker/SongCodec';
import { SongArranger } from '../tracker/SongArranger';
import { applyTrackerEffect, TRACKER_EFFECTS, TrackerPattern, type EffectState } from '../tracker/TrackerPattern';
import { TrackerSequencer, type ScheduledTrackerCell, type TrackerSong } from '../tracker/TrackerSequencer';
import { encodeWavPcm16 } from '../tracker/OfflineRender';

function createSong(): TrackerSong {
  const first = new TrackerPattern(32); first.setCell(0, 'CH1', { note: 60, octave: 0, patchId: 1, volume: 210, effectType: 0, effectValue: 0 });
  const second = new TrackerPattern(32); second.setCell(0, 'CH3', { note: 48, octave: 0, patchId: 2, volume: 160, effectType: 0, effectValue: 0 });
  return { bpm: 120, speed: 6, patterns: [first, second], order: new Uint16Array([0, 1]), instruments: [{ id: 1, name: 'Pulse' }, { id: 2, name: 'Bass' }], loopPosition: 0 };
}

describe('WebAudio tracker primitives', () => {
  it('builds a monotonic ADSR curve with a finite release', () => {
    const curve = buildAdsrCurve(2, 0.4, { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.2 }, 0.8);
    expect(curve).toHaveLength(5); expect(curve[0]).toEqual({ time: 2, value: 0.0001 }); expect(curve[1].value).toBe(0.8);
    expect(curve[2].value).toBeCloseTo(0.48); expect(curve.at(-1)?.time).toBeCloseTo(2.6); expect(curve.at(-1)?.value).toBe(0.0001);
  });

  it('generates deterministic maximal-period LFSR noise', () => {
    const first = new LfsrNoise(0x1234); const second = new LfsrNoise(0x1234); const initial = first.snapshot();
    for (let index = 0; index < 65535; index += 1) expect(first.nextBit()).toBe(second.nextBit());
    expect(first.snapshot()).toBe(initial);
  });

  it('keeps state-variable filter modes finite and resettable', () => {
    const filter = new StateVariableFilter(48000, 'lowpass', 1200, 0.7);
    const low = filter.process(1); filter.configure('highpass', 1200, 0.7); const high = filter.process(1);
    filter.configure('bandpass', 1200, 0.7); const band = filter.process(1); filter.reset();
    expect(Number.isFinite(low) && Number.isFinite(high) && Number.isFinite(band)).toBe(true);
    expect(filter.process(0)).toBe(0);
  });

  it('calculates tracker arpeggio, portamento, vibrato, and volume slide effects', () => {
    const state: EffectState = { note: 60, volume: 100, pitchOffset: 0, vibrato: 0 };
    expect(applyTrackerEffect({ note: 0, octave: 0, patchId: 0, volume: 0, effectType: TRACKER_EFFECTS.ARPEGGIO, effectValue: 0x37 }, 1, state).note).toBe(63);
    expect(applyTrackerEffect({ note: 0, octave: 0, patchId: 0, volume: 0, effectType: TRACKER_EFFECTS.ARPEGGIO, effectValue: 0x37 }, 2, state).note).toBe(67);
    expect(applyTrackerEffect({ note: 0, octave: 0, patchId: 0, volume: 0, effectType: TRACKER_EFFECTS.PORTAMENTO_UP, effectValue: 2 }, 3, state).pitchOffset).toBe(6);
    expect(applyTrackerEffect({ note: 0, octave: 0, patchId: 0, volume: 0, effectType: TRACKER_EFFECTS.PORTAMENTO_DOWN, effectValue: 4 }, 2, state).pitchOffset).toBe(-8);
    expect(applyTrackerEffect({ note: 0, octave: 0, patchId: 0, volume: 0, effectType: TRACKER_EFFECTS.VIBRATO, effectValue: 0x47 }, 3, state).vibrato).not.toBe(0);
    expect(applyTrackerEffect({ note: 0, octave: 0, patchId: 0, volume: 0, effectType: TRACKER_EFFECTS.VOLUME_SLIDE, effectValue: 0x32 }, 2, state).volume).toBe(102);
  });

  it('round-trips compact neonseq songs and rejects malformed input', () => {
    const encoded = encodeSong(createSong()); const decoded = decodeSong(encoded);
    expect(decoded.bpm).toBe(120); expect([...decoded.order]).toEqual([0, 1]); expect(decoded.instruments.map(({ name }) => name)).toEqual(['Pulse', 'Bass']);
    expect(decoded.patterns[0].getCell(0, 'CH1')).toMatchObject({ note: 60, patchId: 1, volume: 210 });
    expect(() => decodeSong(encoded.slice(0, 10))).toThrow(SongCodecError);
    const corrupt = new Uint8Array(encoded); corrupt[0] = 0;
    expect(() => decodeSong(corrupt)).toThrow(SongCodecError);
  });

  it('schedules tracker ticks ahead and loops the song order deterministically', () => {
    const calls: Array<Pick<ScheduledTrackerCell, 'channel' | 'time' | 'duration'>> = [];
    const scheduler = { currentTime: 10, schedule: (event: ScheduledTrackerCell) => calls.push({ channel: event.channel, time: event.time, duration: event.duration }) };
    const sequencer = new TrackerSequencer(scheduler, 0.13); sequencer.play(createSong(), 10); expect(sequencer.scheduleWindow()).toBeGreaterThan(0);
    expect(calls).toContainEqual({ channel: 'CH1', time: 10, duration: 0.125 });
    const arranger = new SongArranger(new Uint16Array([0, 1]), 0); expect([arranger.currentPatternId(), arranger.advance(), arranger.advance()]).toEqual([0, 1, 0]);
  });

  it('writes canonical PCM WAV headers', () => {
    const wav = new DataView(encodeWavPcm16(new Float32Array([0, -1, 1]), 22050));
    expect(wav.getUint32(0, false)).toBe(0x52494646); expect(wav.getUint32(8, false)).toBe(0x57415645); expect(wav.getUint32(24, true)).toBe(22050); expect(wav.byteLength).toBe(50);
  });
});
