import { describe, expect, it } from 'vitest';
import { NetplayLobbyModel, sanitizeRoomCode } from './NetplayLobbyModel';

describe('cabinet netplay lobby model', () => {
  it('sanitizes room input and requires both connected players to ready', () => { const lobby = new NetplayLobbyModel(); lobby.hostRoom('na-c2 1!2z'); expect(lobby.snapshot().roomCode).toBe('NAC22Z'); expect(lobby.toggleReady('HOST')).toBe(false); lobby.connectChallenger({ name: 'CHALLENGER', avatarSeed: 3, controller: 'GAMEPAD' }); expect(lobby.toggleReady('CHALLENGER')).toBe(true); });
  it('makes recovery explicit without discarding host identity', () => { const lobby = new NetplayLobbyModel(); lobby.hostRoom('ABC123', { name: 'HOST' }); lobby.connectChallenger(); lobby.setStatus('RECOVERING'); expect(lobby.snapshot()).toMatchObject({ status: 'RECOVERING', host: { name: 'HOST' }, challenger: { connected: false, controller: 'RECONNECTING' } }); expect(sanitizeRoomCode('a-1_b2c3')).toBe('AB2C3'); });
});
