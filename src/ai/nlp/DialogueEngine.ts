import { TinyInt4Transformer } from './TinyTransformer';
export interface DialogueContext { npc: string; player: string; avatarTier: number; victories: number; stealth: number; room: number; objective: string; }
export class LocalDialogueEngine {
  private readonly model: TinyInt4Transformer;
  constructor(seed = 0x4449414c) { this.model = new TinyInt4Transformer(seed); }
  speak(context: DialogueContext) { const safe = sanitize(context); const prompt = `${safe.npc} agent ${safe.player} ${safe.objective} room ${safe.room} shadow ${safe.stealth > .6 ? 'dark safe' : 'bright danger'} ${safe.victories > 3 ? 'trust' : 'watches'} ${safe.avatarTier > 2 ? 'future' : 'past'}`; return `${safe.npc.toUpperCase()}: ${this.model.generate(prompt, 10, hash(prompt))}`; }
  quest(context: DialogueContext) { const safe = sanitize(context); const route = this.model.generate(`quest ${safe.objective} portal vault route anchor escape`, 8, safe.room ^ safe.victories); return `ROUTE ${safe.room.toString().padStart(2, '0')}: ${route}`; }
  parameterBytes() { return this.model.parameterBytes(); }
}
function sanitize(context: DialogueContext): DialogueContext { const text = (value: string) => value.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 40) || 'unknown'; return { npc: text(context.npc), player: text(context.player), objective: text(context.objective), avatarTier: clamp(context.avatarTier, 0, 7), victories: clamp(context.victories, 0, 9999), stealth: clamp(context.stealth, 0, 1), room: clamp(context.room, 0, 9999) }; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); } function hash(value: string) { let result = 0x811c9dc5; for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619); return result | 0; }
