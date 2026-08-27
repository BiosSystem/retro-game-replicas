import { DenseQNetwork, type NetworkSnapshot } from './DenseQNetwork';
import { NeuralQAgent } from './NeuralQAgent';

export class GhostBrain {
  readonly agent: NeuralQAgent; private previousState?: number[]; private previousAction = 1;
  private readonly storageKey: string; private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  constructor(storageKey: string, storage: Pick<Storage, 'getItem' | 'setItem'> | null, random: () => number = Math.random) { this.storageKey = storageKey; this.storage = storage; this.agent = new NeuralQAgent(new DenseQNetwork(6, 12, 3, random), random); if (storage) this.load(); }
  decide(sensors: readonly number[], reward = 0) { const state = normalizeSensors(sensors); if (this.previousState) this.agent.learn({ state: this.previousState, action: this.previousAction, reward, nextState: state }); const action = this.agent.choose(state, Math.max(0.02, 0.15 - this.agent.metrics().steps / 20000)); this.previousState = state; this.previousAction = action; return action - 1; }
  save() { if (!this.storage) return; this.storage.setItem(this.storageKey, JSON.stringify(this.agent.export())); }
  private load() { try { const raw = this.storage?.getItem(this.storageKey); if (raw && raw.length < 20000) this.agent.import(JSON.parse(raw) as NetworkSnapshot); } catch { return; } }
}
export function racerSensors(lane: number, roadCurve: number, speed: number, nitro: number, hazardLane: number, hazardDepth: number) { return normalizeSensors([lane, roadCurve, speed / 360, nitro / 100, hazardLane, hazardDepth]); }
export function breakoutSensors(paddleX: number, ballX: number, ballY: number, velocityX: number, velocityY: number, fieldWidth = 640) { return normalizeSensors([paddleX / fieldWidth * 2 - 1, ballX / fieldWidth * 2 - 1, ballY / 480 * 2 - 1, velocityX / 500, velocityY / 500, (ballX - paddleX) / fieldWidth]); }
function normalizeSensors(values: readonly number[]) { if (values.length !== 6) throw new Error('Ghost brain requires six sensors'); return values.map(value => Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0))); }
