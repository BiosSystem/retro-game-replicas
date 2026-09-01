import { SaveManager } from '../../engine/SaveManager';
import type { ScoreClaim } from '../../net/swarm/ScoreGossip';
import { leaderboardGames, rankScores, type LeaderboardSource } from './LeaderboardModel';
import { avatarSvgDataUri, RetroProfileStore } from '../profile/RetroProfile';
import { proofCatalog } from '../../core/leaderboard/ProofCatalog';

export class SwarmLeaderboardUi {
  private readonly root: HTMLElement;
  private peerClaims: ScoreClaim[] = [];
  private source: LeaderboardSource = 'ALL';
  private game = '';

  constructor() {
    this.root = document.createElement('aside');
    this.root.className = 'leaderboard-center';
    this.root.hidden = true;
    this.root.dataset.arcadeOverlay = 'true';
    this.root.setAttribute('aria-label', 'Arcade leaderboard center');
    this.root.innerHTML = `
      <header>
        <div><small>LOCAL-FIRST SCORE LEDGER</small><h2>LEADERBOARD CENTER</h2></div>
        <button type="button" data-close aria-label="Close leaderboard">X</button>
      </header>
      <div class="leaderboard-toolbar">
        <div role="group" aria-label="Score source">
          <button type="button" data-source="ALL" class="active">ALL</button>
          <button type="button" data-source="LOCAL">LOCAL</button>
          <button type="button" data-source="PEER">CONNECTED</button>
        </div>
        <label>GAME <select data-game><option value="">ALL GAMES</option></select></label>
      </div>
      <div class="leaderboard-stats" aria-live="polite">
        <span><b data-local>0</b> LOCAL ENTRIES</span>
        <span><b data-peer>0</b> VERIFIED PEER CLAIMS</span>
        <span>CENTRAL API <b>NOT CONFIGURED</b></span>
      </div>
      <div class="leaderboard-table-wrap">
        <table>
          <thead><tr><th>IDENT</th><th>#</th><th>PLAYER</th><th>GAME</th><th>MODE</th><th>SCORE</th><th>SOURCE</th><th>PROOF</th></tr></thead>
          <tbody data-list></tbody>
        </table>
      </div>
      <p>Keep scores on this device. Accept connected scores only after Ed25519 signature verification. Press L to toggle.</p>`;
    document.body.appendChild(this.root);
    this.bind();
    this.render();
  }

  toggle(force?: boolean) {
    this.root.hidden = force === undefined ? !this.root.hidden : !force;
    if (!this.root.hidden) this.render();
  }

  private bind() {
    this.pick('[data-close]').addEventListener('click', () => this.toggle(false));
    this.root.querySelectorAll<HTMLButtonElement>('[data-source]').forEach(button => button.addEventListener('click', () => {
      this.source = button.dataset.source as LeaderboardSource;
      this.render();
    }));
    this.pick<HTMLSelectElement>('[data-game]').addEventListener('change', event => {
      this.game = (event.currentTarget as HTMLSelectElement).value;
      this.render();
    });
    document.getElementById('leaderboard-toggle')?.addEventListener('click', () => this.toggle());
    window.addEventListener('arcade-swarm-board', event => {
      const claims = (event as CustomEvent<ScoreClaim[]>).detail;
      this.peerClaims = Array.isArray(claims) ? claims : [];
      this.render();
    });
    window.addEventListener('arcade-score-submit', () => this.render());
    window.addEventListener('arcade-proof-ready', () => this.render());
    window.addEventListener('keydown', event => {
      if (event.code === 'KeyL' && !(event.target as HTMLElement | null)?.matches('input,textarea,select')) this.toggle();
      if (event.code === 'Escape' && !this.root.hidden) this.toggle(false);
    });
  }

  private render() {
    const localBoards = SaveManager.getLeaderboards();
    const games = leaderboardGames(localBoards, this.peerClaims);
    if (this.game && !games.includes(this.game)) this.game = '';
    const select = this.pick<HTMLSelectElement>('[data-game]');
    const selected = this.game;
    select.replaceChildren(new Option('ALL GAMES', ''), ...games.map(game => new Option(displayGame(game), game)));
    select.value = selected;
    this.root.querySelectorAll<HTMLButtonElement>('[data-source]').forEach(button => button.classList.toggle('active', button.dataset.source === this.source));
    const rows = rankScores(localBoards, this.peerClaims, { game: this.game || undefined, source: this.source, limit: 50 }); const proofs = proofCatalog();
    const profile = new RetroProfileStore(localStorage).load();
    const body = this.pick<HTMLTableSectionElement>('[data-list]');
    body.replaceChildren(...rows.map((entry, index) => {
      const row = document.createElement('tr');
      const avatarCell = document.createElement('td'); const avatar = document.createElement('img');
      avatar.src = avatarSvgDataUri(entry.player === profile.name ? profile.avatarSeed : entry.player); avatar.alt = `${entry.player} avatar`; avatar.className = 'leaderboard-avatar'; avatarCell.appendChild(avatar); row.appendChild(avatarCell);
      const values = [String(index + 1).padStart(2, '0'), entry.player, displayGame(entry.game), entry.difficulty, entry.score.toLocaleString(), entry.source === 'PEER' ? 'PEER VERIFIED' : 'DEVICE'];
      for (const value of values) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      }
      row.dataset.source = entry.source;
      const proof = proofs.find(value => value.game === entry.game && value.score === entry.score); const proofCell = document.createElement('td'); if (proof) { const button = document.createElement('button'); button.type = 'button'; button.textContent = '🔑 VERIFIED'; button.dataset.proof = 'verified'; button.addEventListener('click', () => void import('../../core/leaderboard/VerifiedScoreStore').then(({ VerifiedScoreStore }) => { const value = new VerifiedScoreStore().all().find(item => item.game === proof.game && item.score === proof.score); if (value) window.dispatchEvent(new CustomEvent('arcade-watch-proof', { detail: value })); })); proofCell.appendChild(button); } else proofCell.textContent = 'LOCAL'; row.appendChild(proofCell);
      return row;
    }));
    if (!rows.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 8;
      cell.textContent = 'NO SCORES IN THIS VIEW';
      row.appendChild(cell);
      body.appendChild(row);
    }
    this.pick('[data-local]').textContent = String(localBoards.reduce((total, board) => total + board.entries.length, 0));
    this.pick('[data-peer]').textContent = String(this.peerClaims.length);
  }

  private pick<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing leaderboard element: ${selector}`);
    return element;
  }
}

function displayGame(game: string) {
  return game.replace(/Scene$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
}

export function installSwarmLeaderboard() { return new SwarmLeaderboardUi(); }
