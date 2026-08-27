import { describe, expect, it } from 'vitest';
import { getEffectPlan } from './AudioEngine';

describe('procedural audio plans', () => {
  it('builds a descending laser envelope', () => {
    const plan = getEffectPlan('LASER');
    expect(plan.noise).toBe(false);
    expect(plan.tones[0]).toMatchObject({ frequency: 880, endFrequency: 220, type: 'square' });
  });

  it('layers filtered noise into explosions', () => {
    const plan = getEffectPlan('EXPLOSION');
    expect(plan.noise).toBe(true);
    expect(plan.tones[0].endFrequency).toBeLessThan(plan.tones[0].frequency);
  });

  it('schedules stage notes in ascending order', () => {
    const notes = getEffectPlan('STAGE_CLEAR').tones;
    expect(notes.map(note => note.frequency)).toEqual([523, 659, 784, 1047]);
    expect(notes.map(note => note.delay)).toEqual([0, 0.11, 0.22, 0.33]);
  });
});
