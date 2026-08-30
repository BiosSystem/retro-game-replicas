import { expect, it } from 'vitest'; import { NeonVectorRollbackAdapter } from './NeonVectorRollbackAdapter';
it('projects a magenta remote Neon Vector opponent from rollback state', () => { const adapter = new NeonVectorRollbackAdapter(); expect(adapter.opponentView()).toMatchObject({ tint: 0xff2ec4, trail: true }); });
