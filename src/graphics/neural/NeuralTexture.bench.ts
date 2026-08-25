import { bench, describe } from 'vitest';
import { proceduralTexture, upscaleNeuralTexture } from './NeuralTexture';
const source = proceduralTexture(61, 128, 128), pool = new Uint8Array(512 * 512 * 4);
describe('neural texture frame', () => { bench('upscale 128 square texture to 512 square', () => { upscaleNeuralTexture(source, 4, 67, pool); }); });
