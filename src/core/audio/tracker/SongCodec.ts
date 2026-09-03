import { TrackerPattern, TRACKER_CELL_BYTES, TRACKER_CHANNEL_COUNT } from './TrackerPattern';
import type { TrackerInstrument, TrackerSong } from './TrackerSequencer';
import { asBytes, decodeUtf8, encodeUtf8, hasBytes, viewOf } from '../../utils/binary';

const MAGIC = 0x4e534551; // NS EQ
const VERSION = 1;
const HEADER_BYTES = 16;
const INSTRUMENT_BYTES = 18;

export class SongCodecError extends Error {}

export interface DecodedSong extends TrackerSong { loopPosition: number; }

export function encodeSong(song: TrackerSong): ArrayBuffer {
  validate(song);
  const instruments = song.instruments;
  const instrumentBytes = instruments.length * INSTRUMENT_BYTES;
  const patternBytes = song.patterns.reduce((total, pattern) => total + 1 + pattern.data.length, 0);
  const total = HEADER_BYTES + instrumentBytes + patternBytes + song.order.length * 2;
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer); const bytes = new Uint8Array(buffer);
  view.setUint32(0, MAGIC); view.setUint8(4, VERSION); view.setUint16(5, song.bpm); view.setUint8(7, song.speed);
  view.setUint16(8, song.patterns.length); view.setUint16(10, song.order.length); view.setUint8(12, instruments.length); view.setUint16(13, song.loopPosition ?? 0);
  let offset = HEADER_BYTES;
  for (const instrument of instruments) {
    bytes[offset] = byte(instrument.id);
    const encodedName = encodeUtf8(instrument.name).subarray(0, INSTRUMENT_BYTES - 2);
    bytes[offset + 1] = encodedName.length; bytes.set(encodedName, offset + 2); offset += INSTRUMENT_BYTES;
  }
  for (const pattern of song.patterns) { bytes[offset] = pattern.rows; offset += 1; bytes.set(pattern.data, offset); offset += pattern.data.length; }
  for (const entry of song.order) { view.setUint16(offset, entry); offset += 2; }
  return buffer;
}

export function decodeSong(source: ArrayBuffer | Uint8Array): DecodedSong {
  const bytes = asBytes(source);
  if (bytes.byteLength < HEADER_BYTES) throw new SongCodecError('Song data is truncated before its header');
  const view = viewOf(bytes);
  if (view.getUint32(0) !== MAGIC) throw new SongCodecError('Song data has an invalid neonseq signature');
  if (view.getUint8(4) !== VERSION) throw new SongCodecError('Song data uses an unsupported neonseq version');
  const bpm = view.getUint16(5); const speed = view.getUint8(7); const patternCount = view.getUint16(8); const orderCount = view.getUint16(10);
  const instrumentCount = view.getUint8(12); const loopPosition = view.getUint16(13);
  let offset = HEADER_BYTES;
  const instruments: TrackerInstrument[] = [];
  for (let index = 0; index < instrumentCount; index += 1) {
    requireBytes(bytes, offset, INSTRUMENT_BYTES);
    const length = bytes[offset + 1];
    if (length > INSTRUMENT_BYTES - 2) throw new SongCodecError('Song instrument name is malformed');
    instruments.push({ id: bytes[offset], name: decodeUtf8(bytes.subarray(offset + 2, offset + 2 + length)) });
    offset += INSTRUMENT_BYTES;
  }
  const patterns: TrackerPattern[] = [];
  for (let index = 0; index < patternCount; index += 1) {
    requireBytes(bytes, offset, 1); const rows = bytes[offset]; offset += 1;
    if (rows !== 32 && rows !== 64) throw new SongCodecError('Song pattern has an unsupported row count');
    const length = rows * TRACKER_CHANNEL_COUNT * TRACKER_CELL_BYTES; requireBytes(bytes, offset, length);
    patterns.push(new TrackerPattern(rows, bytes.subarray(offset, offset + length))); offset += length;
  }
  requireBytes(bytes, offset, orderCount * 2); const order = new Uint16Array(orderCount);
  for (let index = 0; index < orderCount; index += 1) { order[index] = view.getUint16(offset); offset += 2; }
  if (offset !== bytes.length) throw new SongCodecError('Song data contains a trailing malformed payload');
  const song: DecodedSong = { bpm, speed, patterns, order, instruments, loopPosition };
  validate(song);
  return song;
}

function validate(song: TrackerSong) {
  if (!Number.isInteger(song.bpm) || song.bpm < 30 || song.bpm > 300) throw new SongCodecError('Song BPM must be between 30 and 300');
  if (!Number.isInteger(song.speed) || song.speed < 1 || song.speed > 12) throw new SongCodecError('Song speed must be between 1 and 12');
  if (song.patterns.length === 0 || song.patterns.length > 0xffff || song.order.length === 0 || song.order.length > 0xffff) throw new SongCodecError('Song order or pattern table is invalid');
  if (song.instruments.length > 0xff) throw new SongCodecError('Song contains too many instruments');
  for (const entry of song.order) if (!song.patterns[entry]) throw new SongCodecError('Song order refers to a missing pattern');
}
function requireBytes(bytes: Uint8Array, offset: number, count: number) { if (!hasBytes(bytes, offset, count)) throw new SongCodecError('Song data is truncated'); }
function byte(value: number) { return Math.max(0, Math.min(255, Math.floor(value))); }
