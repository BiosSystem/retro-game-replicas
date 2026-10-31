import type { LobbyPlayer } from '../../scenes/lobby/NetplayLobbyModel';
import { escapeHtml } from '../escapeHtml';

// Seat names and controller labels are escaped because they are meant to come from the remote peer.
export function lobbySeatsHtml(players: readonly LobbyPlayer[]): string { return players.map(player => { const hue = Math.abs(Math.trunc(Number(player.avatarSeed) || 0)) % 360; return `<article class="netplay-seat ${player.connected ? 'connected' : ''} ${player.ready ? 'ready' : ''}"><i style="--avatar-color:hsl(${hue} 85% 60%)"></i><strong>${player.seat === 'HOST' ? 'P1 HOST' : 'P2 CHALLENGER'}</strong><b>${escapeHtml(player.name)}</b><small>${escapeHtml(player.controller)} ${player.ready ? 'READY' : player.connected ? 'WAITING' : 'OFFLINE'}</small></article>`; }).join(''); }
