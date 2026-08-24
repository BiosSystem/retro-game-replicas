export interface TelemetrySnapshot { fps: number; meanFrameMs: number; p95FrameMs: number; droppedFramePercent: number; samples: number; }

export class FrameTelemetry {
  private readonly frames: Float32Array;
  private count = 0;
  private cursor = 0;

  constructor(capacity = 240) { if (capacity < 2) throw new Error('Telemetry capacity must be at least two'); this.frames = new Float32Array(capacity); }
  record(deltaMs: number) { if (!Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > 1000) return; this.frames[this.cursor] = deltaMs; this.cursor = (this.cursor + 1) % this.frames.length; this.count = Math.min(this.frames.length, this.count + 1); }
  snapshot(): TelemetrySnapshot {
    if (!this.count) return { fps: 0, meanFrameMs: 0, p95FrameMs: 0, droppedFramePercent: 0, samples: 0 };
    const values = Array.from(this.frames.slice(0, this.count)).sort((a, b) => a - b);
    const meanFrameMs = values.reduce((sum, value) => sum + value, 0) / values.length;
    const p95FrameMs = values[Math.min(values.length - 1, Math.ceil(values.length * 0.95) - 1)];
    return { fps: 1000 / meanFrameMs, meanFrameMs, p95FrameMs, droppedFramePercent: values.filter(value => value > 1000 / 55).length / values.length * 100, samples: values.length };
  }
}

export class TelemetryHud {
  private sequence = '';
  private visible = false;
  private readonly root: HTMLElement;
  constructor(root: HTMLElement) {
    this.root = root;
    window.addEventListener('keydown', event => {
      if (!/^[a-z]$/i.test(event.key)) return;
      this.sequence = `${this.sequence}${event.key.toUpperCase()}`.slice(-4);
      if (this.sequence === 'BIOS') this.setVisible(!this.visible);
    });
  }
  update(snapshot: TelemetrySnapshot, quality: string, sceneCount: number) {
    this.root.textContent = `BIOS RUNTIME TELEMETRY\nFPS ${snapshot.fps.toFixed(1)}  FRAME ${snapshot.meanFrameMs.toFixed(2)} MS  P95 ${snapshot.p95FrameMs.toFixed(2)} MS\nDROPPED ${snapshot.droppedFramePercent.toFixed(1)}%  QUALITY ${quality}  SCENES ${sceneCount}\nSAMPLES ${snapshot.samples}  HEAP ${readHeapMegabytes()}`;
  }
  setVisible(visible: boolean) { this.visible = visible; this.root.hidden = !visible; }
}

function readHeapMegabytes() {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return memory ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'N/A';
}
