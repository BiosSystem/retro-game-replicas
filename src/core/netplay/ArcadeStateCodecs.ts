import { hashSnapshot, type DeterministicStateCodec, type StateSnapshot } from './DeterministicState';

export const VECTOR_PLAYER_CAPACITY = 2;
export const VECTOR_BULLET_CAPACITY = 96;
export const TETRIS_COLUMNS = 10;
export const TETRIS_ROWS = 20;
export const TETRIS_CELLS = TETRIS_COLUMNS * TETRIS_ROWS;

export interface NeonVectorRollbackState {
  frame: number;
  seed: number;
  score: number;
  stage: number;
  minerals: number;
  weapon: number;
  shield: number;
  players: Float32Array;
  bullets: Float32Array;
  bulletActive: Uint8Array;
  bulletOwner: Uint8Array;
}

export interface TetrisPulseRollbackState {
  frame: number;
  seed: number;
  score: number;
  dropTicks: number;
  timerTicks: number;
  activeX: number;
  activeY: number;
  activeColor: number;
  activeCells: Uint8Array;
  grid: Uint32Array;
}

const VECTOR_HEADER_BYTES = 22;
const VECTOR_PLAYER_FLOATS = 5;
const VECTOR_BYTES = VECTOR_HEADER_BYTES + VECTOR_PLAYER_CAPACITY * VECTOR_PLAYER_FLOATS * Float32Array.BYTES_PER_ELEMENT + VECTOR_BULLET_CAPACITY * 4 * Float32Array.BYTES_PER_ELEMENT + VECTOR_BULLET_CAPACITY * 2;
const TETRIS_HEADER_BYTES = 38;
const TETRIS_BYTES = TETRIS_HEADER_BYTES + TETRIS_CELLS * Uint32Array.BYTES_PER_ELEMENT;

export function createNeonVectorRollbackState(): NeonVectorRollbackState {
  return {
    frame: 0, seed: 0, score: 0, stage: 1, minerals: 0, weapon: 0, shield: 0,
    players: new Float32Array(VECTOR_PLAYER_CAPACITY * VECTOR_PLAYER_FLOATS),
    bullets: new Float32Array(VECTOR_BULLET_CAPACITY * 4),
    bulletActive: new Uint8Array(VECTOR_BULLET_CAPACITY),
    bulletOwner: new Uint8Array(VECTOR_BULLET_CAPACITY),
  };
}

export function createTetrisPulseRollbackState(): TetrisPulseRollbackState {
  return {
    frame: 0, seed: 0, score: 0, dropTicks: 0, timerTicks: 0, activeX: 3, activeY: 0, activeColor: 0,
    activeCells: new Uint8Array(16), grid: new Uint32Array(TETRIS_CELLS),
  };
}

export const neonVectorStateCodec: DeterministicStateCodec<NeonVectorRollbackState> = {
  id: 'neon-vector-v1', byteLength: VECTOR_BYTES,
  saveState(state, destination) {
    assertVectorState(state); const view = destination.view;
    view.setUint32(0, state.frame >>> 0, true); view.setUint32(4, state.seed >>> 0, true); view.setUint32(8, state.score >>> 0, true);
    view.setUint16(12, state.stage & 0xffff, true); view.setUint16(14, state.minerals & 0xffff, true); view.setUint8(16, state.weapon & 0xff); view.setUint8(17, state.shield ? 1 : 0);
    view.setUint16(18, VECTOR_PLAYER_CAPACITY, true); view.setUint16(20, VECTOR_BULLET_CAPACITY, true);
    let offset = VECTOR_HEADER_BYTES;
    for (let index = 0; index < state.players.length; index++, offset += 4) view.setFloat32(offset, state.players[index], true);
    for (let index = 0; index < state.bullets.length; index++, offset += 4) view.setFloat32(offset, state.bullets[index], true);
    destination.bytes.set(state.bulletActive, offset); offset += VECTOR_BULLET_CAPACITY;
    destination.bytes.set(state.bulletOwner, offset);
  },
  loadState(source, state) {
    assertSnapshot(source, VECTOR_BYTES); assertVectorState(state); const view = source.view;
    state.frame = view.getUint32(0, true); state.seed = view.getUint32(4, true); state.score = view.getUint32(8, true);
    state.stage = view.getUint16(12, true); state.minerals = view.getUint16(14, true); state.weapon = view.getUint8(16); state.shield = view.getUint8(17);
    if (view.getUint16(18, true) !== VECTOR_PLAYER_CAPACITY || view.getUint16(20, true) !== VECTOR_BULLET_CAPACITY) throw new Error('Neon Vector snapshot capacity mismatch');
    let offset = VECTOR_HEADER_BYTES;
    for (let index = 0; index < state.players.length; index++, offset += 4) state.players[index] = view.getFloat32(offset, true);
    for (let index = 0; index < state.bullets.length; index++, offset += 4) state.bullets[index] = view.getFloat32(offset, true);
    state.bulletActive.set(source.bytes.subarray(offset, offset + VECTOR_BULLET_CAPACITY)); offset += VECTOR_BULLET_CAPACITY;
    state.bulletOwner.set(source.bytes.subarray(offset, offset + VECTOR_BULLET_CAPACITY));
  },
  hashState: snapshot => hashSnapshot(snapshot.bytes),
};

export const tetrisPulseStateCodec: DeterministicStateCodec<TetrisPulseRollbackState> = {
  id: 'tetris-pulse-v1', byteLength: TETRIS_BYTES,
  saveState(state, destination) {
    assertTetrisState(state); const view = destination.view;
    view.setUint32(0, state.frame >>> 0, true); view.setUint32(4, state.seed >>> 0, true); view.setUint32(8, state.score >>> 0, true);
    view.setUint16(12, state.dropTicks & 0xffff, true); view.setUint16(14, state.timerTicks & 0xffff, true); view.setInt8(16, state.activeX); view.setInt8(17, state.activeY);
    view.setUint32(18, state.activeColor >>> 0, true); view.setUint8(22, TETRIS_COLUMNS); view.setUint8(23, TETRIS_ROWS); destination.bytes.set(state.activeCells, 24);
    let offset = TETRIS_HEADER_BYTES;
    for (let index = 0; index < state.grid.length; index++, offset += 4) view.setUint32(offset, state.grid[index], true);
  },
  loadState(source, state) {
    assertSnapshot(source, TETRIS_BYTES); assertTetrisState(state); const view = source.view;
    state.frame = view.getUint32(0, true); state.seed = view.getUint32(4, true); state.score = view.getUint32(8, true);
    state.dropTicks = view.getUint16(12, true); state.timerTicks = view.getUint16(14, true); state.activeX = view.getInt8(16); state.activeY = view.getInt8(17); state.activeColor = view.getUint32(18, true);
    if (view.getUint8(22) !== TETRIS_COLUMNS || view.getUint8(23) !== TETRIS_ROWS) throw new Error('Tetris Pulse snapshot dimensions mismatch');
    state.activeCells.set(source.bytes.subarray(24, TETRIS_HEADER_BYTES));
    let offset = TETRIS_HEADER_BYTES;
    for (let index = 0; index < state.grid.length; index++, offset += 4) state.grid[index] = view.getUint32(offset, true);
  },
  hashState: snapshot => hashSnapshot(snapshot.bytes),
};

function assertSnapshot(snapshot: StateSnapshot, byteLength: number): void { if (snapshot.bytes.byteLength !== byteLength) throw new Error('Snapshot byte length mismatch'); }
function assertVectorState(state: NeonVectorRollbackState): void { if (state.players.length !== VECTOR_PLAYER_CAPACITY * VECTOR_PLAYER_FLOATS || state.bullets.length !== VECTOR_BULLET_CAPACITY * 4 || state.bulletActive.length !== VECTOR_BULLET_CAPACITY || state.bulletOwner.length !== VECTOR_BULLET_CAPACITY) throw new Error('Neon Vector rollback state capacity mismatch'); }
function assertTetrisState(state: TetrisPulseRollbackState): void { if (state.activeCells.length !== 16 || state.grid.length !== TETRIS_CELLS) throw new Error('Tetris Pulse rollback state capacity mismatch'); }
