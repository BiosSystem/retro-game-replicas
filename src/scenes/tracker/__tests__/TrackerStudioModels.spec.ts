import { describe, expect, it } from 'vitest';
import { TrackerPattern } from '../../../core/audio/tracker/TrackerPattern';
import { PatchEditorModel } from '../PatchEditorPanel';
import { PatternGridModel } from '../PatternGridView';
import { PlaylistModel, TrackerTransportModel } from '../TrackerTransportBar';

describe('Tracker Studio models', () => {
  it('navigates the cursor and inserts or clears piano notes', () => {
    const model = new PatternGridModel(new TrackerPattern(32));
    expect(model.insertPianoKey('z')).toBe(true);
    expect(model.pattern.getCell(0, 'CH1')).toMatchObject({ note: 1, octave: 3, patchId: 1 });
    model.move(-1, 1); model.clearSelected();
    expect(model.pattern.getCell(0, 'CH2').note).toBe(0);
    model.move(0, 4); expect(model.selectedChannel()).toBe('CH2');
  });

  it('clamps patch values and emits a complete editable patch', () => {
    const model = new PatchEditorModel(); let updates = 0; const unsubscribe = model.subscribe(() => { updates += 1; }); model.setEnvelope('sustain', 4); model.setModulationIndex(99); model.setRatio('carrierRatio', 3.3); model.setFilter('bandpass', 99999, 99); unsubscribe();
    expect(model.patch.envelope.sustain).toBe(1); expect(model.patch.modulationIndex).toBe(8); expect(model.patch.carrierRatio).toBe(3); expect(model.patch.filter).toEqual({ mode: 'bandpass', frequency: 18000, q: 24 });
    expect(updates).toBe(4);
  });

  it('transitions transport states and clamps tempo controls', () => {
    const transport = new TrackerTransportModel(); transport.playSong(); expect(transport.state).toBe('PLAYING_SONG'); transport.playPattern(); expect(transport.state).toBe('PLAYING_PATTERN'); transport.record(); expect(transport.state).toBe('RECORDING'); transport.stop();
    transport.setBpm(999); transport.setSpeed(-1); expect(transport).toMatchObject({ state: 'STOPPED', bpm: 300, speed: 1 });
  });

  it('reorders a playlist without changing its loop semantics', () => {
    const playlist = new PlaylistModel([0, 1, 2]); expect(playlist.move(2, 0)).toBe(true); expect(playlist.order).toEqual([2, 0, 1]); expect(playlist.arranger().currentPatternId()).toBe(2); expect(playlist.move(-1, 0)).toBe(false);
  });
});
