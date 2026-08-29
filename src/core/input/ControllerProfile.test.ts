import { describe, expect, it } from 'vitest';
import { applyStickDeadzone, fingerprintController, profileActionState, triggerToDigital } from './ControllerProfile';

describe('controller fingerprints and calibration', () => {
  it('identifies known controller families from vendor, product, and product names', () => {
    expect(fingerprintController('Vendor: 054c Product: 0ce6 DualSense')).toMatchObject({ id: '054c:0ce6', family: 'PLAYSTATION' });
    expect(fingerprintController('045e Xbox Wireless Controller')).toMatchObject({ family: 'XBOX' });
    expect(fingerprintController('8BitDo Pro 2')).toMatchObject({ family: 'EIGHTBITDO' });
    expect(fingerprintController('DragonRise USB Arcade Encoder')).toMatchObject({ family: 'ARCADE' });
  });

  it('keeps radial direction and rescales only the scaled-radial output', () => {
    expect(applyStickDeadzone(0.1, 0.1, 0.2, 'RADIAL')).toEqual({ x: 0, y: 0 });
    expect(applyStickDeadzone(0.6, 0.8, 0.2, 'RADIAL')).toEqual({ x: 0.6, y: 0.8 });
    expect(applyStickDeadzone(0.6, 0.8, 0.2, 'SCALED_RADIAL')).toEqual({ x: 0.6, y: 0.8 });
    expect(triggerToDigital(0.49, 0.5)).toBe(false);
    expect(triggerToDigital(0.5, 0.5)).toBe(true);
  });

  it('uses profile bindings without losing the normalized stick fallback', () => {
    const profile = { deadzoneMode: 'SCALED_RADIAL' as const, deadzone: 0.16, triggerThreshold: 0.5, bindings: { UP: [12], DOWN: [13], LEFT: [14], RIGHT: [15], FIRE: [5], COIN: [8], START: [9] } };
    expect(profileActionState(profile, 1 << 5, [0, 0, 0, 0]).FIRE).toBe(true);
    expect(profileActionState(profile, 0, [0, -0.7, 0, 0]).UP).toBe(true);
  });
});
