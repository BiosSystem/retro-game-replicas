import { bench, describe } from 'vitest';
import { stepRelativisticCombat } from './relativistic';
const initial = { x: 300, y: 0, vx: 700, vy: 80, coordinateTime: 0, properTime: 0, frequencyShift: 1 };
describe('relativistic combat physics', () => { bench('step 100,000 near-light-speed frames', () => { let state = initial; for (let frame = 0; frame < 100_000; frame++) state = stepRelativisticCombat(state, { thrust: frame % 3 - 1, turn: Math.sin(frame) }, 1 / 120, { x: 0, y: 0, mass: 300_000 }); }); });
