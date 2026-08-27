import { describe, expect, it } from 'vitest';
import { gravitationalTimeFactor, longitudinalDoppler, lorentzContraction, lorentzFactor, properTimeDelta, schwarzschildRadius, SPEED_OF_LIGHT, stepRelativisticCombat, weakFieldLightDeflection } from './relativistic';
describe('relativistic physics', () => {
  it('matches special-relativity factors at 0.8c', () => { const speed = SPEED_OF_LIGHT * .8; expect(lorentzFactor(speed)).toBeCloseTo(5 / 3, 10); expect(lorentzContraction(10, speed)).toBeCloseTo(6, 10); expect(longitudinalDoppler(speed, true)).toBeCloseTo(3, 10); });
  it('slows proper time outside a Schwarzschild horizon', () => { const mass = 1.989e30, radius = schwarzschildRadius(mass) * 2; expect(gravitationalTimeFactor(mass, radius)).toBeCloseTo(Math.SQRT1_2, 10); expect(properTimeDelta(1, 0, mass, radius)).toBeCloseTo(Math.SQRT1_2, 10); expect(weakFieldLightDeflection(mass, radius * 4)).toBeGreaterThan(0); });
  it('keeps arcade combat below its normalized light speed', () => { let state = { x: 300, y: 0, vx: 900, vy: 0, coordinateTime: 0, properTime: 0, frequencyShift: 1 }; for (let frame = 0; frame < 600; frame++) state = stepRelativisticCombat(state, { thrust: 1, turn: .2 }, 1 / 60, { x: 0, y: 0, mass: 300_000 }); expect(Math.hypot(state.vx, state.vy)).toBeLessThanOrEqual(950.000001); expect(state.properTime).toBeLessThan(state.coordinateTime); });
});
