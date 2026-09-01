import { decodeNeonProof, encodeNeonProof } from '../crypto/NeonProofCodec';
import type { HighScoreProof } from '../crypto/HighScoreProof';
import { markVerifiedProof } from './ProofCatalog';
const KEY = 'bios_verified_neonproof_v1'; const LIMIT = 32;
export class VerifiedScoreStore {
  all(): HighScoreProof[] { try { const values = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown; return Array.isArray(values) ? values.slice(0, LIMIT).flatMap(value => typeof value === 'string' ? read(value) : []) : []; } catch { localStorage.removeItem(KEY); return []; } }
  put(proof: HighScoreProof) { const encoded = base64(new Uint8Array(encodeNeonProof(proof))); const values = this.all().map(value => base64(new Uint8Array(encodeNeonProof(value)))); values.unshift(encoded); localStorage.setItem(KEY, JSON.stringify([...new Set(values)].slice(0, LIMIT))); markVerifiedProof(proof); }
}
function read(value: string) { try { return [decodeNeonProof(unbase64(value))]; } catch { return []; } }
function base64(bytes: Uint8Array) { let value = ''; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value); }
function unbase64(value: string) { const binary = atob(value); return Uint8Array.from(binary, character => character.charCodeAt(0)); }
