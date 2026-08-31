export class NetplayDisconnectModal {
  private readonly root: HTMLElement;
  private readonly seconds: HTMLElement;
  private readonly ring: HTMLElement;

  constructor() {
    this.root = document.createElement('section'); this.root.className = 'netplay-disconnect-modal'; this.root.dataset.arcadeOverlay = 'true'; this.root.hidden = true;
    this.root.innerHTML = '<div class="netplay-disconnect-panel"><small>DIRECT LINK INTERRUPTED</small><h2>RECONNECTING</h2><div class="netplay-countdown"><b data-seconds>15</b><i data-ring></i></div><p>GAMEPLAY PAUSED. FORFEIT RESOLVES WHEN THE LINK DOES NOT RETURN.</p></div>';
    document.body.appendChild(this.root);
    this.seconds = this.root.querySelector<HTMLElement>('[data-seconds]')!;
    this.ring = this.root.querySelector<HTMLElement>('[data-ring]')!;
  }

  show(seconds: number) { this.root.hidden = false; this.update(seconds); }
  update(seconds: number) { const safe = Math.max(0, Math.min(15, Math.ceil(seconds))); this.seconds.textContent = String(safe); this.ring.style.setProperty('--reconnect-progress', `${safe / 15}`); }
  hide() { this.root.hidden = true; }
  get visible() { return !this.root.hidden; }
}
