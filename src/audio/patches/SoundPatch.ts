export type PatchWaveform = 'square' | 'sawtooth' | 'triangle' | 'sine' | 'pulse' | 'noise';
export interface SoundPatch {
  id: string;
  name: string;
  waveform: PatchWaveform;
  frequency: number;
  endFrequency: number;
  duration: number;
  attack: number;
  decay: number;
  dutyCycle: number;
  filterHz: number;
  gain: number;
}

export interface PatchValidation { valid: boolean; errors: string[]; patch?: SoundPatch; }
const ID = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;
const WAVES: PatchWaveform[] = ['square', 'sawtooth', 'triangle', 'sine', 'pulse', 'noise'];

export function validateSoundPatch(value: unknown): PatchValidation {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ['Patch must be an object'] };
  const allowed = ['id', 'name', 'waveform', 'frequency', 'endFrequency', 'duration', 'attack', 'decay', 'dutyCycle', 'filterHz', 'gain'];
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`patch.${key} is not allowed`);
  if (typeof value.id !== 'string' || !ID.test(value.id)) errors.push('id must use 3 to 32 lowercase letters, digits, or hyphens');
  if (typeof value.name !== 'string' || value.name.length < 1 || value.name.length > 48 || /[<>\u0000-\u001f]/.test(value.name)) errors.push('name contains invalid characters or length');
  if (!WAVES.includes(value.waveform as PatchWaveform)) errors.push('waveform is invalid');
  check(value.frequency, 30, 4000, 'frequency', errors); check(value.endFrequency, 20, 4000, 'endFrequency', errors);
  check(value.duration, 0.02, 2, 'duration', errors); check(value.attack, 0.001, 0.2, 'attack', errors); check(value.decay, 0.01, 2, 'decay', errors);
  check(value.dutyCycle, 0.125, 0.75, 'dutyCycle', errors); check(value.filterHz, 80, 12000, 'filterHz', errors); check(value.gain, 0.01, 0.8, 'gain', errors);
  if (errors.length || typeof value.id !== 'string' || typeof value.name !== 'string') return { valid: false, errors };
  return { valid: true, errors, patch: Object.freeze({ id: value.id, name: value.name, waveform: value.waveform as PatchWaveform, frequency: Number(value.frequency), endFrequency: Number(value.endFrequency), duration: Number(value.duration), attack: Number(value.attack), decay: Number(value.decay), dutyCycle: Number(value.dutyCycle), filterHz: Number(value.filterHz), gain: Number(value.gain) }) };
}

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function check(value: unknown, minimum: number, maximum: number, name: string, errors: string[]) { if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) errors.push(`${name} must be between ${minimum} and ${maximum}`); }

export const DEFAULT_PATCH: SoundPatch = { id: 'neon-pulse', name: 'Neon Pulse', waveform: 'pulse', frequency: 880, endFrequency: 220, duration: 0.18, attack: 0.008, decay: 0.15, dutyCycle: 0.25, filterHz: 4200, gain: 0.3 };
