import { expect, it } from 'vitest'; import { ProjectileEventType, readProjectileEvent, writeProjectileEvent } from './ProjectileProtocol';
it('round-trips fixed-size projectile events', () => expect(readProjectileEvent(writeProjectileEvent(new Uint8Array(14), { type: ProjectileEventType.FIRE_LASER, id: 4, x: 12.5, y: -3, angle: .25, origin: 9 }))).toMatchObject({ id: 4, x: 12.5, origin: 9 }));
