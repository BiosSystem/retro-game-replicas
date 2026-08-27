import { solveFabrik, type Joint } from '../../graphics/kinematics/Kinematics';
export interface SpatialPose { position: { x: number; y: number; z: number }; orientation: { x: number; y: number; z: number; w: number }; emulated: boolean; }
export interface SpatialHand { handedness: 'left' | 'right' | 'none'; grip?: SpatialPose; joints: ReadonlyMap<string, SpatialPose>; trigger: number; squeeze: number; }
export interface IkHandPose { handedness: 'left' | 'right'; shoulder: Joint; elbow: Joint; wrist: Joint; pinch: boolean; }

export function mapSpatialHands(inputs: readonly SpatialHand[], shoulders: { left: Joint; right: Joint }): IkHandPose[] {
  return inputs.filter((input): input is SpatialHand & { handedness: 'left' | 'right' } => input.handedness !== 'none').flatMap(input => {
    const targetPose = input.joints.get('wrist') ?? input.grip; if (!targetPose || targetPose.emulated) return [];
    const shoulder = shoulders[input.handedness], target = { x: targetPose.position.x, y: targetPose.position.y };
    const chain = solveFabrik([shoulder, { x: (shoulder.x + target.x) / 2, y: shoulder.y - .25 }, target], [.34, .32], target, 8);
    const thumb = input.joints.get('thumb-tip'), index = input.joints.get('index-finger-tip'); const pinch = Boolean(thumb && index && distance(thumb.position, index.position) < .035);
    return [{ handedness: input.handedness, shoulder: chain[0], elbow: chain[1], wrist: chain[2], pinch: pinch || input.trigger > .75 || input.squeeze > .75 }];
  });
}
function distance(a: SpatialPose['position'], b: SpatialPose['position']) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }
