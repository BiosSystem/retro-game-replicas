export type TrackerVoice = 'LEAD' | 'ARP' | 'BASS' | 'DRUMS';
export type DrumHit = 'KICK' | 'SNARE' | 'HAT';
export interface TrackerStep { note?: number; chord?: number[]; drum?: DrumHit; gate?: number; }
export interface TrackerTrack { id: string; title: string; bpm: number; stepsPerBeat: number; voices: Record<TrackerVoice, TrackerStep[]>; }

const rest = (): TrackerStep => ({});
const notes = (...values: number[]): TrackerStep[] => values.map(note => note ? { note, gate: 0.78 } : rest());
const drums = (...values: Array<DrumHit | 0>): TrackerStep[] => values.map(drum => drum ? { drum } : rest());

export const TRACKS: Record<string, TrackerTrack> = {
  plaza: {
    id: 'plaza', title: 'Arcade Plaza', bpm: 132, stepsPerBeat: 4,
    voices: {
      LEAD: notes(72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 79, 77, 74),
      ARP: [{ chord: [60, 64, 67] }, rest(), { chord: [60, 64, 67] }, rest(), { chord: [62, 65, 69] }, rest(), { chord: [62, 65, 69] }, rest(), { chord: [59, 62, 67] }, rest(), { chord: [59, 62, 67] }, rest(), { chord: [60, 64, 67] }, rest(), { chord: [60, 64, 67] }, rest()],
      BASS: notes(36, 0, 36, 0, 38, 0, 38, 0, 35, 0, 35, 0, 36, 0, 36, 0),
      DRUMS: drums('KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'KICK', 'SNARE', 'HAT'),
    },
  },
  space: {
    id: 'space', title: 'Deep Space Recon', bpm: 116, stepsPerBeat: 4,
    voices: { LEAD: notes(69, 0, 72, 0, 76, 74, 72, 0, 67, 0, 71, 0, 74, 72, 71, 0), ARP: notes(57, 60, 64, 60, 55, 59, 62, 59, 53, 57, 60, 57, 55, 59, 62, 59), BASS: notes(33, 0, 33, 0, 31, 0, 31, 0, 29, 0, 29, 0, 31, 0, 31, 0), DRUMS: drums('KICK', 'HAT', 0, 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'KICK', 'HAT', 0, 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT') },
  },
  sprint: {
    id: 'sprint', title: 'Cyber Sprint', bpm: 172, stepsPerBeat: 4,
    voices: { LEAD: notes(76, 79, 83, 79, 74, 77, 81, 77, 72, 76, 79, 76, 74, 77, 81, 84), ARP: notes(64, 67, 71, 67, 62, 65, 69, 65, 60, 64, 67, 64, 62, 65, 69, 72), BASS: notes(40, 0, 40, 40, 38, 0, 38, 38, 36, 0, 36, 36, 38, 0, 38, 38), DRUMS: drums('KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'KICK', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT') },
  },
  vector: {
    id: 'vector', title: 'Hyper Vector', bpm: 148, stepsPerBeat: 4,
    voices: { LEAD: notes(81, 0, 79, 0, 76, 0, 74, 76, 81, 0, 84, 83, 79, 0, 76, 74), ARP: notes(57, 60, 64, 69, 55, 59, 62, 67, 53, 57, 60, 65, 55, 59, 62, 67), BASS: notes(33, 0, 33, 0, 31, 0, 31, 0, 29, 0, 29, 0, 31, 0, 31, 0), DRUMS: drums('KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'KICK', 'KICK', 'HAT', 'SNARE', 'HAT') },
  },
  racer: {
    id: 'racer', title: 'Midnight Highway', bpm: 156, stepsPerBeat: 4,
    voices: { LEAD: notes(76, 79, 83, 88, 86, 83, 79, 76, 74, 78, 81, 86, 83, 81, 78, 74), ARP: notes(64, 67, 71, 67, 62, 66, 69, 66, 60, 64, 67, 64, 62, 66, 69, 71), BASS: notes(40, 0, 40, 47, 38, 0, 38, 45, 36, 0, 36, 43, 38, 0, 38, 45), DRUMS: drums('KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'KICK', 'SNARE', 'HAT') },
  },
  caster: {
    id: 'caster', title: 'Chromatic Dungeon', bpm: 138, stepsPerBeat: 4,
    voices: { LEAD: notes(72, 0, 73, 72, 68, 0, 67, 63, 72, 75, 73, 70, 68, 67, 63, 60), ARP: notes(60, 63, 67, 63, 56, 60, 63, 60, 58, 61, 65, 61, 55, 58, 63, 58), BASS: notes(36, 0, 36, 35, 32, 0, 32, 31, 34, 0, 34, 33, 31, 0, 31, 30), DRUMS: drums('KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 0, 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'KICK', 'SNARE', 'HAT') },
  },
  tactics: {
    id: 'tactics', title: 'Silicon Command', bpm: 126, stepsPerBeat: 4,
    voices: { LEAD: notes(69, 72, 76, 72, 67, 71, 74, 71, 65, 69, 72, 69, 67, 71, 74, 78), ARP: notes(57, 60, 64, 60, 55, 59, 62, 59, 53, 57, 60, 57, 55, 59, 62, 66), BASS: notes(33, 0, 33, 40, 31, 0, 31, 38, 29, 0, 29, 36, 31, 0, 31, 38), DRUMS: drums('KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'KICK', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'KICK') },
  },
  labyrinth: {
    id: 'labyrinth', title: 'Subterranean Signal', bpm: 142, stepsPerBeat: 4,
    voices: { LEAD: notes(64, 0, 67, 68, 71, 0, 68, 67, 62, 0, 65, 67, 70, 68, 65, 62), ARP: notes(52, 55, 59, 55, 50, 53, 57, 53, 48, 52, 55, 52, 50, 53, 57, 60), BASS: notes(28, 0, 28, 35, 26, 0, 26, 33, 24, 0, 24, 31, 26, 0, 26, 33), DRUMS: drums('KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 0, 'SNARE', 'HAT', 'KICK', 'HAT', 'SNARE', 'HAT', 'KICK', 'KICK', 'SNARE', 'HAT') },
  },
};
