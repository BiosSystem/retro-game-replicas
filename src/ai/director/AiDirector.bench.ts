import { bench, describe } from 'vitest'; import { AiDirector } from './AiDirector'; const director = new AiDirector(() => .5); let now = 0;
describe('AI director', () => { bench('evaluate and train adaptation', () => { director.update(now += 751, { damageRate: .3, accuracy: .6, movementEntropy: .7, nearMissRate: .4, lives: 2, stage: 30 }); }); });
