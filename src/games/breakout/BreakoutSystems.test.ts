import { describe, expect, it } from 'vitest';
import { generateBrickField, generatePalette, reflectFromPaddle } from './BreakoutSystems';

describe('Neon Breakout systems', () => {
  it('reflects away from the paddle with bounded speed and paddle spin', () => {
    const left = reflectFromPaddle({ ballX: 270, paddleX: 320, paddleWidth: 100, paddleVelocity: -300, speed: 400 });
    const right = reflectFromPaddle({ ballX: 370, paddleX: 320, paddleWidth: 100, paddleVelocity: 300, speed: 400 });
    expect(left.vx).toBeLessThan(0); expect(right.vx).toBeGreaterThan(0); expect(left.vy).toBeLessThan(0);
    expect(Math.hypot(left.vx, left.vy)).toBeCloseTo(400);
  });

  it('generates deterministic escalating fields with boss and wall bricks', () => {
    expect(generateBrickField(8, 12)).toEqual(generateBrickField(8, 12));
    expect(generateBrickField(5).bricks.some(brick => brick.kind === 'BOSS')).toBe(true);
    expect(generateBrickField(8).bricks.some(brick => brick.kind === 'WALL')).toBe(true);
    expect(generateBrickField(20).rows).toBeGreaterThan(generateBrickField(1).rows);
  });

  it('rotates procedural palettes without external assets', () => {
    expect(generatePalette(1)).toHaveLength(5); expect(generatePalette(1)).not.toEqual(generatePalette(2));
  });
});
