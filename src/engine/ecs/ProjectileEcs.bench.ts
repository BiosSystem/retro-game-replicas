import { bench, describe } from 'vitest';
import { ProjectileEcs } from './ProjectileEcs';
const ecs = new ProjectileEcs(100_000, false);
for (let i = 0; i < ecs.capacity; i++) { const a = i * 2.399963229728653; ecs.spawn({ x: 320, y: 240, vx: Math.cos(a) * 18, vy: Math.sin(a) * 18, life: 60, kind: i % 3 as 0 | 1 | 2 }); }
describe('projectile ECS', () => { bench('update 100,000 projectiles', () => { ecs.update(1 / 60, 320, 440); if (ecs.activeCount < 100_000) { ecs.clear(); for (let i = 0; i < ecs.capacity; i++) ecs.spawn({ x: 320, y: 240, vx: 1, vy: 1, life: 60 }); } }); });
