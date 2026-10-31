import { describe, expect, it } from 'vitest';
import type { LobbyPlayer } from '../../scenes/lobby/NetplayLobbyModel';
import { lobbySeatsHtml } from './lobbySeats';

const player = (overrides: Partial<LobbyPlayer>): LobbyPlayer => ({ seat: 'CHALLENGER', name: 'PLAYER TWO', avatarSeed: 7, controller: 'KEYBOARD', ready: false, connected: true, ...overrides });

describe('netplay lobby seats', () => {
  it('renders a peer name and controller as text, not markup', () => { const html = lobbySeatsHtml([player({ name: '<img src=x onerror=alert(1)>', controller: '"><script>x</script>' })]); expect(html).not.toContain('<img'); expect(html).not.toContain('<script'); expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;'); expect(html).toContain('&quot;&gt;&lt;script&gt;'); });
  it('keeps seat labels, state and avatar hue', () => { const html = lobbySeatsHtml([player({ seat: 'HOST', name: 'PLAYER ONE', avatarSeed: 370, ready: true }), player({ connected: false })]); expect(html).toContain('P1 HOST'); expect(html).toContain('P2 CHALLENGER'); expect(html).toContain('hsl(10 85% 60%)'); expect(html).toContain('KEYBOARD READY'); expect(html).toContain('KEYBOARD OFFLINE'); });
  it('falls back to hue 0 for a non-numeric avatar seed', () => { expect(lobbySeatsHtml([player({ avatarSeed: Number.NaN })])).toContain('hsl(0 85% 60%)'); });
});
