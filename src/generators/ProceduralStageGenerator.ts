import { arcadeModRuntime } from '../mods/ModRuntime';

export type StageModifier = 'NONE' | 'LOW_GRAVITY' | 'FAST_BULLETS' | 'INVERTED_CONTROLS';
export interface HazardSpawn { lane: number; offset: number; speed: number; kind: 'BLOCK' | 'FLYER' | 'MINE'; }
export interface StageDefinition { stage: number; seed: number; spawnIntervalMs: number; enemySpeed: number; hazards: HazardSpawn[]; boss: boolean; modifier: StageModifier; skin?: { primary: string; secondary: string }; }

class SeededRandom {
  private state: number;
  constructor(seed: number) { this.state = seed | 0 || 0x6d2b79f5; }
  next() { let x = this.state; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.state = x | 0; return (x >>> 0) / 4294967296; }
}

export class ProceduralStageGenerator {
  private readonly campaignSeed: number;
  constructor(campaignSeed: number) { this.campaignSeed = campaignSeed; }

  generate(stage: number): StageDefinition {
    const safeStage = Math.max(1, Math.floor(stage));
    const seed = (this.campaignSeed ^ Math.imul(safeStage, 0x9e3779b1)) | 0;
    const random = new SeededRandom(seed);
    const hazardCount = Math.min(80, 4 + Math.floor(Math.sqrt(safeStage) * 3));
    const kinds: HazardSpawn['kind'][] = ['BLOCK', 'FLYER', 'MINE'];
    const hazards: HazardSpawn[] = Array.from({ length: hazardCount }, (_, index) => ({
      lane: Math.floor(random.next() * 4),
      offset: Number(((index + random.next() * 0.7) / hazardCount).toFixed(4)),
      speed: Number((1 + Math.log2(safeStage + 1) * 0.18 + random.next() * 0.2).toFixed(4)),
      kind: kinds[Math.floor(random.next() * kinds.length)],
    }));
    const modifiers: StageModifier[] = ['LOW_GRAVITY', 'FAST_BULLETS', 'INVERTED_CONTROLS'];
    const modifier = safeStage >= 4 && random.next() < Math.min(0.7, safeStage * 0.035) ? modifiers[Math.floor(random.next() * modifiers.length)] : 'NONE';
    const patches = arcadeModRuntime.stagePatches();
    for (const patch of patches) for (const hazard of patch.hazards) if (hazards.length < 80) hazards.push({ lane: hazard.lane % 4, offset: hazard.offset, speed: hazard.speed, kind: hazard.kind === 'SPIKE' ? 'BLOCK' : hazard.kind === 'DRONE' ? 'FLYER' : 'MINE' });
    for (const dispatch of arcadeModRuntime.dispatch({ event: 'SPAWN', stage: safeStage })) if (dispatch.action.type === 'SPAWN_HAZARD' && hazards.length < 80) hazards.push({ lane: dispatch.action.lane % 4, offset: random.next(), speed: 1, kind: dispatch.action.kind === 'SPIKE' ? 'BLOCK' : dispatch.action.kind === 'DRONE' ? 'FLYER' : 'MINE' });
    const skin = patches.find(patch => patch.skin)?.skin;
    return {
      stage: safeStage, seed,
      spawnIntervalMs: Math.max(220, Math.round(1600 / (1 + Math.log2(safeStage + 1) * 0.22))),
      enemySpeed: Number((1 + Math.log2(safeStage + 1) * 0.14).toFixed(4)),
      hazards, boss: safeStage % 5 === 0, modifier, ...(skin ? { skin } : {}),
    };
  }
}
