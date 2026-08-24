export type ModEventName = 'SPAWN' | 'COLLISION' | 'SCORE_UPDATE' | 'STAGE_CLEAR';
export type ModAction =
  | { type: 'SCALE_SCORE'; factor: number }
  | { type: 'SPAWN_HAZARD'; kind: 'SPIKE' | 'DRONE' | 'WALL'; lane: number }
  | { type: 'PLAY_EFFECT'; effect: 'LASER' | 'EXPLOSION' | 'COIN' | 'POWER_UP' | 'STAGE_CLEAR' };

export interface StageSkin { primary: string; secondary: string; }
export interface StagePatch { hazards: Array<{ lane: number; offset: number; speed: number; kind: 'SPIKE' | 'DRONE' | 'WALL' }>; skin?: StageSkin; }
export interface ModManifest {
  apiVersion: 1;
  id: string;
  name: string;
  version: string;
  stage: StagePatch;
  hooks: Array<{ event: ModEventName; actions: ModAction[] }>;
}

export interface ValidationResult { valid: boolean; errors: string[]; manifest?: ModManifest; }

const ID = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;
const EVENTS: ModEventName[] = ['SPAWN', 'COLLISION', 'SCORE_UPDATE', 'STAGE_CLEAR'];
const EFFECTS = ['LASER', 'EXPLOSION', 'COIN', 'POWER_UP', 'STAGE_CLEAR'];
const KINDS = ['SPIKE', 'DRONE', 'WALL'];

export function validateModManifest(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ['Manifest must be an object'] };
  rejectUnknown(value, ['apiVersion', 'id', 'name', 'version', 'stage', 'hooks'], 'manifest', errors);
  if (value.apiVersion !== 1) errors.push('apiVersion must equal 1');
  if (typeof value.id !== 'string' || !ID.test(value.id)) errors.push('id must contain 3 to 48 lowercase letters, digits, or hyphens');
  if (typeof value.name !== 'string' || value.name.length < 1 || value.name.length > 64 || /[<>\u0000-\u001f]/.test(value.name)) errors.push('name contains invalid characters or length');
  if (typeof value.version !== 'string' || !VERSION.test(value.version)) errors.push('version must use major.minor.patch');
  const stage = validateStage(value.stage, errors);
  const hooks = validateHooks(value.hooks, errors);
  if (errors.length || !stage || !hooks || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.version !== 'string') return { valid: false, errors };
  return { valid: true, errors, manifest: Object.freeze({ apiVersion: 1, id: value.id, name: value.name, version: value.version, stage, hooks }) };
}

function validateStage(value: unknown, errors: string[]): StagePatch | undefined {
  if (!isRecord(value) || !Array.isArray(value.hazards) || value.hazards.length > 64) { errors.push('stage.hazards must be an array with at most 64 entries'); return; }
  rejectUnknown(value, ['hazards', 'skin'], 'stage', errors);
  const hazards: StagePatch['hazards'] = [];
  for (const item of value.hazards) {
    if (!isRecord(item) || !Number.isInteger(item.lane) || Number(item.lane) < 0 || Number(item.lane) > 7 || !finiteRange(item.offset, 0, 1) || !finiteRange(item.speed, 0.1, 4) || !KINDS.includes(String(item.kind))) { errors.push('stage hazard is outside the allowed schema'); continue; }
    rejectUnknown(item, ['lane', 'offset', 'speed', 'kind'], 'stage hazard', errors);
    hazards.push({ lane: Number(item.lane), offset: Number(item.offset), speed: Number(item.speed), kind: item.kind as StagePatch['hazards'][number]['kind'] });
  }
  let skin: StageSkin | undefined;
  if (value.skin !== undefined) {
    if (!isRecord(value.skin) || typeof value.skin.primary !== 'string' || typeof value.skin.secondary !== 'string' || !COLOR.test(value.skin.primary) || !COLOR.test(value.skin.secondary)) errors.push('stage.skin must contain two hex colors');
    else { rejectUnknown(value.skin, ['primary', 'secondary'], 'stage skin', errors); skin = { primary: value.skin.primary.toLowerCase(), secondary: value.skin.secondary.toLowerCase() }; }
  }
  return { hazards, ...(skin ? { skin } : {}) };
}

function validateHooks(value: unknown, errors: string[]): ModManifest['hooks'] | undefined {
  if (!Array.isArray(value) || value.length > 16) { errors.push('hooks must be an array with at most 16 entries'); return; }
  const hooks: ModManifest['hooks'] = [];
  for (const hook of value) {
    if (!isRecord(hook) || !EVENTS.includes(String(hook.event) as ModEventName) || !Array.isArray(hook.actions) || hook.actions.length > 16) { errors.push('hook is outside the allowed schema'); continue; }
    rejectUnknown(hook, ['event', 'actions'], 'hook', errors);
    const actions: ModAction[] = [];
    for (const action of hook.actions) {
      if (!isRecord(action)) { errors.push('hook action must be an object'); continue; }
      if (action.type === 'SCALE_SCORE' && finiteRange(action.factor, 0.5, 3)) { rejectUnknown(action, ['type', 'factor'], 'scale score action', errors); actions.push({ type: action.type, factor: Number(action.factor) }); }
      else if (action.type === 'SPAWN_HAZARD' && KINDS.includes(String(action.kind)) && Number.isInteger(action.lane) && Number(action.lane) >= 0 && Number(action.lane) <= 7) { rejectUnknown(action, ['type', 'kind', 'lane'], 'spawn hazard action', errors); actions.push({ type: action.type, kind: action.kind as 'SPIKE' | 'DRONE' | 'WALL', lane: Number(action.lane) }); }
      else if (action.type === 'PLAY_EFFECT' && EFFECTS.includes(String(action.effect))) { rejectUnknown(action, ['type', 'effect'], 'play effect action', errors); actions.push({ type: action.type, effect: action.effect as 'LASER' | 'EXPLOSION' | 'COIN' | 'POWER_UP' | 'STAGE_CLEAR' }); }
      else errors.push('hook action is outside the allowed instruction set');
    }
    hooks.push({ event: hook.event as ModEventName, actions });
  }
  return hooks;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function finiteRange(value: unknown, minimum: number, maximum: number) { return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum; }
function rejectUnknown(value: Record<string, unknown>, allowed: string[], scope: string, errors: string[]) { for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${scope}.${key} is not allowed`); }
