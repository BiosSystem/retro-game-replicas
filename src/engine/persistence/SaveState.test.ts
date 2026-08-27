import { describe, expect, it, vi } from 'vitest';
import { MAX_SAVE_THUMBNAIL_CHARS, MAX_WASM_SAVE_BYTES, MemorySaveStateBackend, SaveStateStore, serializeSaveState, type SaveStateBackend } from './SaveState';
import { SimdPhysicsCore } from '../physics/simd/SimdPhysicsCore';

const immediate = (capture: () => void) => capture();
const source = () => ({ slot: 'epoch_1', wasmMemory: Uint8Array.from([1, 2, 3, 4]), players: [{ x: 12, y: -8, vx: 2 }], epochSeed: 0xdecafbad });

describe('IndexedDB Wasm save-state pipeline', () => {
  it('captures independent memory, player coordinates, and the Epoch seed', async () => {
    const bytes = Uint8Array.from([1, 2, 3, 4]);
    const state = await serializeSaveState({ ...source(), wasmMemory: bytes }, immediate);
    bytes.fill(9);
    expect([...new Uint8Array(state.wasmMemory)]).toEqual([1, 2, 3, 4]);
    expect(state).toMatchObject({ version: 1, slot: 'epoch_1', epochSeed: 0xdecafbad, players: [{ x: 12, y: -8, vx: 2 }] });
  });

  it('round-trips bounded generated previews and rejects malformed images', async () => {
    const thumbnail = `data:image/webp;base64,${btoa('generated-preview')}`;
    expect((await serializeSaveState({ ...source(), thumbnail }, immediate)).thumbnail).toBe(thumbnail);
    await expect(serializeSaveState({ ...source(), thumbnail: 'https://example.com/image.png' }, immediate)).rejects.toThrow('thumbnail');
    await expect(serializeSaveState({ ...source(), thumbnail: `data:image/png;base64,${'A'.repeat(MAX_SAVE_THUMBNAIL_CHARS)}` }, immediate)).rejects.toThrow('thumbnail');
  });

  it('uses isolated memory storage when IndexedDB is unavailable', async () => {
    const store = SaveStateStore.create(undefined, immediate);
    await store.save(source());
    const first = await store.load('epoch_1');
    new Uint8Array(first!.wasmMemory)[0] = 99;
    expect(store.backend).toBe('MEMORY');
    expect([...new Uint8Array((await store.load('epoch_1'))!.wasmMemory)]).toEqual([1, 2, 3, 4]);
  });

  it('falls back after a primary storage failure and retains the current save', async () => {
    const failing: SaveStateBackend = { kind: 'INDEXED_DB', put: vi.fn(async () => { throw new Error('blocked'); }), get: vi.fn(async () => null), delete: vi.fn(async () => undefined) };
    const store = new SaveStateStore(failing, immediate);
    await store.save(source());
    expect(store.backend).toBe('MEMORY');
    expect(await store.load('epoch_1')).toMatchObject({ epochSeed: 0xdecafbad });
  });

  it('rejects unsafe ranges and malformed world values', async () => {
    await expect(serializeSaveState({ ...source(), wasmByteLength: MAX_WASM_SAVE_BYTES + 1 }, immediate)).rejects.toThrow('range');
    expect(() => serializeSaveState({ ...source(), slot: '../escape' }, immediate)).toThrow('slot');
    expect(() => serializeSaveState({ ...source(), players: [{ x: Number.NaN, y: 0 }] }, immediate)).toThrow('coordinates');
  });

  it('round-trips live SIMD Wasm memory through the save backend', async () => {
    const core = await SimdPhysicsCore.create();
    expect(core).not.toBeNull();
    core!.collisionSeparation(new Float32Array([8, 4, 2, 1]), new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array([1, 1, 1, 1]));
    const expected = core!.copyMemory();
    const backend = new MemorySaveStateBackend();
    const store = new SaveStateStore(backend, immediate);
    await store.save({ ...source(), wasmMemory: expected });
    core!.restoreMemory(new ArrayBuffer(expected.byteLength));
    core!.restoreMemory((await store.load('epoch_1'))!.wasmMemory);
    const restored = new Uint8Array(core!.copyMemory());
    expect(restored.byteLength).toBe(expected.byteLength);
    expect([...restored.slice(0, 256)]).toEqual([...new Uint8Array(expected, 0, 256)]);
    expect([...restored.slice(-256)]).toEqual([...new Uint8Array(expected, expected.byteLength - 256, 256)]);
  });
});
