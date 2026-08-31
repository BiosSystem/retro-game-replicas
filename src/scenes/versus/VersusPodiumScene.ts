import { avatarSvgDataUri } from '../../ui/profile/RetroProfile';

export interface VersusMatchResult {
  winnerName: string;
  loserName: string;
  winnerSeed: string;
  loserSeed: string;
  accuracy: number;
  maxCombo: number;
  linesSent: number;
  averageRttMs: number;
}

export class VersusPodiumScene {
  private readonly root: HTMLElement;
  private focused = 0;

  constructor() {
    this.root = document.createElement('section'); this.root.className = 'versus-podium'; this.root.dataset.arcadeOverlay = 'true'; this.root.hidden = true; document.body.appendChild(this.root);
    this.root.addEventListener('keydown', event => this.navigate(event));
  }

  present(result: VersusMatchResult) {
    this.root.innerHTML = `<div class="versus-podium-panel" tabindex="0"><small>MATCH COMPLETE</small><h2>PLAYER ONE VICTORY</h2><div class="podium-avatars"><article class="podium-winner"><img alt="${escapeHtml(result.winnerName)} avatar" src="${avatarSvgDataUri(result.winnerSeed)}"><strong>${escapeHtml(result.winnerName)}</strong><b>GOLD</b></article><article class="podium-loser"><img alt="${escapeHtml(result.loserName)} avatar" src="${avatarSvgDataUri(result.loserSeed)}"><strong>${escapeHtml(result.loserName)}</strong><b>SILVER</b></article></div><p>ACCURACY ${Math.round(result.accuracy)}%  COMBO ${result.maxCombo}  LINES ${result.linesSent}  RTT ${Math.round(result.averageRttMs)}MS</p><nav><button type="button">QUICK REMATCH</button><button type="button">SWITCH GAME</button><button type="button">EXPORT MATCH LOG</button><button type="button">RETURN TO LOBBY</button></nav></div>`;
    this.root.hidden = false; this.focused = 0; this.buttons()[0]?.focus();
    this.buttons().forEach((button, index) => button.addEventListener('click', () => this.act(index, result)));
  }

  hide() { this.root.hidden = true; }

  private navigate(event: KeyboardEvent) {
    if (this.root.hidden) return;
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') { const count = this.buttons().length; this.focused = (this.focused + (event.code === 'ArrowLeft' ? count - 1 : 1)) % count; this.buttons()[this.focused]?.focus(); event.preventDefault(); }
    if (event.code === 'Escape') this.hide();
  }

  private act(index: number, result: VersusMatchResult) {
    const action = ['REMATCH', 'SWITCH_GAME', 'EXPORT_LOG', 'RETURN_LOBBY'][index] ?? 'RETURN_LOBBY';
    if (action === 'EXPORT_LOG') navigator.clipboard?.writeText(JSON.stringify(result));
    window.dispatchEvent(new CustomEvent('arcade-versus-action', { detail: action }));
    if (action !== 'EXPORT_LOG') this.hide();
  }

  private buttons() { return Array.from(this.root.querySelectorAll<HTMLButtonElement>('button')); }
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character)); }
