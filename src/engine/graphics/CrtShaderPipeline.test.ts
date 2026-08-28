import { describe, expect, it, vi } from 'vitest';
import { CRT_FRAGMENT_SHADER, CRT_PRESETS, CrtProgramCache, CrtShaderPipeline, compileCrtProgram, effectiveUniforms, nextCrtOverscan, nextCrtPreset, nextCrtQuality, nextCrtScanlinePhase, parseCrtOverscan, parseCrtPreset, parseCrtQuality, parseCrtScanlinePhase, sanitizeCrtCalibration } from './CrtShaderPipeline';

describe('WebGL CRT shader pipeline', () => {
  it('exposes four bounded runtime presets', () => {
    expect(Object.keys(CRT_PRESETS)).toHaveLength(4);
    expect(CRT_PRESETS.ARCADE_CRT_1980S.uniforms).toMatchObject({ scanlineIntensity: 0.28, curvature: 0.085, aberrationPixels: 1.15 });
    expect(CRT_PRESETS.TRINITRON_1990S.uniforms.shadowMaskIntensity).toBeGreaterThan(CRT_PRESETS.ARCADE_CRT_1980S.uniforms.shadowMaskIntensity);
    expect(nextCrtPreset('TRINITRON_1990S')).toBe('BYPASS');
    expect(parseCrtPreset('invalid', 'CLEAN_PIXEL')).toBe('CLEAN_PIXEL');
  });

  it('keeps every requested post-process stage uniform-driven', () => {
    for (const uniform of ['uScanlineIntensity', 'uBloomIntensity', 'uCurvature', 'uAberrationPixels', 'uShadowMaskIntensity', 'uVignetteIntensity', 'uGamma', 'uOverscan', 'uScanlinePhase']) expect(CRT_FRAGMENT_SHADER).toContain(uniform);
    expect(CRT_FRAGMENT_SHADER).toContain('gl_FragCoord.x');
    expect(CRT_FRAGMENT_SHADER).toContain('texture2D');
    expect(CRT_FRAGMENT_SHADER).toContain('floor(uv.y * uResolution.y)');
    expect(CRT_FRAGMENT_SHADER).not.toContain('uTime *');
  });

  it('bounds persistent quality, overscan, and stable scanline phase controls', () => {
    expect(parseCrtQuality('invalid')).toBe('AUTO');
    expect(nextCrtQuality('LOW')).toBe('AUTO');
    expect(parseCrtOverscan('9')).toBe(.08);
    expect(nextCrtOverscan(.08)).toBe(0);
    expect(parseCrtScanlinePhase('9')).toBe(.75);
    expect(nextCrtScanlinePhase(.75)).toBe(0);
    expect(sanitizeCrtCalibration({ overscan: -1, scanlinePhase: Number.NaN })).toEqual({ overscan: 0, scanlinePhase: 0 });
  });

  it('compiles identical shader sources once per WebGL context', () => {
    const shader = {} as WebGLShader; const program = {} as WebGLProgram;
    const gl = {
      VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
      createShader: vi.fn(() => shader), shaderSource: vi.fn(), compileShader: vi.fn(), getShaderParameter: vi.fn(() => true), deleteShader: vi.fn(),
      createProgram: vi.fn(() => program), attachShader: vi.fn(), linkProgram: vi.fn(), getProgramParameter: vi.fn(() => true), deleteProgram: vi.fn(),
    } as unknown as WebGLRenderingContext;
    const before = CrtProgramCache.compileCount;
    expect(CrtProgramCache.acquire(gl, 'vertex-cache', 'fragment-cache')).toBe(program);
    expect(CrtProgramCache.acquire(gl, 'vertex-cache', 'fragment-cache')).toBe(program);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
    expect(CrtProgramCache.compileCount).toBe(before + 1);
    CrtProgramCache.release(gl, 'vertex-cache', 'fragment-cache');
    CrtProgramCache.invalidate(gl);
    expect(gl.deleteProgram).toHaveBeenCalledWith(program);
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
