import { describe, expect, it } from 'vitest';
import { ProgressionDirector } from './ProgressionDirector';

describe('ProgressionDirector', () => {
  it('builds and expires score combos', () => {
    const director = new ProgressionDirector();
    expect(director.addScore(20, 1000)).toBe(20);
    expect(director.addScore(20, 2000)).toBe(40);
    expect(director.addScore(20, 5000)).toBe(20);
    expect(director.snapshot().score).toBe(80);
  });

  it('unlocks behavior patterns by stage and distance', () => {
    const director = new ProgressionDirector();
    expect(director.chooseBehavior(100)).toBe('PATROL');
    director.advanceStage();
    expect(director.chooseBehavior(300)).toBe('CHASE');
    director.advanceStage();
    director.advanceStage();
    expect(director.chooseBehavior(200)).toBe('BARRAGE');
  });
});
