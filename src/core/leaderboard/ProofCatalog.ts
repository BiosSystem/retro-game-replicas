const KEY = 'bios_verified_neonproof_meta_v1';
export interface VerifiedProofMeta { game: string; score: number; }
export function proofCatalog(): VerifiedProofMeta[] { try { const value = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown; return Array.isArray(value) ? value.filter(item => !!item && typeof item === 'object' && typeof (item as VerifiedProofMeta).game === 'string' && Number.isInteger((item as VerifiedProofMeta).score)).slice(0, 32) as VerifiedProofMeta[] : []; } catch { return []; } }
export function markVerifiedProof(value: VerifiedProofMeta) { localStorage.setItem(KEY, JSON.stringify([value, ...proofCatalog().filter(item => item.game !== value.game || item.score !== value.score)].slice(0, 32))); }
