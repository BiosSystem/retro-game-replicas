export const SAVE_STATE_VERSION = 1;
export const MAX_WASM_SAVE_BYTES = 16 * 1024 * 1024;
export const MAX_SAVE_THUMBNAIL_CHARS = 128 * 1024;

export interface SavedPlayer {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

export interface SaveStateSource {
  slot: string;
  wasmMemory: WebAssembly.Memory | ArrayBuffer | SharedArrayBuffer | Uint8Array;
  wasmByteOffset?: number;
  wasmByteLength?: number;
  players: readonly SavedPlayer[];
  epochSeed: number;
  thumbnail?: string;
}

export interface SerializedSaveState {
  version: typeof SAVE_STATE_VERSION;
  slot: string;
  savedAt: number;
  epochSeed: number;
  players: SavedPlayer[];
  wasmMemory: ArrayBuffer;
  checksum: string;
  thumbnail?: string;
}

export interface SaveStateBackend {
  readonly kind: 'INDEXED_DB' | 'MEMORY';
  put(state: SerializedSaveState): Promise<void>;
  get(slot: string): Promise<SerializedSaveState | null>;
  delete(slot: string): Promise<void>;
}

export type CaptureScheduler = (capture: () => void) => void;

export class MemorySaveStateBackend implements SaveStateBackend {
  readonly kind = 'MEMORY' as const;
  private readonly states = new Map<string, SerializedSaveState>();

  async put(state: SerializedSaveState) { this.states.set(state.slot, cloneState(state)); }
  async get(slot: string) { const state = this.states.get(slot); return state ? cloneState(state) : null; }
  async delete(slot: string) { this.states.delete(slot); }
}

export class IndexedDbSaveStateBackend implements SaveStateBackend {
  readonly kind = 'INDEXED_DB' as const;
  private database?: Promise<IDBDatabase>;
  private readonly factory: IDBFactory;
  private readonly databaseName: string;

  constructor(factory: IDBFactory, databaseName = 'bios_arcade_save_states_v1') {
    this.factory = factory;
    this.databaseName = databaseName;
  }

  async put(state: SerializedSaveState) {
    const database = await this.open();
    await requestTransaction(database, 'readwrite', store => store.put(state));
  }

  async get(slot: string) {
    const database = await this.open();
    const value = await requestTransaction(database, 'readonly', store => store.get(slot));
    return value ? await validateState(value) : null;
  }

  async delete(slot: string) {
    const database = await this.open();
    await requestTransaction(database, 'readwrite', store => store.delete(slot));
  }

  private open() {
    if (!this.database) this.database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.factory.open(this.databaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('states')) database.createObjectStore('states', { keyPath: 'slot' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
      request.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
    });
    return this.database;
  }
}

export class SaveStateStore {
  private readonly memory = new MemorySaveStateBackend();
  private active: SaveStateBackend;
  private autosaveTimer?: ReturnType<typeof setTimeout>;
  private readonly scheduler: CaptureScheduler;

  constructor(primary?: SaveStateBackend, scheduler: CaptureScheduler = defaultCaptureScheduler) {
    this.active = primary ?? this.memory;
    this.scheduler = scheduler;
  }

  static create(factory = typeof indexedDB === 'undefined' ? undefined : indexedDB, scheduler?: CaptureScheduler) {
    return new SaveStateStore(factory ? new IndexedDbSaveStateBackend(factory) : undefined, scheduler);
  }

  get backend() { return this.active.kind; }

  async save(source: SaveStateSource) {
    const state = await serializeSaveState(source, this.scheduler);
    try {
      await this.active.put(state);
    } catch {
      this.active = this.memory;
      await this.active.put(state);
    }
    return cloneState(state);
  }

  async load(slot: string) {
    assertSlot(slot);
    try {
      return await this.active.get(slot);
    } catch {
      this.active = this.memory;
      return this.active.get(slot);
    }
  }

  async delete(slot: string) {
    assertSlot(slot);
    try {
      await this.active.delete(slot);
    } catch {
      this.active = this.memory;
      await this.active.delete(slot);
    }
  }

  scheduleAutosave(source: () => SaveStateSource, delayMs = 1_000) {
    this.cancelAutosave();
    this.autosaveTimer = setTimeout(() => { void this.save(source()); }, clampInteger(delayMs, 50, 60_000));
  }

  cancelAutosave() {
    if (this.autosaveTimer !== undefined) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = undefined;
  }
}

export function serializeSaveState(source: SaveStateSource, scheduler: CaptureScheduler = defaultCaptureScheduler) {
  assertSlot(source.slot);
  if (!Number.isSafeInteger(source.epochSeed) || source.epochSeed < 0 || source.epochSeed > 0xffffffff) throw new Error('Epoch seed is invalid');
  if (source.players.length < 1 || source.players.length > 4) throw new Error('Player count is invalid');
  const players = source.players.map(player => validatePlayer(player));
  return new Promise<ArrayBuffer>((resolve, reject) => scheduler(() => {
    try { resolve(copyMemory(source)); }
    catch (error) { reject(error); }
  })).then(async (wasmMemory): Promise<SerializedSaveState> => ({
        version: SAVE_STATE_VERSION,
        slot: source.slot,
        savedAt: Date.now(),
        epochSeed: source.epochSeed,
        players,
        checksum: await checksum(wasmMemory),
        wasmMemory,
        thumbnail: validateThumbnail(source.thumbnail),
      }));
}

function copyMemory(source: SaveStateSource) {
  const buffer = source.wasmMemory instanceof WebAssembly.Memory ? source.wasmMemory.buffer : source.wasmMemory instanceof Uint8Array ? source.wasmMemory.buffer : source.wasmMemory;
  const baseOffset = source.wasmMemory instanceof Uint8Array ? source.wasmMemory.byteOffset : 0;
  const available = source.wasmMemory instanceof Uint8Array ? source.wasmMemory.byteLength : buffer.byteLength;
  const offset = clampInteger(source.wasmByteOffset ?? 0, 0, available);
  const length = source.wasmByteLength ?? available - offset;
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_WASM_SAVE_BYTES || offset + length > available) throw new Error('Wasm save range is invalid');
  const output = new Uint8Array(length);
  output.set(new Uint8Array(buffer, baseOffset + offset, length));
  return output.buffer;
}

async function validateState(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Save state is invalid');
  const state = value as SerializedSaveState;
  if (state.version !== SAVE_STATE_VERSION) throw new Error('Save state version is unsupported');
  assertSlot(state.slot);
  if (!Number.isSafeInteger(state.savedAt) || state.savedAt < 0) throw new Error('Save timestamp is invalid');
  if (!Number.isSafeInteger(state.epochSeed) || state.epochSeed < 0 || state.epochSeed > 0xffffffff) throw new Error('Saved Epoch seed is invalid');
  if (!(state.wasmMemory instanceof ArrayBuffer) || state.wasmMemory.byteLength < 1 || state.wasmMemory.byteLength > MAX_WASM_SAVE_BYTES) throw new Error('Saved Wasm memory is invalid');
  if (state.checksum !== await checksum(state.wasmMemory)) throw new Error('Save state checksum failed');
  if (!Array.isArray(state.players) || state.players.length < 1 || state.players.length > 4) throw new Error('Saved players are invalid');
  return cloneState({ ...state, players: state.players.map(player => validatePlayer(player)), thumbnail: validateThumbnail(state.thumbnail) });
}

function cloneState(state: SerializedSaveState): SerializedSaveState {
  return { ...state, players: state.players.map(player => ({ ...player })), wasmMemory: state.wasmMemory.slice(0) };
}

function validatePlayer(player: SavedPlayer) {
  const output = { ...player };
  for (const key of ['x', 'y', 'vx', 'vy'] as const) {
    const value = output[key];
    if (value !== undefined && (!Number.isFinite(value) || Math.abs(value) > 1_000_000_000)) throw new Error('Player coordinates are invalid');
  }
  return output;
}

export function validateThumbnail(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > MAX_SAVE_THUMBNAIL_CHARS || !/^data:image\/(?:webp|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Save thumbnail is invalid');
  return value;
}

async function checksum(buffer: ArrayBuffer) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
    return [...digest].map(value => value.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0x811c9dc5;
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index++) hash = Math.imul(hash ^ bytes[index], 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function assertSlot(slot: string) {
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(slot)) throw new Error('Save slot is invalid');
}

function clampInteger(value: number, minimum: number, maximum: number) {
  if (!Number.isSafeInteger(value)) throw new Error('Integer value is invalid');
  return Math.max(minimum, Math.min(maximum, value));
}

function defaultCaptureScheduler(capture: () => void) {
  const host = globalThis as typeof globalThis & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number };
  if (host.requestIdleCallback) host.requestIdleCallback(capture, { timeout: 1_000 });
  else setTimeout(capture, 0);
}

function requestTransaction(database: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest) {
  return new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction('states', mode);
    const request = action(transaction.objectStore('states'));
    let result: unknown;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
}
