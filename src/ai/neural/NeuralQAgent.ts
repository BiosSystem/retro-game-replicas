import { DenseQNetwork, type NetworkSnapshot } from './DenseQNetwork';

export interface AgentTransition { state: readonly number[]; action: number; reward: number; nextState: readonly number[]; terminal?: boolean; }
export class NeuralQAgent {
  private steps = 0; private totalReward = 0; readonly network: DenseQNetwork; private readonly random: () => number; readonly gamma: number;
  constructor(network: DenseQNetwork, random: () => number = Math.random, gamma = 0.94) { this.network = network; this.random = random; this.gamma = gamma; }
  choose(state: readonly number[], epsilon = 0.08) { if (this.random() < clamp(epsilon, 0, 1)) return Math.floor(this.random() * this.network.outputs); return argmax(this.network.forward(state).output); }
  learn(transition: AgentTransition, learningRate = 0.008) { if (!Number.isInteger(transition.action) || transition.action < 0 || transition.action >= this.network.outputs) throw new Error('Agent action is invalid'); const current = this.network.forward(transition.state).output; const next = this.network.forward(transition.nextState).output; const target = [...current]; const reward = clamp(transition.reward, -10, 10); target[transition.action] = reward + (transition.terminal ? 0 : this.gamma * next[argmax(next)]); const loss = this.network.train(transition.state, target, learningRate); this.steps++; this.totalReward += reward; return loss; }
  metrics() { return { steps: this.steps, totalReward: this.totalReward, meanReward: this.steps ? this.totalReward / this.steps : 0 }; }
  export() { return this.network.snapshot(); }
  import(snapshot: NetworkSnapshot) { this.network.restore(snapshot); }
}
function argmax(values: ArrayLike<number>) { let best = 0; for (let index = 1; index < values.length; index++) if (values[index] > values[best]) best = index; return best; }
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : 0)); }
