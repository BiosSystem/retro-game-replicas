import { bench, describe } from 'vitest';
import { createConsensusIdentity, QuorumWorldLedger } from './QuorumWorldLedger';
const identities = await Promise.all(Array.from({ length: 4 }, () => createConsensusIdentity()));
describe('quorum ledger verification', () => { bench('commit 100 signed world records', async () => { const ledger = new QuorumWorldLedger(identities); for (let index = 0; index < 100; index++) { const proposal = await ledger.propose('VOXEL_EDIT', `voxel:${index}`, new Uint8Array([index]), identities[0]); const votes = await Promise.all(identities.slice(0, 3).map(identity => ledger.vote(proposal, identity))); await ledger.commit(proposal, votes); } }); });
