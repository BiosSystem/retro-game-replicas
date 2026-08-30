import { describe, expect, it } from 'vitest';
import { AudioVoiceAllocator } from './AudioVoiceAllocator';

describe('audio voice allocator', () => {
  it('caps concurrent generated effects and reuses finished slots', () => {
    const voices = new AudioVoiceAllocator(2);
    expect(voices.acquire(1, 0.4)).toBe(true);
    expect(voices.acquire(1, 0.4)).toBe(true);
    expect(voices.acquire(1.1, 0.4)).toBe(false);
    expect(voices.snapshot(1.41)).toMatchObject({ active: 0, dropped: 1, capacity: 2 });
    expect(voices.acquire(1.41, 0.1)).toBe(true);
  });

  it('rejects invalid capacities and bounds pathological durations', () => {
    expect(() => new AudioVoiceAllocator(0)).toThrow('capacity');
    const voices = new AudioVoiceAllocator(1);
    expect(voices.acquire(2, Number.POSITIVE_INFINITY)).toBe(true);
    expect(voices.snapshot(2.006).active).toBe(0);
  });
});
