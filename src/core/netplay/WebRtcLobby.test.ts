import { describe, expect, it } from 'vitest';
import { createRoomId, createRoomInvite, readRoomInvite } from './WebRtcLobby';

describe('WebRTC rollback lobby links', () => {
  it('creates deterministic bounded room identifiers from supplied entropy', () => { expect(createRoomId(new Uint8Array([0, 1, 2, 3, 4, 5]))).toBe('NAC2-ABCDEF'); });
  it('round-trips a copyable fragment invite without sending signaling to the host', () => { const invite = createRoomInvite('https://arcade.example/fun-zone?theme=overdrive', 'NAC2-ABCDEF', 'ARC1.abc'); expect(invite).toContain('#netplay=ARC1.abc'); expect(readRoomInvite(invite)).toEqual({ roomId: 'NAC2-ABCDEF', signalingCode: 'ARC1.abc' }); });
});
