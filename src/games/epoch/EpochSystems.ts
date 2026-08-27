import { createSpatialRing, propagationDelaySamples, relativisticDopplerRatio } from '../../audio/spatial/RelativisticAudioWorklet';
import { SimdPhysicsCore, batchCollisionScalar, supportsWasmSimd } from '../../engine/physics/simd';
import { CellularFluid } from '../../graphics/kinematics/Kinematics';
import { compileGaussianSplatPipeline, generateProceduralSplatCloud, splatChecksum } from '../../graphics/volumetric/splatting';

export const EPOCH_ARCHITECTURES = ['ARCADE', 'MULTIPLAYER', 'PROCEDURAL', 'TRACKER_AUDIO', 'REPLAY', 'VOXELS', 'PORTALS', 'QUANTUM', 'GENETICS', 'SOCIETY', 'WEBXR', 'WEB_CODECS', 'NEON_OS', 'NEURAL_TERRAIN', 'PATH_TRACING', 'QUORUM_LEDGER', 'HASH_SIGNATURES', 'SPATIAL_SHARDS', 'GAUSSIAN_SPLATTING'] as const;

export interface EpochWeather {
  rain: number;
  wind: number;
  cloudCover: number;
  temperature: number;
}

export function epochWeather(seed: number, timeSeconds: number): EpochWeather {
  const phase = seed * 0.013 + Math.max(0, timeSeconds) * 0.07;
  return {
    rain: Math.max(0, Math.min(1, 0.42 + Math.sin(phase) * 0.34 + Math.sin(phase * 2.37) * 0.18)),
    wind: Math.sin(phase * 0.71) * 12 + Math.cos(phase * 1.91) * 3,
    cloudCover: Math.max(0.08, Math.min(1, 0.58 + Math.cos(phase * 0.37) * 0.32)),
    temperature: 13 + Math.sin(phase * 0.18) * 9,
  };
}

export function epochCore(seed = 173, splatCount = 24_000) {
  const cloud = generateProceduralSplatCloud(seed, splatCount);
  const fluid = new CellularFluid(48, 20);
  for (let x = 4; x < 44; x += 2) fluid.seed(x, x % 5, 170 + x);
  const initialMass = fluid.mass();
  for (let step = 0; step < 30; step++) fluid.step();
  let fluidChecksum = 0;
  for (let index = 0; index < fluid.cells.length; index++) fluidChecksum = Math.imul(fluidChecksum ^ fluid.cells[index], 16_777_619) >>> 0;
  return { cloud, splatChecksum: splatChecksum(cloud), fluid, fluidChecksum, initialMass, weather: epochWeather(seed, 240), architectures: EPOCH_ARCHITECTURES.length };
}

function physicsInputs(count: number) {
  const ax = new Float32Array(count);
  const ay = new Float32Array(count);
  const bx = new Float32Array(count);
  const by = new Float32Array(count);
  const radii = new Float32Array(count);
  for (let index = 0; index < count; index++) {
    ax[index] = Math.sin(index * 0.17) * 100;
    ay[index] = Math.cos(index * 0.11) * 80;
    bx[index] = Math.sin(index * 0.071) * 20;
    by[index] = Math.cos(index * 0.053) * 20;
    radii[index] = 1 + index % 5;
  }
  return { ax, ay, bx, by, radii };
}

export async function epochDiagnostics(seed = 173, count = 8_192) {
  const core = epochCore(seed);
  const inputs = physicsInputs(Math.max(4, Math.min(32_768, Math.floor(count))));
  const scalar = batchCollisionScalar(inputs.ax, inputs.ay, inputs.bx, inputs.by, inputs.radii);
  const simd = await SimdPhysicsCore.create();
  const separation = simd ? simd.collisionSeparation(inputs.ax, inputs.ay, inputs.bx, inputs.by, inputs.radii) : scalar;
  const gravity = simd ? simd.gravityVectors(inputs.ax, inputs.ay, 0, 0, 42) : { x: new Float32Array(inputs.ax.length), y: new Float32Array(inputs.ay.length) };
  const time = simd ? simd.timeDilation(inputs.bx, inputs.by, 340) : new Float32Array(inputs.ax.length).fill(1);
  let maximumError = 0;
  let physicsChecksum = 0;
  for (let index = 0; index < separation.length; index++) {
    maximumError = Math.max(maximumError, Math.abs(separation[index] - scalar[index]));
    physicsChecksum = Math.imul(physicsChecksum ^ Math.round(separation[index] * 32), 16_777_619) >>> 0;
  }
  const ring = createSpatialRing(16_384);
  const doppler = relativisticDopplerRatio(18, -12, time[0] || 1);
  return {
    architectures: core.architectures,
    splats: core.cloud.count,
    splatChecksum: core.splatChecksum,
    fluidChecksum: core.fluidChecksum,
    fluidConserved: core.fluid.mass() === core.initialMass,
    weather: core.weather,
    simdSupported: supportsWasmSimd(),
    physicsBackend: simd ? 'WASM_SIMD_128' : 'SCALAR_FALLBACK',
    physicsChecksum,
    maximumError,
    gravityMagnitude: Math.hypot(gravity.x[1] || 0, gravity.y[1] || 0),
    timeFactor: time[1] || 1,
    audioRing: ring.mode,
    audioCapacity: ring.capacity,
    delaySamples: propagationDelaySamples(34.3, 48_000),
    doppler,
    gaussianGpu: await compileGaussianSplatPipeline(),
  };
}
