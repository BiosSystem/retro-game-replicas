import { bench, describe } from 'vitest';
import { LamportStateSigner, stateAttestationBytes, verifyLamportState } from './LamportStateSignature';
const signer = await LamportStateSigner.create(), identity = signer.identity(), message = stateAttestationBytes('f'.repeat(64), 100), proof = await signer.sign(message);
describe('hash-based state verification', () => { bench('verify one 256-bit Lamport state signature', async () => { await verifyLamportState(message, identity, proof); }); });
