import { describe, expect, it, vi } from 'vitest';
import { CRT_FRAGMENT_SHADER, CRT_PRESETS, CrtShaderPipeline, compileCrtProgram, effectiveUniforms, nextCrtPreset, parseCrtPreset } from './CrtShaderPipeline';

describe('WebGL CRT shader pipeline', () => {
  it('exposes four bounded runtime presets', () => {
    expect(Object.keys(CRT_PRESETS)).toHaveLength(4);
    expect(CRT_PRESETS.ARCADE_CRT_1980S.uniforms).toMatchObject({ scanlineIntensity: 0.28, curvature: 0.085, aberrationPixels: 1.15 });
    expect(CRT_PRESETS.TRINITRON_1990S.uniforms.shadowMaskIntensity).toBeGreaterThan(CRT_PRESETS.ARCADE_CRT_1980S.uniforms.shadowMaskIntensity);
    expect(nextCrtPreset('TRINITRON_1990S')).toBe('BYPASS');
    expect(parseCrtPreset('invalid', 'CLEAN_PIXEL')).toBe('CLEAN_PIXEL');
  });

  it('keeps every requested post-process stage uniform-driven', () => {
    for (const uniform of ['uScanlineIntensity', 'uBloomIntensity', 'uCurvature', 'uAberrationPixels', 'uShadowMaskIntensity', 'uVignetteIntensity']) expect(CRT_FRAGMENT_SHADER).toContain(uniform);
    expect(CRT_FRAGMENT_SHADER).toContain('gl_FragCoord.x');
    expect(CRT_FRAGMENT_SHADER).toContain('texture2D');
  });

  it('reduces expensive uniforms under adaptive quality pressure', () => {
    const high = effectiveUniforms(CRT_PRESETS.ARCADE_CRT_1980S.uniforms, 'HIGH');
    const low = effectiveUniforms(CRT_PRESETS.ARCADE_CRT_1980S.uniforms, 'LOW');
    expect(low.bloomIntensity).toBeLessThan(high.bloomIntensity);
    expect(low.aberrationPixels).toBeLessThan(high.aberrationPixels);
    expect(low.scanlineIntensity).toBe(high.scanlineIntensity);
  });

  it('returns a null program when shader compilation fails', () => {
    const shader = {} as WebGLShader;
    const gl = {
      VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3,
      createShader: vi.fn(() => shader), shaderSource: vi.fn(), compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => false), deleteShader: vi.fn(),
    } as unknown as WebGLRenderingContext;
    expect(compileCrtProgram(gl, 'vertex', 'fragment')).toBeNull();
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });

  it('keeps the source canvas visible when WebGL is unavailable', () => {
    const style = { opacity: '0.7' };
    const source = { width: 640, height: 480, style } as unknown as HTMLCanvasElement;
    const output = { className: '', dataset: {}, style: {}, hidden: false, setAttribute: vi.fn(), remove: vi.fn() } as unknown as HTMLCanvasElement;
    const parent = { appendChild: vi.fn() } as unknown as HTMLElement;
    const pipeline = new CrtShaderPipeline(source, parent, { createCanvas: () => output, context: null });
    pipeline.setPreset('ARCADE_CRT_1980S');
    expect(pipeline.render(16)).toBe(false);
    expect(pipeline.pipelineStatus).toBe('UNAVAILABLE');
    expect(output.hidden).toBe(true);
    expect(source.style.opacity).toBe('0.7');
  });
});
