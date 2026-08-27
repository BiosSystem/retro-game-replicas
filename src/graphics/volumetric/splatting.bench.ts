import { bench, describe } from 'vitest';
import { generateProceduralSplatCloud, projectSplatCloud } from './splatting';

const cloud = generateProceduralSplatCloud(173, 65_536);
const camera = { x: 0, y: 5, z: -70, yaw: 0, pitch: 0, focalLength: 320, near: 0.5 };

describe('Gaussian splat projection throughput', () => {
  bench('project and depth-order 4,096 of 65,536 splats', () => { projectSplatCloud(cloud, camera, 640, 480, 4_096); }, { time: 500 });
});
