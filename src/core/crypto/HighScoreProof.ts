import type { ReplayLedger } from '../../engine/replay/ReplayEngine';

export interface ProofReplay { readonly seed: number; readonly ticks: number; readonly input: Uint8Array; }
export interface HighScoreProof { readonly version: 1; readonly game: string; readonly score: number; readonly replay: ProofReplay; readonly publicKey: Uint8Array; readonly signature: Uint8Array; }
export interface ProofIdentity { readonly keys: CryptoKeyPair; readonly publicKey: Uint8Array; }
export const MAX_PROOF_TICKS = 60 * 60 * 12;

export function compressReplay(ledger: ReplayLedger): ProofReplay {
  if (ledger.tickRate !== 60 || ledger.durationTicks > MAX_PROOF_TICKS) throw new Error('Invalid proof replay');
  const values: number[] = []; let index = 0; let change = 0; let mask = 0;
  while (index < ledger.durationTicks) { if (ledger.inputs[change]?.tick === index) mask = ledger.inputs[change++].mask; const next = ledger.inputs[change]?.tick ?? ledger.durationTicks; const run = Math.min(255, next - index); if (!run) throw new Error('Invalid proof replay'); values.push(run, mask); index += run; }
  return { seed: ledger.seed >>> 0, ticks: ledger.durationTicks, input: Uint8Array.from(values) };
}

export function expandReplay(replay: ProofReplay): Uint8Array {
  if (!Number.isInteger(replay.ticks) || replay.ticks < 0 || replay.ticks > MAX_PROOF_TICKS || replay.input.length % 2) throw new Error('Invalid proof replay');
  const output = new Uint8Array(replay.ticks); let tick = 0;
  for (let index = 0; index < replay.input.length; index += 2) { const run = replay.input[index]; const mask = replay.input[index + 1]; if (!run || mask > 31 || tick + run > output.length) throw new Error('Invalid proof replay'); output.fill(mask, tick, tick + run); tick += run; }
  if (tick !== output.length) throw new Error('Invalid proof replay'); return output;
}

export async function createProofIdentity(): Promise<ProofIdentity> { const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair; return { keys, publicKey: new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey)) }; }
export async function signProof(game: string, score: number, replay: ProofReplay, identity: ProofIdentity): Promise<HighScoreProof> { const proof = unsignedProof(game, score, replay, identity.publicKey); return { ...proof, signature: new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.keys.privateKey, source(proofBytes(proof)))) }; }
export async function verifyProof(proof: HighScoreProof): Promise<boolean> { try { validateProof(proof); const key = await crypto.subtle.importKey('raw', source(proof.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']); return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, source(proof.signature), source(proofBytes({ ...proof, signature: new Uint8Array() }))); } catch { return false; } }
export function unsignedProof(game: string, score: number, replay: ProofReplay, publicKey: Uint8Array): HighScoreProof { const proof = { version: 1 as const, game, score: Math.floor(score), replay, publicKey, signature: new Uint8Array() }; validateProof(proof); return proof; }
export function proofBytes(proof: HighScoreProof): Uint8Array { const game = new TextEncoder().encode(proof.game); const buffer = new ArrayBuffer(1 + game.length + 4 + 4 + 4 + 1 + proof.publicKey.length + 4 + proof.replay.input.length); const view = new DataView(buffer); let at = 0; view.setUint8(at++, game.length); new Uint8Array(buffer, at, game.length).set(game); at += game.length; view.setUint32(at, proof.score); at += 4; view.setUint32(at, proof.replay.ticks); at += 4; view.setUint32(at, proof.replay.seed); at += 4; view.setUint8(at++, proof.publicKey.length); new Uint8Array(buffer, at, proof.publicKey.length).set(proof.publicKey); at += proof.publicKey.length; view.setUint32(at, proof.replay.input.length); at += 4; new Uint8Array(buffer, at).set(proof.replay.input); return new Uint8Array(buffer); }
export function validateProof(proof: HighScoreProof): void { if (proof.version !== 1 || !/^[A-Za-z0-9_-]{1,32}$/.test(proof.game) || !Number.isInteger(proof.score) || proof.score < 0 || proof.score > 0x7fffffff || proof.publicKey.length !== 65 || proof.signature.length > 128) throw new Error('Invalid high-score proof'); expandReplay(proof.replay); }
function source(bytes: Uint8Array): ArrayBuffer { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer; }
