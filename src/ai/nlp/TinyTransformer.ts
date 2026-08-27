import { Int4Matrix } from './Int4Tensor';

export const LOCAL_VOCABULARY = ['<end>', 'the', 'vault', 'portal', 'shadow', 'guard', 'neon', 'echo', 'key', 'gravity', 'corridor', 'memory', 'steal', 'hide', 'move', 'wait', 'left', 'right', 'above', 'below', 'opens', 'closes', 'watches', 'forgets', 'follows', 'breaks', 'loops', 'returns', 'your', 'our', 'their', 'past', 'future', 'silent', 'bright', 'dark', 'cold', 'electric', 'impossible', 'recursive', 'safe', 'danger', 'now', 'again', 'because', 'while', 'until', 'if', 'through', 'behind', 'inside', 'outside', 'agent', 'thief', 'machine', 'signal', 'route', 'anchor', 'prize', 'door', 'room', 'step', 'trust', 'escape'] as const;
export interface TransformerConfig { dimension: number; hidden: number; context: number; layers: number; }
interface Layer { query: Int4Matrix; key: Int4Matrix; value: Int4Matrix; output: Int4Matrix; up: Int4Matrix; down: Int4Matrix; }

export class TinyInt4Transformer {
  readonly config: TransformerConfig;
  private readonly embedding: Int4Matrix;
  private readonly logits: Int4Matrix;
  private readonly layers: Layer[];
  constructor(seed = 0x4e4c5034, config: TransformerConfig = { dimension: 32, hidden: 64, context: 64, layers: 2 }) {
    if (config.dimension < 8 || config.dimension > 64 || config.hidden > 128 || config.context > 128 || config.layers < 1 || config.layers > 4) throw new Error('Transformer configuration exceeds local limits');
    this.config = { ...config }; let cursor = seed;
    const matrix = (rows: number, columns: number) => { cursor = Math.imul(cursor ^ 0x9e3779b9, 1664525) + 1013904223 | 0; return Int4Matrix.generated(rows, columns, cursor, .055); };
    this.embedding = matrix(LOCAL_VOCABULARY.length, config.dimension); this.logits = matrix(LOCAL_VOCABULARY.length, config.dimension);
    this.layers = Array.from({ length: config.layers }, () => ({ query: matrix(config.dimension, config.dimension), key: matrix(config.dimension, config.dimension), value: matrix(config.dimension, config.dimension), output: matrix(config.dimension, config.dimension), up: matrix(config.hidden, config.dimension), down: matrix(config.dimension, config.hidden) }));
  }
  tokenize(text: string) { return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(-this.config.context).map(word => { const exact = LOCAL_VOCABULARY.indexOf(word as typeof LOCAL_VOCABULARY[number]); return exact >= 0 ? exact : 1 + hash(word) % (LOCAL_VOCABULARY.length - 1); }); }
  infer(tokens: readonly number[]) {
    const bounded = tokens.slice(-this.config.context); if (!bounded.length) bounded.push(1);
    const sequence = bounded.map((token, position) => this.embed(token, position)); let hidden = sequence[sequence.length - 1].slice();
    for (const layer of this.layers) {
      const query = layer.query.project(hidden), scores = new Float32Array(sequence.length), values = sequence.map(value => layer.value.project(value));
      let maximum = -Infinity; for (let i = 0; i < sequence.length; i++) { const key = layer.key.project(sequence[i]); let score = 0; for (let d = 0; d < query.length; d++) score += query[d] * key[d]; scores[i] = score / Math.sqrt(query.length); maximum = Math.max(maximum, scores[i]); }
      let total = 0; for (let i = 0; i < scores.length; i++) { scores[i] = Math.exp(scores[i] - maximum); total += scores[i]; }
      const attended = new Float32Array(this.config.dimension); for (let i = 0; i < scores.length; i++) for (let d = 0; d < attended.length; d++) attended[d] += values[i][d] * scores[i] / total;
      const projected = layer.output.project(attended); for (let d = 0; d < hidden.length; d++) hidden[d] = normalize(hidden[d] + projected[d]);
      const expanded = layer.up.project(hidden); for (let i = 0; i < expanded.length; i++) expanded[i] = gelu(expanded[i]); const contracted = layer.down.project(expanded); for (let d = 0; d < hidden.length; d++) hidden[d] = normalize(hidden[d] + contracted[d]);
    }
    return this.logits.project(hidden);
  }
  generate(prompt: string, maximumTokens = 12, seed = 1) { const tokens = this.tokenize(prompt), output: number[] = []; let state = seed | 0; for (let step = 0; step < Math.max(1, Math.min(24, maximumTokens)); step++) { const logits = this.infer([...tokens, ...output]); state = random(state); const token = sampleTopK(logits, state, 6); if (token === 0 && output.length >= 3) break; output.push(token || 1); } return output.map(token => LOCAL_VOCABULARY[token]).join(' '); }
  parameterBytes() { const matrices = [this.embedding, this.logits, ...this.layers.flatMap(layer => [layer.query, layer.key, layer.value, layer.output, layer.up, layer.down])]; return matrices.reduce((total, matrix) => total + matrix.packed.byteLength, 0); }
  private embed(token: number, position: number) { const output = new Float32Array(this.config.dimension); for (let d = 0; d < output.length; d++) output[d] = this.embedding.get(Math.abs(token) % LOCAL_VOCABULARY.length, d) + Math.sin(position / 10000 ** (2 * Math.floor(d / 2) / output.length)) * .05; return output; }
}

function sampleTopK(logits: Float32Array, state: number, k: number) { const indices = Array.from(logits.keys()).sort((a, b) => logits[b] - logits[a]).slice(0, k); const weights = indices.map(index => Math.exp(logits[index] - logits[indices[0]])), total = weights.reduce((a, b) => a + b, 0); let target = (state >>> 0) / 4294967296 * total; for (let i = 0; i < indices.length; i++) { target -= weights[i]; if (target <= 0) return indices[i]; } return indices[0]; }
function gelu(value: number) { return .5 * value * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (value + .044715 * value ** 3))); } function normalize(value: number) { return value / Math.sqrt(1 + value * value); } function hash(value: string) { let result = 2166136261; for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619); return result >>> 0; } function random(value: number) { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value | 0; }
