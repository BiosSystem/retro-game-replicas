import { describe, expect, it } from 'vitest';
import { crtProfile, PhosphorFrameBuffer } from './CrtState';
import { CRT_FRAGMENT_SHADER } from './crtShaders';

describe('CRT pipeline', () => {
  it('degrades expensive passes as quality falls', () => {
    expect(crtProfile('HIGH')).toMatchObject({ bloom: true, persistence: 0.14 });
    expect(crtProfile('MEDIUM')).toMatchObject({ bloom: false, persistence: 0.08 });
    expect(crtProfile('LOW')).toMatchObject({ bloom: false, persistence: 0, barrel: 0 });
    expect(crtProfile('HIGH', true).persistence).toBe(0);
  });

  it('ping-pongs bounded phosphor history without allocating new buffers', () => {
    const buffer = new PhosphorFrameBuffer(1);
    const first = buffer.blend([1, 0.5, 0, 1], 0.5);
    const second = buffer.blend([0, 0, 0, 1], 0.5);
    expect(Array.from(first)).toEqual([1, 0.5, 0, 1]);
    expect(Array.from(second)).toEqual([0.5, 0.25, 0, 1]);
  });

  it('keeps persistence, scanline, curvature, aberration, and vignette shader stages programmable', () => {
    for (const uniform of ['uPreviousFrame', 'uPersistence', 'uAberration', 'uCurvature', 'scanline', 'vignette']) expect(CRT_FRAGMENT_SHADER).toContain(uniform);
  });
});
