import { describe, expect, it } from 'vitest';
import { canonicalize, hashManifest, verifySignedModPackage } from './SignedModPackage';

const manifest = { apiVersion: 1, id: 'signed-stage', name: 'Signed Stage', version: '1.0.0', stage: { hazards: [], skin: { primary: '#00ffcc', secondary: '#ff0055' } }, hooks: [] };
const base64 = (bytes: ArrayBuffer) => { let binary = ''; for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte); return btoa(binary); };

describe('signed mod packages', () => {
  it('canonicalizes object keys deterministically', () => { expect(canonicalize({ z: 1, a: [2, { y: true, x: false }] })).toBe('{"a":[2,{"x":false,"y":true}],"z":1}'); });
  it('verifies Ed25519 signatures and SHA-256 content hashes', async () => { const keys = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']); const bytes = new TextEncoder().encode(canonicalize(manifest)); const signature = await crypto.subtle.sign({ name: 'Ed25519' }, keys.privateKey, bytes); const publicKey = await crypto.subtle.exportKey('raw', keys.publicKey); const pkg = { version: 1, manifest, sha256: await hashManifest(manifest), publicKey: base64(publicKey), signature: base64(signature) }; await expect(verifySignedModPackage(pkg)).resolves.toMatchObject({ manifest: { id: 'signed-stage' } }); pkg.manifest = { ...manifest, name: 'Tampered' }; await expect(verifySignedModPackage(pkg)).rejects.toThrow('hash mismatch'); });
  it('rejects unsigned and unknown package fields', async () => { await expect(verifySignedModPackage({ version: 1, manifest })).rejects.toThrow('metadata'); await expect(verifySignedModPackage({ version: 1, manifest, sha256: '0'.repeat(64), publicKey: '', signature: '', execute: 'bad' })).rejects.toThrow('not allowed'); });
});
