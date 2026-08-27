import type { SpatialHand, SpatialPose } from './SpatialInput';
import type { XrViewData } from './StereoViewPlanner';
export type ImmersiveMode = 'immersive-vr' | 'immersive-ar';
export interface XrFrameSnapshot { time: number; views: XrViewData[]; inputs: SpatialHand[]; }

interface RigidTransform { position: SpatialPose['position']; orientation: SpatialPose['orientation']; matrix: Float32Array; inverse: { matrix: Float32Array }; }
interface Pose { transform: RigidTransform; emulatedPosition: boolean; }
interface XrSpace {}
interface InputSource { handedness: 'left' | 'right' | 'none'; gripSpace?: XrSpace | null; targetRaySpace: XrSpace; gamepad?: { buttons: ArrayLike<{ value: number }> } | null; hand?: ReadonlyMap<string, XrSpace>; }
interface ViewerPose { views: Array<{ eye: 'left' | 'right' | 'none'; projectionMatrix: Float32Array; transform: RigidTransform }> }
interface Frame { session: Session; getViewerPose(space: XrSpace): ViewerPose | null; getPose(space: XrSpace, relativeTo: XrSpace): Pose | null; getJointPose?(space: XrSpace, relativeTo: XrSpace): (Pose & { radius: number }) | null; }
interface Session extends EventTarget { inputSources: readonly InputSource[]; supportedFrameRates?: Float32Array; updateTargetFrameRate?(rate: number): Promise<void>; requestReferenceSpace(type: string): Promise<XrSpace>; requestAnimationFrame(callback: (time: number, frame: Frame) => void): number; end(): Promise<void>; }
interface XrSystem { isSessionSupported(mode: ImmersiveMode): Promise<boolean>; requestSession(mode: ImmersiveMode, options: { requiredFeatures: string[]; optionalFeatures: string[] }): Promise<Session>; }

export class WebXrSessionController extends EventTarget {
  private session?: Session; private reference?: XrSpace;
  static async support() { const xr = (navigator as Navigator & { xr?: XrSystem }).xr; if (!xr) return { vr: false, ar: false }; const [vr, ar] = await Promise.all([xr.isSessionSupported('immersive-vr'), xr.isSessionSupported('immersive-ar')]); return { vr, ar }; }
  async start(mode: ImmersiveMode, refreshTarget: 90 | 120 = 90) { if (this.session) throw new Error('XR session already active'); const xr = (navigator as Navigator & { xr?: XrSystem }).xr; if (!xr) return false; const session = await xr.requestSession(mode, { requiredFeatures: ['local-floor'], optionalFeatures: ['hand-tracking', 'bounded-floor', 'layers'] }); this.session = session; this.reference = await session.requestReferenceSpace('local-floor'); const rates = [...(session.supportedFrameRates ?? [])]; if (session.updateTargetFrameRate && rates.length) { const selected = rates.reduce((best, rate) => Math.abs(rate - refreshTarget) < Math.abs(best - refreshTarget) ? rate : best, rates[0]); await session.updateTargetFrameRate(selected); } session.addEventListener('end', () => { this.session = undefined; this.reference = undefined; this.dispatchEvent(new Event('end')); }); session.requestAnimationFrame(this.onFrame); return true; }
  async stop() { await this.session?.end(); }
  active() { return Boolean(this.session); }
  private onFrame = (time: number, frame: Frame) => { if (!this.session || !this.reference) return; const pose = frame.getViewerPose(this.reference); const views = pose?.views.map(view => ({ eye: view.eye, projection: new Float32Array(view.projectionMatrix), view: new Float32Array(view.transform.inverse.matrix) })) ?? []; const inputs = this.session.inputSources.map(source => this.readInput(frame, source, this.reference!)); const snapshot: XrFrameSnapshot = { time, views, inputs }; this.dispatchEvent(new CustomEvent('frame', { detail: snapshot })); frame.session.requestAnimationFrame(this.onFrame); };
  private readInput(frame: Frame, source: InputSource, reference: XrSpace): SpatialHand { const gripPose = source.gripSpace ? frame.getPose(source.gripSpace, reference) : null, joints = new Map<string, SpatialPose>(); if (source.hand && frame.getJointPose) for (const [name, space] of source.hand) { const pose = frame.getJointPose(space, reference); if (pose) joints.set(name, convertPose(pose)); } return { handedness: source.handedness, grip: gripPose ? convertPose(gripPose) : undefined, joints, trigger: source.gamepad?.buttons[0]?.value ?? 0, squeeze: source.gamepad?.buttons[1]?.value ?? 0 }; }
}
function convertPose(pose: Pose): SpatialPose { return { position: { ...pose.transform.position }, orientation: { ...pose.transform.orientation }, emulated: pose.emulatedPosition }; }
