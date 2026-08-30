import type { NetworkTelemetrySnapshot } from '../../core/netplay/NetworkTelemetry';

export class NetplayTelemetryHud {
  private readonly root: HTMLElement;
  constructor() { this.root = document.createElement('aside'); this.root.className = 'netplay-telemetry'; this.root.dataset.arcadeOverlay = 'true'; this.root.hidden = true; document.body.appendChild(this.root); }
  setVisible(visible: boolean): void { this.root.hidden = !visible; }
  update(snapshot: NetworkTelemetrySnapshot): void { this.root.dataset.quality = snapshot.quality.toLowerCase(); this.root.textContent = `NET ${Math.round(snapshot.rttMs)} MS  JIT ${Math.round(snapshot.jitterMs)} MS  LOSS ${snapshot.packetLossPercent.toFixed(0)}%  RB ${snapshot.rollbackFrames}F  DELAY ${snapshot.inputDelayFrames}F`; }
}
