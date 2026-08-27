import { describe, expect, it } from 'vitest';
import { mapSpatialHands } from './SpatialInput';
import { eyeView, perspective, planStereoViews, XrFrameBudget } from './StereoViewPlanner';
describe('WebXR spatial pipeline', () => {
  it('plans distinct stereo projection-view passes', () => { const projection = perspective(Math.PI / 2, 1, .05, 100), passes = planStereoViews([{ eye: 'left', projection, view: eyeView(-.032) }, { eye: 'right', projection, view: eyeView(.032) }], .8); expect(passes).toHaveLength(2); expect(passes[0].projectionView).not.toEqual(passes[1].projectionView); expect(passes.every(pass => pass.voxelDispatchScale === .75)).toBe(true); });
  it('adapts bounded resolution around headset-selected frame targets', () => { const budget = new XrFrameBudget(90); for (let i = 0; i < 20; i++) budget.sample(15); expect(budget.current()).toBe(.5); for (let i = 0; i < 30; i++) budget.sample(5); expect(budget.current()).toBeGreaterThan(.5); });
  it('maps tracked wrists and pinch joints into IK arms', () => { const pose = (x: number, y: number, z: number) => ({ position: { x, y, z }, orientation: { x: 0, y: 0, z: 0, w: 1 }, emulated: false }); const joints = new Map([['wrist', pose(-.4, 1.2, -.5)], ['thumb-tip', pose(-.3, 1.1, -.5)], ['index-finger-tip', pose(-.31, 1.1, -.5)]]); const arms = mapSpatialHands([{ handedness: 'left', joints, trigger: 0, squeeze: 0 }], { left: { x: -.2, y: 1.45 }, right: { x: .2, y: 1.45 } }); expect(arms[0].pinch).toBe(true); expect(Math.hypot(arms[0].wrist.x + .4, arms[0].wrist.y - 1.2)).toBeLessThan(.02); });
});
