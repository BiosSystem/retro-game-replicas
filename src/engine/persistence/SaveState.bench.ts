import { bench, describe } from 'vitest';
import { serializeSaveState } from './SaveState';

const memory = new ArrayBuffer(4 * 1024 * 1024);
const immediate = (capture: () => void) => capture();

describe('Wasm state capture', () => {
  bench('copy and checksum a 4 MiB physics memory', async () => {
    await serializeSaveState({ slot: 'benchmark', wasmMemory: memory, players: [{ x: 0, y: 0 }], epochSeed: 1 }, immediate);
  }, { time: 500 });
});
