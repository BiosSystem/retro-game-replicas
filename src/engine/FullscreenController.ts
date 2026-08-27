export interface FullscreenTarget {
  requestFullscreen?: () => Promise<void>;
}

export interface FullscreenDocument {
  fullscreenElement: FullscreenTarget | null;
  exitFullscreen?: () => Promise<void>;
}

export type FullscreenStatus = 'ACTIVE' | 'READY' | 'UNAVAILABLE';

export class FullscreenController {
  private readonly target: FullscreenTarget;
  private readonly documentPort: FullscreenDocument;

  constructor(target: FullscreenTarget, documentPort: FullscreenDocument) {
    this.target = target;
    this.documentPort = documentPort;
  }

  isSupported() {
    return typeof this.target.requestFullscreen === 'function' && typeof this.documentPort.exitFullscreen === 'function';
  }

  isActive() {
    return this.documentPort.fullscreenElement === this.target;
  }

  status(): FullscreenStatus {
    if (!this.isSupported()) return 'UNAVAILABLE';
    return this.isActive() ? 'ACTIVE' : 'READY';
  }

  async toggle() {
    if (!this.isSupported()) return false;
    try {
      if (this.isActive()) await this.documentPort.exitFullscreen!();
      else await this.target.requestFullscreen!();
      return true;
    } catch {
      return false;
    }
  }
}
