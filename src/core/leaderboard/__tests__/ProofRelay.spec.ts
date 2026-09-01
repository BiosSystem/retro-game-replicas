import { describe, expect, it } from 'vitest';
import { createProofIdentity, signProof } from '../../crypto/HighScoreProof';
import { encodeNeonProof } from '../../crypto/NeonProofCodec';
import { ProofRelay } from '../ProofRelay';
describe('proof relay', () => { it('pins a replay-verified proof', async () => { const identity = await createProofIdentity(); const proof = await signProof('TetrisScene', 3, { seed: 1, ticks: 3, input: new Uint8Array([3, 1]) }, identity); const relay = new ProofRelay({ replay: (_game, _seed, input) => input.reduce((total, value) => total + value, 0) }); expect(await relay.accept({ type: 'NEON_PROOF', payload: new Uint8Array(encodeNeonProof(proof)) })).toBeDefined(); expect(relay.top('TetrisScene')).toHaveLength(1); }); });
