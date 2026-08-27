import { describe, expect, it } from 'vitest';
import { SwarmSociety } from './SocietyEngine';
describe('local INT4 swarm society', () => {
  it('runs deterministic bounded agent conversations', async () => { const a = new SwarmSociety(12, 7), b = new SwarmSociety(12, 7); expect(await a.runRound('portal trade')).toEqual(await b.runRound('portal trade')); expect(a.parameterBytes()).toBe(12 * 10_240); });
  it('forms explicit hierarchy, faction, and trade state', async () => { const society = new SwarmSociety(24, 9); for (let round = 0; round < 12; round++) await society.runRound('voxel resource portal'); const hierarchy = society.hierarchy(), snapshot = society.snapshot(); expect(hierarchy).toHaveLength(24); expect(new Set(hierarchy.map(agent => agent.id)).size).toBe(24); expect(Object.values(snapshot.agents).every(agent => agent.wealth >= 0 && agent.trust >= 0 && agent.trust <= 1)).toBe(true); });
  it('sanitizes topics and limits society capacity', async () => { const society = new SwarmSociety(100, 2), round = await society.runRound('<script>danger</script>'); expect(round.events).toHaveLength(32); expect(round.events.every(event => !event.statement.includes('<'))).toBe(true); });
});
