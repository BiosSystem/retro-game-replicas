import type { NetworkTelemetrySnapshot } from '../../core/netplay/NetworkTelemetry';

export class NetplayTelemetryHud {
  private readonly root: HTMLElement;
  constructor() { this.root = document.createElement('aside'); this.root.className = 'netplay-telemetry'; this.root.dataset.arcadeOverlay = 'true'; this.root.hidden = true; document.body.appendChild(this.root); }
  setVisible(visible: boolean): void { this.root.hidden = !visible; }
  update(snapshot: NetworkTelemetrySnapshot): void {
    this.root.dataset.quality = snapshot.quality.toLowerCase();
    this.root.setAttribute('aria-label', 'Netplay connection telemetry');
    this.root.innerHTML = `<b>NET ${Math.round(snapshot.rttMs)}MS</b><span>JIT ${Math.round(snapshot.jitterMs)}MS</span><span>LOSS ${snapshot.packetLossPercent.toFixed(0)}%</span><span>RB ${snapshot.rollbackFrames}F</span><span>DELAY ${snapshot.inputDelayFrames}F</span>`;
  }
}
