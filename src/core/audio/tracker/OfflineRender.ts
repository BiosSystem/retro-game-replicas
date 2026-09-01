import type { TrackerSong } from './TrackerSequencer';
import { TRACKER_CHANNELS } from './TrackerPattern';

export interface OfflineRenderResult { pcm: ArrayBuffer; wav: ArrayBuffer; sampleRate: number; frames: number; }

/** Wrap mono normalized samples in a standards-compliant 16-bit PCM WAV container. */
export function encodeWavPcm16(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const dataBytes = samples.length * 2; const buffer = new ArrayBuffer(44 + dataBytes); const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true); writeAscii(view, 8, 'WAVE'); writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeAscii(view, 36, 'data'); view.setUint32(40, dataBytes, true);
  for (let index = 0; index < samples.length; index += 1) view.setInt16(44 + index * 2, Math.round(Math.max(-1, Math.min(1, samples[index])) * 0x7fff), true);
  return buffer;
}

/** Render a tracker song offline using only oscillator graphs, then return raw PCM and WAV bytes. */
export async function renderSongOffline(song: TrackerSong, sampleRate = 44100): Promise<OfflineRenderResult> {
  const tickSeconds = 2.5 / song.bpm; const rowSeconds = tickSeconds * song.speed;
  const rows = song.order.reduce((sum, patternId) => sum + song.patterns[patternId].rows, 0);
  const duration = Math.max(0.1, rows * rowSeconds + 0.5); const frameCount = Math.ceil(duration * sampleRate);
  const context = new OfflineAudioContext(1, frameCount, sampleRate); const gain = context.createGain(); gain.gain.value = 0.16; gain.connect(context.destination);
  let time = 0;
  for (const patternId of song.order) {
    const pattern = song.patterns[patternId];
    for (let row = 0; row < pattern.rows; row += 1) {
      for (const channel of TRACKER_CHANNELS) {
        const cell = pattern.getCell(row, channel);
        if (cell.note === 0) continue;
        const oscillator = context.createOscillator(); const envelope = context.createGain();
        oscillator.type = channel === 'CH3' ? 'triangle' : channel === 'CH4' ? 'sawtooth' : 'square';
        oscillator.frequency.value = 440 * Math.pow(2, (((cell.note - 1) + (cell.octave + 1) * 12 - 69) / 12));
        envelope.gain.setValueAtTime(0.0001, time); envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, cell.volume / 255), time + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.0001, time + rowSeconds * 0.85); oscillator.connect(envelope).connect(gain); oscillator.start(time); oscillator.stop(time + rowSeconds * 0.86);
      }
      time += rowSeconds;
    }
  }
  const rendered = await context.startRendering(); const samples = rendered.getChannelData(0); const pcm = new ArrayBuffer(samples.length * 4); new Float32Array(pcm).set(samples);
  return { pcm, wav: encodeWavPcm16(samples, sampleRate), sampleRate, frames: samples.length };
}

function writeAscii(view: DataView, offset: number, text: string) { for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index)); }
