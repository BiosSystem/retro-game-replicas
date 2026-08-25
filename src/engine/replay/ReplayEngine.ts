export interface ReplayInput { tick: number; mask: number; }
export interface ReplayLedger { version: 1; scene: string; seed: number; tickRate: 60; durationTicks: number; inputs: ReplayInput[]; }
export interface SignedReplay { ledger: ReplayLedger; sha256: string; }

export class ReplayRecorder {
  private readonly inputs: ReplayInput[] = []; private tick = 0; private lastMask = -1; private readonly scene: string; private readonly seed: number;
  constructor(scene: string, seed: number) { this.scene = scene; this.seed = seed; if (!/^[A-Za-z0-9_-]{1,64}$/.test(scene)) throw new Error('Invalid replay scene'); }
  record(mask: number) { const safe = Math.max(0, Math.min(31, mask | 0)); if (safe !== this.lastMask) { this.inputs.push({ tick: this.tick, mask: safe }); this.lastMask = safe; } this.tick++; }
  finish(): ReplayLedger { return { version: 1, scene: this.scene, seed: this.seed >>> 0, tickRate: 60, durationTicks: this.tick, inputs: this.inputs.map(input => ({ ...input })) }; }
}

export class ReplayPlayer {
  private tick = 0; private speed = 1; private paused = true; private readonly ledger: ReplayLedger;
  constructor(ledger: ReplayLedger) { this.ledger = ledger; validateReplay(ledger); }
  play() { this.paused = false; } pause() { this.paused = true; } setSpeed(speed: number) { this.speed = [0.5, 1, 2, 4].includes(speed) ? speed : 1; }
  seek(tick: number) { this.tick = Math.max(0, Math.min(this.ledger.durationTicks, Math.floor(tick))); return this.state(); }
  step() { if (!this.paused) this.seek(this.tick + this.speed); return this.state(); }
  state() { let mask = 0; for (const input of this.ledger.inputs) { if (input.tick > this.tick) break; mask = input.mask; } return { tick: this.tick, mask, progress: this.ledger.durationTicks ? this.tick / this.ledger.durationTicks : 0, paused: this.paused, speed: this.speed }; }
}

export async function signReplay(ledger: ReplayLedger): Promise<SignedReplay> { validateReplay(ledger); return { ledger, sha256: await sha256(canonical(ledger)) }; }
export async function verifyReplay(replay: SignedReplay) { try { validateReplay(replay.ledger); return /^[a-f0-9]{64}$/.test(replay.sha256) && await sha256(canonical(replay.ledger)) === replay.sha256; } catch { return false; } }
export function replayCompression(ledger: ReplayLedger) { const rawBytes = Math.max(1, ledger.durationTicks); const ledgerBytes = new TextEncoder().encode(canonical(ledger)).byteLength; return { rawBytes, ledgerBytes, ratio: rawBytes / ledgerBytes }; }
export function validateReplay(value: ReplayLedger) { if (value.version !== 1 || value.tickRate !== 60 || !/^[A-Za-z0-9_-]{1,64}$/.test(value.scene) || !Number.isInteger(value.durationTicks) || value.durationTicks < 0 || value.durationTicks > 60 * 60 * 12 || value.inputs.length > 200000) throw new Error('Invalid replay ledger'); let previous = -1; for (const input of value.inputs) { if (!Number.isInteger(input.tick) || input.tick < 0 || input.tick > value.durationTicks || input.tick <= previous || !Number.isInteger(input.mask) || input.mask < 0 || input.mask > 31) throw new Error('Invalid replay input'); previous = input.tick; } return value; }
function canonical(ledger: ReplayLedger) { return JSON.stringify({ durationTicks: ledger.durationTicks, inputs: ledger.inputs.map(input => ({ mask: input.mask, tick: input.tick })), scene: ledger.scene, seed: ledger.seed >>> 0, tickRate: 60, version: 1 }); }
async function sha256(value: string) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join(''); }
