import { describe, expect, it } from 'vitest';
import { generateParadoxLevel, initialParadoxPlayer, makeAnchor, stepParadox, updateGuards } from './ParadoxSystems';
describe('Neon Paradox systems', () => {
  it('generates deterministic impossible geometry and guards', () => { expect(generateParadoxLevel(4)).toEqual(generateParadoxLevel(4)); expect(generateParadoxLevel(4).tesseract).toHaveLength(16); });
  it('integrates bounded first-person movement', () => { let player = initialParadoxPlayer(); for (let i = 0; i < 120; i++) player = stepParadox(player, { forward: 1, strafe: 0, turn: .2 }, 1 / 60); expect(player.x).toBeGreaterThan(-13.3); expect(player.z).toBeLessThan(8); });
  it('lets guards acquire bright nearby players and validates anchor frames', () => { const guard = updateGuards([{ id: 1, x: 1, z: 8, angle: 0, alert: 0 }], initialParadoxPlayer(), .8, 1)[0]; expect(guard.alert).toBeGreaterThan(.5); expect(makeAnchor(1, 2, { x: 0, y: 1, z: 0 }, 0).normal.x).toBe(-1); });
});
