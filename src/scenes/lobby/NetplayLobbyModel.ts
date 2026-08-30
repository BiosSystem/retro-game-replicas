export type NetplaySeat = 'HOST' | 'CHALLENGER';
export type LobbyStatus = 'IDLE' | 'HOSTING' | 'JOINING' | 'NEGOTIATING' | 'CONNECTED' | 'RECOVERING' | 'FAILED';

export interface LobbyPlayer { seat: NetplaySeat; name: string; avatarSeed: number; controller: string; ready: boolean; connected: boolean; }
export interface NetplayLobbySnapshot { roomCode: string; status: LobbyStatus; host: LobbyPlayer; challenger: LobbyPlayer; }

export class NetplayLobbyModel {
  private roomCode = '';
  private status: LobbyStatus = 'IDLE';
  private host: LobbyPlayer = { seat: 'HOST', name: 'PLAYER ONE', avatarSeed: 0, controller: 'KEYBOARD', ready: false, connected: true };
  private challenger: LobbyPlayer = { seat: 'CHALLENGER', name: 'OPEN SLOT', avatarSeed: 0, controller: 'WAITING', ready: false, connected: false };

  hostRoom(roomCode: string, host: Partial<LobbyPlayer> = {}): void { this.roomCode = sanitizeRoomCode(roomCode); this.status = 'HOSTING'; this.host = { ...this.host, ...host, ready: false, connected: true }; this.challenger = { ...this.challenger, name: 'OPEN SLOT', controller: 'WAITING', ready: false, connected: false }; }
  joinRoom(roomCode: string): string { this.roomCode = sanitizeRoomCode(roomCode); this.status = 'JOINING'; return this.roomCode; }
  connectChallenger(player: Partial<LobbyPlayer> = {}): void { this.status = 'CONNECTED'; this.challenger = { ...this.challenger, ...player, name: player.name ?? 'PLAYER TWO', controller: player.controller ?? 'KEYBOARD', connected: true, ready: false }; }
  setStatus(status: LobbyStatus): void { this.status = status; if (status === 'FAILED' || status === 'RECOVERING') this.challenger = { ...this.challenger, ready: false, connected: false, controller: status === 'RECOVERING' ? 'RECONNECTING' : 'DISCONNECTED' }; }
  toggleReady(seat: NetplaySeat): boolean { const player = seat === 'HOST' ? this.host : this.challenger; if (!player.connected) return false; player.ready = !player.ready; return this.host.ready && this.challenger.ready; }
  snapshot(): NetplayLobbySnapshot { return { roomCode: this.roomCode, status: this.status, host: { ...this.host }, challenger: { ...this.challenger } }; }
}

export function sanitizeRoomCode(value: string): string { return value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6); }
