export type XrEye = 'left' | 'right' | 'none';
export interface XrViewData { eye: XrEye; projection: Float32Array; view: Float32Array; }
export interface StereoPass { eye: XrEye; projectionView: Float32Array; viewportScale: number; voxelDispatchScale: number; giDispatchScale: number; }
export type XrRefreshTarget = 90 | 120;

export class XrFrameBudget {
  private scale = 1;
  readonly targetHz: XrRefreshTarget;
  constructor(targetHz: XrRefreshTarget = 90) { this.targetHz = targetHz; }
  sample(frameMs: number) { const budget = 1000 / this.targetHz; if (frameMs > budget * 1.08) this.scale = Math.max(.5, this.scale - .05); else if (frameMs < budget * .78) this.scale = Math.min(1, this.scale + .025); return this.scale; }
  current() { return this.scale; }
}

export function planStereoViews(views: readonly XrViewData[], qualityScale = 1): StereoPass[] {
  if (views.length < 1 || views.length > 4) throw new Error('XR frame must contain one to four views');
  const scale = Math.max(.5, Math.min(1, qualityScale));
  return views.map(view => { if (view.projection.length !== 16 || view.view.length !== 16) throw new Error('XR matrices must be 4x4'); return { eye: view.eye, projectionView: multiply4(view.projection, view.view), viewportScale: scale, voxelDispatchScale: scale < .7 ? .5 : scale < .9 ? .75 : 1, giDispatchScale: scale * scale }; });
}

export function perspective(fovY: number, aspect: number, near: number, far: number) { const f = 1 / Math.tan(fovY / 2), range = 1 / (near - far); return Float32Array.of(f / aspect,0,0,0,0,f,0,0,0,0,(far + near) * range,-1,0,0,2 * far * near * range,0); }
export function eyeView(eyeOffset: number, x = 0, y = 1.65, z = 0) { return Float32Array.of(1,0,0,0,0,1,0,0,0,0,1,0,-x-eyeOffset,-y,-z,1); }
export function multiply4(a: Float32Array, b: Float32Array) { const output = new Float32Array(16); for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) { let sum = 0; for (let k = 0; k < 4; k++) sum += a[row * 4 + k] * b[k * 4 + column]; output[row * 4 + column] = sum; } return output; }
