import { validateModManifest, type ModManifest } from '../ModSchema';

export interface SignedModPackage { version: 1; manifest: unknown; sha256: string; publicKey: string; signature: string; }
export interface VerifiedModPackage { manifest: ModManifest; sha256: string; signer: string; }
const PACKAGE_BYTES_MAX = 98304;

export async function hashManifest(manifest: unknown) { const digest = await crypto.subtle.digest('SHA-256', canonicalBytes(manifest)); return toHex(new Uint8Array(digest)); }

export async function verifySignedModPackage(value: unknown): Promise<VerifiedModPackage> {
  if (!record(value)) throw new Error('Signed package must be an object'); rejectUnknown(value, ['version', 'manifest', 'sha256', 'publicKey', 'signature']);
  if (value.version !== 1 || typeof value.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.sha256) || typeof value.publicKey !== 'string' || typeof value.signature !== 'string') throw new Error('Signed package metadata is invalid');
  const validation = validateModManifest(value.manifest); if (!validation.valid || !validation.manifest) throw new Error(validation.errors.join('; '));
  const bytes = canonicalBytes(validation.manifest); const actualHash = await hashManifest(validation.manifest); if (!constantTimeTextEqual(actualHash, value.sha256)) throw new Error('Mod content hash mismatch');
  const publicBytes = fromBase64(value.publicKey, 32); const signature = fromBase64(value.signature, 64); const publicKey = await crypto.subtle.importKey('raw', publicBytes, { name: 'Ed25519' }, false, ['verify']);
  if (!await crypto.subtle.verify({ name: 'Ed25519' }, publicKey, signature, bytes)) throw new Error('Mod signature verification failed');
  return { manifest: validation.manifest, sha256: actualHash, signer: toHex(publicBytes).slice(0, 16) };
}

export async function fetchSignedModPackage(rawUrl: string, fetcher: typeof fetch = fetch) {
  const url = new URL(rawUrl); if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Use an HTTPS repository URL without credentials or fragments');
  const controller = new AbortController(); const timer = globalThis.setTimeout(() => controller.abort(), 8000);
  try { const response = await fetcher(url, { credentials: 'omit', redirect: 'error', cache: 'no-store', signal: controller.signal }); if (!response.ok) throw new Error(`Repository request failed with ${response.status}`); const declared = Number(response.headers.get('content-length') ?? 0); if (declared > PACKAGE_BYTES_MAX) throw new Error('Signed package exceeds 96 KiB'); const text = await response.text(); if (new TextEncoder().encode(text).byteLength > PACKAGE_BYTES_MAX) throw new Error('Signed package exceeds 96 KiB'); let parsed: unknown; try { parsed = JSON.parse(text); } catch { throw new Error('Signed package JSON is invalid'); } return verifySignedModPackage(parsed); } finally { globalThis.clearTimeout(timer); }
}

export class VerifiedModCache {
  private readonly storage: Pick<Storage, 'getItem' | 'setItem'>;
  constructor(storage: Pick<Storage, 'getItem' | 'setItem'>) { this.storage = storage; }
  load(): VerifiedModPackage[] { try { const value: unknown = JSON.parse(this.storage.getItem('retro_verified_mods_v1') ?? '[]'); return Array.isArray(value) ? value.flatMap(item => verifiedRecord(item) ? [item] : []).slice(0, 32) : []; } catch { return []; } }
  save(value: VerifiedModPackage) { const existing = this.load().filter(item => item.sha256 !== value.sha256); existing.push(value); this.storage.setItem('retro_verified_mods_v1', JSON.stringify(existing.slice(-32))); }
}

export function canonicalize(value: unknown): string { if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value); if (typeof value === 'number') { if (!Number.isFinite(value)) throw new Error('Canonical data contains a non-finite number'); return JSON.stringify(value); } if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`; if (record(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`; throw new Error('Canonical data contains an unsupported value'); }
function canonicalBytes(value: unknown) { return new TextEncoder().encode(canonicalize(value)); }
function fromBase64(value: string, expected: number) { if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length > 256) throw new Error('Signature encoding is invalid'); let binary: string; try { binary = atob(value); } catch { throw new Error('Signature encoding is invalid'); } const bytes = Uint8Array.from(binary, character => character.charCodeAt(0)); if (bytes.length !== expected) throw new Error('Signature encoding is invalid'); return bytes; }
function toHex(bytes: Uint8Array) { return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join(''); }
function constantTimeTextEqual(a: string, b: string) { if (a.length !== b.length) return false; let difference = 0; for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index); return difference === 0; }
function rejectUnknown(value: Record<string, unknown>, allowed: string[]) { const unknown = Object.keys(value).filter(key => !allowed.includes(key)); if (unknown.length) throw new Error(`Signed package field is not allowed: ${unknown[0]}`); }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function verifiedRecord(value: unknown): value is VerifiedModPackage { return record(value) && record(value.manifest) && typeof value.sha256 === 'string' && /^[a-f0-9]{64}$/.test(value.sha256) && typeof value.signer === 'string' && value.signer.length === 16; }
