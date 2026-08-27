export interface DenoiseFrame { color: Float32Array; depth: Float32Array; motion: Float32Array; }

export class TemporalDenoiser {
  private history?: DenoiseFrame;
  resolve(current: DenoiseFrame, feedback = .88) {
    if (current.color.length % 3 || current.depth.length * 3 !== current.color.length || current.motion.length !== current.depth.length * 2) throw new Error('Invalid TAA frame dimensions');
    const output = current.color.slice(); const blend = Math.max(0, Math.min(.95, feedback)); const previous = this.history;
    if (previous && previous.color.length === current.color.length) {
      for (let pixel = 0; pixel < current.depth.length; pixel++) {
        const stable = Math.abs(previous.depth[pixel] - current.depth[pixel]) < .02 && Math.hypot(current.motion[pixel * 2], current.motion[pixel * 2 + 1]) < .1;
        if (!stable) continue;
        for (let channel = 0; channel < 3; channel++) { const index = pixel * 3 + channel; const history = Math.max(current.color[index] - .25, Math.min(current.color[index] + .25, previous.color[index])); output[index] = current.color[index] * (1 - blend) + history * blend; }
      }
    }
    this.history = { color: output.slice(), depth: current.depth.slice(), motion: current.motion.slice() };
    return output;
  }
  reset() { this.history = undefined; }
}
