import { describe, expect, it } from 'vitest';
import { LamportStateSigner, stateAttestationBytes, verifyLamportState } from './LamportStateSignature';

describe('Lamport state signatures', () => {
  it('verifies one SHA-256 hash-based state attestation', async () => { const signer = await LamportStateSigner.create(), identity = signer.identity(), message = stateAttestationBytes('a'.repeat(64), 7), proof = await signer.sign(message); expect(await verifyLamportState(message, identity, proof)).toBe(true); expect(identity.publicKey.byteLength).toBe(16_384); expect(proof.signature.byteLength).toBe(8_192); });
  it('rejects tampered state and signature bytes', async () => { const signer = await LamportStateSigner.create(), identity = signer.identity(), message = stateAttestationBytes('b'.repeat(64), 3), proof = await signer.sign(message), changed = stateAttestationBytes('c'.repeat(64), 3); expect(await verifyLamportState(changed, identity, proof)).toBe(false); proof.signature[0] ^= 1; expect(await verifyLamportState(message, identity, proof)).toBe(false); });
  it('refuses dangerous Lamport key reuse', async () => { const signer = await LamportStateSigner.create(); await signer.sign(stateAttestationBytes('d'.repeat(64), 1)); await expect(signer.sign(stateAttestationBytes('e'.repeat(64), 2))).rejects.toThrow('already signed'); });
});
