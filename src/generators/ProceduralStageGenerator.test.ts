import { describe, expect, it } from 'vitest';
import { ProceduralStageGenerator } from './ProceduralStageGenerator';

describe('procedural infinite stage generator', () => {
  it('repeats identical layouts for the same campaign seed and stage', () => {
    const generator = new ProceduralStageGenerator(12345);
    expect(generator.generate(37)).toEqual(generator.generate(37));
    expect(generator.generate(37)).not.toEqual(new ProceduralStageGenerator(54321).generate(37));
  });

  it('scales speed, density, spawn rate, and boss cadence', () => {
    const generator = new ProceduralStageGenerator(7);
    const early = generator.generate(1); const late = generator.generate(1000);
    expect(late.enemySpeed).toBeGreaterThan(early.enemySpeed);
    expect(late.hazards.length).toBeGreaterThan(early.hazards.length);
    expect(late.spawnIntervalMs).toBeLessThan(early.spawnIntervalMs);
    expect(generator.generate(10).boss).toBe(true);
    expect(generator.generate(11).boss).toBe(false);
  });

  it('keeps stage ten thousand finite and bounded', () => {
    const stage = new ProceduralStageGenerator(99).generate(10_000);
    expect(stage.hazards).toHaveLength(80);
    expect(stage.hazards.every(hazard => hazard.lane >= 0 && hazard.lane < 4 && Number.isFinite(hazard.speed))).toBe(true);
    expect(stage.spawnIntervalMs).toBeGreaterThanOrEqual(220);
  });
});
