import { bench, describe } from 'vitest';
import { castRay, generateBspDungeon } from './RaycasterSystems';
const dungeon = generateBspDungeon(12, 48, 48);
describe('DDA ray stress', () => { bench('cast 100000 DDA rays', () => { for (let ray = 0; ray < 100000; ray++) castRay(dungeon, dungeon.spawn.x, dungeon.spawn.y, ray * 0.0001); }, { time: 500 }); });
