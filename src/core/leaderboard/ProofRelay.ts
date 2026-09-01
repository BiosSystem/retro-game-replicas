import { decodeNeonProof, encodeNeonProof } from '../crypto/NeonProofCodec';
import { expandReplay, type HighScoreProof, verifyProof } from '../crypto/HighScoreProof';
export interface ReplayVerifier { replay(game: string, seed: number, inputs: Uint8Array): number; }
export interface ProofTransport { sendControl(value: unknown): boolean; }
export interface VerifiedScore { proof: HighScoreProof; verifiedAt: number; }
export class ProofRelay {
  private readonly scores = new Map<string, VerifiedScore>();
  private readonly verifier: ReplayVerifier;
  constructor(verifier: ReplayVerifier) { this.verifier = verifier; }
  async accept(value: unknown): Promise<VerifiedScore | undefined> { if (!value || typeof value !== 'object' || (value as { type?: unknown }).type !== 'NEON_PROOF' || !((value as { payload?: unknown }).payload instanceof Uint8Array)) return undefined; const proof = decodeNeonProof((value as { payload: Uint8Array }).payload); if (!await verifyProof(proof) || this.verifier.replay(proof.game, proof.replay.seed, expandReplay(proof.replay)) !== proof.score) return undefined; const key = `${proof.game}:${proof.score}:${fingerprint(proof.publicKey)}`; const accepted = { proof, verifiedAt: Date.now() }; this.scores.set(key, accepted); return accepted; }
  broadcast(proof: HighScoreProof, peers: readonly ProofTransport[]) { const packet = { type: 'NEON_PROOF', payload: new Uint8Array(encodeNeonProof(proof)) }; for (const peer of peers) peer.sendControl(packet); }
  top(game?: string) { return [...this.scores.values()].filter(value => !game || value.proof.game === game).sort((a, b) => b.proof.score - a.proof.score); }
}
function fingerprint(bytes: Uint8Array) { return [...bytes.subarray(0, 8)].map(value => value.toString(16).padStart(2, '0')).join(''); }
