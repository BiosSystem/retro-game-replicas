const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoomId(randomBytes?: Uint8Array): string {
  const bytes = randomBytes ?? secureBytes(6); if (bytes.length < 6) throw new Error('Room identifiers require six random bytes');
  let code = 'NAC2-';
  for (let index = 0; index < 6; index++) code += ROOM_ALPHABET[bytes[index] % ROOM_ALPHABET.length];
  return code;
}

export function createRoomInvite(location: string, roomId: string, signalingCode: string): string {
  if (!/^NAC2-[A-Z2-9]{6}$/.test(roomId)) throw new Error('Invalid room identifier');
  if (!signalingCode.startsWith('ARC1.') || signalingCode.length > 65_536) throw new Error('Invalid signaling code');
  const url = new URL(location); url.hash = new URLSearchParams({ netplay: signalingCode, room: roomId }).toString(); return url.toString();
}

export function readRoomInvite(value: string): { roomId: string; signalingCode: string } | null {
  if (value.startsWith('ARC1.')) return { roomId: '', signalingCode: value };
  try {
    const url = new URL(value); const values = new URLSearchParams(url.hash.slice(1)); const roomId = values.get('room') ?? ''; const signalingCode = values.get('netplay') ?? '';
    return /^NAC2-[A-Z2-9]{6}$/.test(roomId) && signalingCode.startsWith('ARC1.') && signalingCode.length <= 65_536 ? { roomId, signalingCode } : null;
  } catch { return null; }
}

function secureBytes(length: number): Uint8Array {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure random room identifiers are unavailable');
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}
