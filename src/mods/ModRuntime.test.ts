import { describe, expect, it } from 'vitest';
import { arcadeModRuntime, ModRuntime } from './ModRuntime';
import { validateModManifest } from './ModSchema';
import { ProceduralStageGenerator } from '../generators/ProceduralStageGenerator';

const valid = { apiVersion: 1, id: 'neon-trials', name: 'Neon Trials', version: '1.0.0', stage: { hazards: [{ lane: 2, offset: 0.5, speed: 1.4, kind: 'DRONE' }], skin: { primary: '#00ffcc', secondary: '#ff2255' } }, hooks: [{ event: 'SCORE_UPDATE', actions: [{ type: 'SCALE_SCORE', factor: 1.5 }] }] };

describe('mod runtime', () => {
  it('registers, dispatches, lists, and unregisters a valid declarative mod', () => {
    const runtime = new ModRuntime();
    expect(runtime.register(JSON.stringify(valid))).toBe('neon-trials');
    expect(runtime.dispatch({ event: 'SCORE_UPDATE', stage: 4, score: 100 })[0].action).toEqual({ type: 'SCALE_SCORE', factor: 1.5 });
    expect(runtime.list()).toEqual([{ id: 'neon-trials', name: 'Neon Trials', version: '1.0.0' }]);
    expect(runtime.unregister('neon-trials')).toBe(true);
  });

  it('rejects executable fields and values outside bounded schemas', () => {
    expect(validateModManifest({ ...valid, id: '<script>', script: 'globalThis.fetch("https://invalid")', stage: { hazards: [{ lane: 99, offset: 0, speed: 1, kind: 'DRONE' }] } }).valid).toBe(false);
    expect(() => new ModRuntime().register('{bad')).toThrow('invalid');
  });

  it('rejects duplicate ids and caps oversized JSON before parsing', () => {
    const runtime = new ModRuntime(); runtime.register(valid);
    expect(() => runtime.register(valid)).toThrow('already registered');
    expect(() => runtime.register(' '.repeat(65537))).toThrow('64 KiB');
  });

  it('supplies validated custom stage hazards and skins', () => {
    arcadeModRuntime.register(valid);
    const stage = new ProceduralStageGenerator(1).generate(1);
    expect(stage.skin).toEqual({ primary: '#00ffcc', secondary: '#ff2255' });
    expect(stage.hazards.at(-1)).toMatchObject({ lane: 2, kind: 'FLYER', speed: 1.4 });
    arcadeModRuntime.unregister('neon-trials');
  });
});
