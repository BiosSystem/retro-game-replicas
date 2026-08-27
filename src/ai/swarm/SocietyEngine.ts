import { TinyInt4Transformer } from '../nlp/TinyTransformer';
import { compileInt4Pipeline } from '../nlp/WebGpuInt4';

export type SocietyAction = 'TRADE' | 'ALLY' | 'OBSERVE' | 'MIGRATE';
export interface SocietyAgent { id: string; faction: string; wealth: number; influence: number; trust: number; statement: string; }
export interface SocietyEvent { speaker: string; listener: string; action: SocietyAction; statement: string; faction: string; }
export interface SocietyRound { round: number; events: SocietyEvent[]; leader: string; consensus: SocietyAction; factions: Record<string, number>; }

interface InternalAgent extends SocietyAgent { model: TinyInt4Transformer; seed: number; }
const FACTIONS = ['ORBIT', 'ROOT', 'TIDE', 'PRISM'] as const, ACTIONS: SocietyAction[] = ['TRADE', 'ALLY', 'OBSERVE', 'MIGRATE'];

export class SwarmSociety {
  private readonly agents: InternalAgent[]; private round = 0;
  constructor(count = 24, seed = 0x53574152) { const size = Math.max(4, Math.min(32, Math.floor(count))); this.agents = Array.from({ length: size }, (_, index) => { const agentSeed = mix(seed, index); return { id: `agent-${index.toString().padStart(2, '0')}`, faction: FACTIONS[agentSeed % FACTIONS.length], wealth: 20 + agentSeed % 31, influence: 1 + (agentSeed >>> 8) % 10, trust: .25 + ((agentSeed >>> 16) % 50) / 100, statement: 'signal waits', model: new TinyInt4Transformer(agentSeed), seed: agentSeed }; }); }
  async runRound(topic: string): Promise<SocietyRound> { const safeTopic = sanitize(topic), snapshot = this.agents.map(agent => ({ ...agent })), events = await Promise.all(this.agents.map(async (agent, index) => { const listener = snapshot[(index + 1 + this.round % (snapshot.length - 1)) % snapshot.length], state = mix(agent.seed, this.round ^ hash(safeTopic)), action = ACTIONS[state % ACTIONS.length], prompt = `${safeTopic} ${agent.faction.toLowerCase()} agent ${action.toLowerCase()} trust ${listener.statement}`, statement = agent.model.generate(prompt, 8, state); return { speaker: agent.id, listener: listener.id, action, statement, faction: agent.faction }; })); this.apply(events); this.round++; const counts = Object.fromEntries(FACTIONS.map(faction => [faction, this.agents.filter(agent => agent.faction === faction).length])), actionCounts = ACTIONS.map(action => ({ action, count: events.filter(event => event.action === action).length })).sort((a, b) => b.count - a.count || ACTIONS.indexOf(a.action) - ACTIONS.indexOf(b.action)); return { round: this.round, events, leader: this.hierarchy()[0].id, consensus: actionCounts[0].action, factions: counts }; }
  hierarchy() { return this.agents.map(agent => publicAgent(agent)).sort((a, b) => b.influence + b.wealth * .1 + b.trust * 5 - (a.influence + a.wealth * .1 + a.trust * 5) || a.id.localeCompare(b.id)); }
  snapshot() { return { round: this.round, agents: this.agents.map(agent => publicAgent(agent)) }; }
  parameterBytes() { return this.agents.reduce((sum, agent) => sum + agent.model.parameterBytes(), 0); }
  compileWebGpu() { return compileInt4Pipeline(); }
  private apply(events: SocietyEvent[]) { for (const event of events) { const speaker = this.agents.find(agent => agent.id === event.speaker)!, listener = this.agents.find(agent => agent.id === event.listener)!; speaker.statement = event.statement; if (event.action === 'TRADE' && speaker.wealth > 1) { speaker.wealth--; listener.wealth++; speaker.influence += .05; } else if (event.action === 'ALLY') { speaker.trust = clamp(speaker.trust + .03, 0, 1); listener.trust = clamp(listener.trust + .02, 0, 1); if (speaker.trust > .72) speaker.faction = listener.faction; } else if (event.action === 'MIGRATE') speaker.faction = FACTIONS[(FACTIONS.indexOf(speaker.faction as typeof FACTIONS[number]) + 1) % FACTIONS.length]; else speaker.influence += .01; } }
}
function publicAgent(agent: InternalAgent): SocietyAgent { return { id: agent.id, faction: agent.faction, wealth: agent.wealth, influence: agent.influence, trust: agent.trust, statement: agent.statement }; }
function sanitize(value: string) { return value.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 64) || 'world'; }
function hash(value: string) { let result = 2166136261; for (let index = 0; index < value.length; index++) result = Math.imul(result ^ value.charCodeAt(index), 16777619); return result >>> 0; }
function mix(seed: number, value: number) { let state = seed ^ Math.imul(value + 1, 0x9e3779b9); state ^= state >>> 16; state = Math.imul(state, 0x45d9f3b); return (state ^ state >>> 16) >>> 0; }
function clamp(value: number, low: number, high: number) { return Math.max(low, Math.min(high, value)); }
