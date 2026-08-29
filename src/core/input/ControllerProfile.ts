export type ControllerFamily = 'PLAYSTATION' | 'XBOX' | 'NINTENDO' | 'EIGHTBITDO' | 'ARCADE' | 'GENERIC';
export type DeadzoneMode = 'RADIAL' | 'SCALED_RADIAL';
export type ArcadeInputAction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE' | 'COIN' | 'START';

export interface ControllerFingerprint {
  id: string;
  family: ControllerFamily;
  vendorId: string | null;
  productId: string | null;
}

export interface ControllerProfile {
  deadzoneMode: DeadzoneMode;
  deadzone: number;
  triggerThreshold: number;
  bindings: Record<ArcadeInputAction, number[]>;
}

export const DEFAULT_CONTROLLER_PROFILE: Readonly<ControllerProfile> = Object.freeze({
  deadzoneMode: 'SCALED_RADIAL',
  deadzone: 0.16,
  triggerThreshold: 0.5,
  bindings: { UP: [12], DOWN: [13], LEFT: [14], RIGHT: [15], FIRE: [0, 1, 2, 3], COIN: [8], START: [9] },
});

export function fingerprintController(id: string): ControllerFingerprint {
  const normalized = id.toLowerCase();
  const ids = normalized.match(/(?:vendor|vid)[:\s-]*([0-9a-f]{4}).*?(?:product|pid)[:\s-]*([0-9a-f]{4})/i);
  const vendorId = ids?.[1] ?? null;
  const productId = ids?.[2] ?? null;
  const family: ControllerFamily = /054c|playstation|dualshock|dualsense|sony/.test(normalized) ? 'PLAYSTATION'
    : /045e|xbox|xinput|microsoft/.test(normalized) ? 'XBOX'
      : /057e|nintendo|switch pro/.test(normalized) ? 'NINTENDO'
        : /2dc8|8bitdo/.test(normalized) ? 'EIGHTBITDO'
          : /zero delay|xin-mo|dragonrise|arcade|usb encoder|0079|0810/.test(normalized) ? 'ARCADE'
            : 'GENERIC';
  return { id: stableId(id, vendorId, productId), family, vendorId, productId };
}

export function applyStickDeadzone(x: number, y: number, deadzone: number, mode: DeadzoneMode) {
  const boundedX = clamp(x, -1, 1);
  const boundedY = clamp(y, -1, 1);
  const magnitude = Math.min(1, Math.hypot(boundedX, boundedY));
  const threshold = clamp(deadzone, 0, 0.75);
  if (magnitude <= threshold) return { x: 0, y: 0 };
  if (mode === 'RADIAL') return { x: boundedX, y: boundedY };
  const scaled = (magnitude - threshold) / Math.max(0.0001, 1 - threshold);
  return { x: boundedX / magnitude * scaled, y: boundedY / magnitude * scaled };
}

export function triggerToDigital(value: number, threshold: number) {
  return clamp(value, 0, 1) >= clamp(threshold, 0.05, 1);
}

export function profileActionState(profile: ControllerProfile, buttonMask: number, axes: readonly number[]) {
  const pressed = (action: ArcadeInputAction) => profile.bindings[action].some(button => Boolean(buttonMask & (1 << button)));
  return {
    UP: pressed('UP') || (axes[1] ?? 0) < -0.5,
    DOWN: pressed('DOWN') || (axes[1] ?? 0) > 0.5,
    LEFT: pressed('LEFT') || (axes[0] ?? 0) < -0.5,
    RIGHT: pressed('RIGHT') || (axes[0] ?? 0) > 0.5,
    FIRE: pressed('FIRE'),
    COIN: pressed('COIN'),
    START: pressed('START'),
  };
}

export function sanitizeControllerProfile(value: Partial<ControllerProfile> | undefined): ControllerProfile {
  const candidate = value ?? {};
  const bindings = {} as Record<ArcadeInputAction, number[]>;
  for (const action of Object.keys(DEFAULT_CONTROLLER_PROFILE.bindings) as ArcadeInputAction[]) {
    const mapped = candidate.bindings?.[action];
    bindings[action] = mapped?.filter(button => Number.isInteger(button) && button >= 0 && button <= 16).filter((button, index, all) => all.indexOf(button) === index).slice(0, 4) ?? [...DEFAULT_CONTROLLER_PROFILE.bindings[action]];
  }
  return {
    deadzoneMode: candidate.deadzoneMode === 'RADIAL' ? 'RADIAL' : 'SCALED_RADIAL',
    deadzone: clamp(candidate.deadzone ?? DEFAULT_CONTROLLER_PROFILE.deadzone, 0, 0.75),
    triggerThreshold: clamp(candidate.triggerThreshold ?? DEFAULT_CONTROLLER_PROFILE.triggerThreshold, 0.05, 1),
    bindings,
  };
}

function stableId(id: string, vendorId: string | null, productId: string | null) {
  if (vendorId && productId) return `${vendorId}:${productId}`;
  return id.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 160) || 'unknown-controller';
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum));
}
