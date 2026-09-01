import { describe, expect, it } from 'vitest';
import { CabinetSkinStore, type SkinStorage } from '../CabinetSkinStore';
import { DecalCodecError, decodeDecal, encodeDecal } from '../DecalCodec';
import { VectorArtModel, createVectorDocument, cubicPoint, pathBounds, quadraticPoint } from '../VectorArtModel';

class MemoryStorage implements SkinStorage { readonly values = new Map<string, string>(); getItem(key: string) { return this.values.get(key) ?? null; } setItem(key: string, value: string) { this.values.set(key, value); } removeItem(key: string) { this.values.delete(key); } }

function document() { const model = new VectorArtModel(createVectorDocument()); const id = model.addPath(1, { x: 10, y: 20 }); model.addSegment(1, id, { type: 'QUADRATIC', control: { x: 40, y: 0 }, to: { x: 80, y: 40 } }); model.addSegment(1, id, { type: 'CUBIC', controlA: { x: 90, y: 30 }, controlB: { x: 110, y: 70 }, to: { x: 120, y: 50 } }); return model.snapshot(); }

describe('vector artwork', () => {
  it('interpolates curves and derives path bounds', () => { expect(quadraticPoint({ x: 0, y: 0 }, { x: 10, y: 20 }, { x: 20, y: 0 }, .5)).toEqual({ x: 10, y: 10 }); expect(cubicPoint({ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }, .5)).toEqual({ x: 5, y: 7.5 }); expect(pathBounds(document().layers[0].paths[0])).toMatchObject({ minX: 10, minY: 0, maxX: 120, maxY: 70 }); });
  it('round trips neonart data and rejects malformed buffers', () => { const source = document(); expect(decodeDecal(encodeDecal(source))).toEqual(source); expect(() => decodeDecal(new Uint8Array([1, 2, 3]))).toThrow(DecalCodecError); });
  it('persists validated cabinet bindings and clears corrupt storage', () => { const storage = new MemoryStorage(); const skins = new CabinetSkinStore(storage); expect(skins.set('MetaArcadeScene', document())).toBe(true); expect(skins.get('MetaArcadeScene')).toEqual(document()); storage.setItem('bios_cabinet_skins_v1', '{bad'); expect(skins.get('MetaArcadeScene')).toBeUndefined(); expect(storage.getItem('bios_cabinet_skins_v1')).toBeNull(); });
});
