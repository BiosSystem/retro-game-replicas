import { describe, expect, it } from 'vitest';
import { calculateIntegerViewport, parseDisplayAspect } from './DisplayScaler';

describe('integer display scaling', () => {
  it('centers a 4:3 source at an exact integer scale', () => {
    const viewport = calculateIntegerViewport(1920, 1080, 640, 480, '4:3');
    expect(viewport).toMatchObject({ scale: 2, integerScaled: true, contentWidth: 1280, contentHeight: 960, contentLeft: 320, contentTop: 60, frameWidth: 1280 });
  });

  it('adds symmetric pillar space inside a 16:9 frame without stretching pixels', () => {
    const viewport = calculateIntegerViewport(1920, 1080, 640, 480, '16:9');
    expect(viewport).toMatchObject({ scale: 2, integerScaled: true, contentWidth: 1280, contentHeight: 960, frameWidth: 1708, frameLeft: 106 });
    expect((viewport.frameWidth - viewport.contentWidth) / 2).toBe(214);
  });

  it('uses a bounded fit fallback when the container cannot hold one source pixel scale', () => {
    const viewport = calculateIntegerViewport(500, 300, 640, 480, '16:9');
    expect(viewport.integerScaled).toBe(false);
    expect(viewport.contentWidth).toBeLessThanOrEqual(500);
    expect(viewport.contentHeight).toBeLessThanOrEqual(300);
    expect(parseDisplayAspect('invalid')).toBe('4:3');
  });
});
