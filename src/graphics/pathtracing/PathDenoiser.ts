import type { PathFrame } from './PathTracer';

export class PathDenoiser {
  private history?: Float32Array<ArrayBuffer>;
  resolve(frame: PathFrame, feedback = .82): Float32Array<ArrayBuffer> {
    const spatial = frame.color.slice(), blend = Math.max(0, Math.min(.94, feedback));
    for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) { const pixel = y * frame.width + x, baseDepth = frame.depth[pixel] as number; let weightSum = 1; const sum = [frame.color[pixel * 3] as number, frame.color[pixel * 3 + 1] as number, frame.color[pixel * 3 + 2] as number]; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { if (!ox && !oy) continue; const nx = x + ox, ny = y + oy; if (nx < 0 || ny < 0 || nx >= frame.width || ny >= frame.height) continue; const neighbor = ny * frame.width + nx, depthWeight = Math.max(0, 1 - Math.abs((frame.depth[neighbor] as number) - baseDepth) * .5), normalWeight = Math.max(0, dotNormal(frame.normal, pixel, neighbor)), weight = depthWeight * normalWeight * .125; weightSum += weight; for (let channel = 0; channel < 3; channel++) sum[channel] = (sum[channel] as number) + (frame.color[neighbor * 3 + channel] as number) * weight; } for (let channel = 0; channel < 3; channel++) spatial[pixel * 3 + channel] = (sum[channel] as number) / weightSum; }
    if (this.history?.length === spatial.length) for (let index = 0; index < spatial.length; index++) { const low = (spatial[index] as number) - .35, high = (spatial[index] as number) + .35, prior = Math.max(low, Math.min(high, this.history[index] as number)); spatial[index] = (spatial[index] as number) * (1 - blend) + prior * blend; }
    this.history = spatial.slice(); return spatial;
  }
  reset(): void { this.history = undefined; }
}
function dotNormal(values: Float32Array, a: number, b: number) { const ai = a * 3, bi = b * 3; return (values[ai] as number) * (values[bi] as number) + (values[ai + 1] as number) * (values[bi + 1] as number) + (values[ai + 2] as number) * (values[bi + 2] as number); }
