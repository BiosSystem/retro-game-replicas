import { describe, expect, it } from 'vitest';
import { compareRgba } from './VisualDiff';
describe('visual pixel diff', () => { it('counts pixels outside a bounded channel threshold', () => { const expected = new Uint8Array([0, 0, 0, 255, 10, 10, 10, 255]); const actual = new Uint8Array([1, 1, 1, 255, 40, 10, 10, 255]); expect(compareRgba(actual, expected, 4)).toEqual({ changedPixels: 1, totalPixels: 2, ratio: 0.5 }); }); it('rejects mismatched buffers', () => { expect(() => compareRgba(new Uint8Array(4), new Uint8Array(8))).toThrow('equal'); }); });
