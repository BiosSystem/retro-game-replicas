import { bench, describe } from 'vitest';
import { ScalarWasmPhysicsCore, SimdPhysicsCore } from './SimdPhysicsCore';

const count = 65_536;
const ax = Float32Array.from({ length: count }, (_, index) => Math.sin(index * 0.01) * 100);
const ay = Float32Array.from({ length: count }, (_, index) => Math.cos(index * 0.01) * 100);
const bx = Float32Array.from({ length: count }, (_, index) => index % 31);
const by = Float32Array.from({ length: count }, (_, index) => index % 17);
const radii = new Float32Array(count).fill(2);
const simd = await SimdPhysicsCore.create();
const scalar = await ScalarWasmPhysicsCore.create();

describe('scalar and Wasm SIMD physics throughput', () => {
  bench('calculate 65,536 scalar Wasm collision separations', () => { scalar.collisionSeparation(ax, ay, bx, by, radii); }, { time: 500 });
  bench('calculate 65,536 Wasm SIMD collision separations', () => { simd!.collisionSeparation(ax, ay, bx, by, radii); }, { time: 500 });
});
