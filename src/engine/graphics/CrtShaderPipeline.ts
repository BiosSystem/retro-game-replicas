export type CrtPresetName = 'CLEAN_PIXEL' | 'ARCADE_CRT_1980S' | 'TRINITRON_1990S' | 'BYPASS';
export type CrtPipelineStatus = 'READY' | 'ACTIVE' | 'BYPASSED' | 'UNAVAILABLE' | 'COMPILE_FAILED' | 'RUNTIME_FAILED';
export type CrtQuality = 'HIGH' | 'MEDIUM' | 'LOW';
export type CrtQualityPreference = 'AUTO' | CrtQuality;

import { isVisualFrameFrozen } from '../../graphics/VisualFrameFreeze';

export interface CrtCalibration {
  overscan: number;
  scanlinePhase: number;
}

export interface CrtUniformSettings {
  scanlineIntensity: number;
  bloomIntensity: number;
  curvature: number;
  aberrationPixels: number;
  shadowMaskIntensity: number;
  vignetteIntensity: number;
  gamma: number;
  overscan: number;
  scanlinePhase: number;
}

export interface CrtPreset {
  name: CrtPresetName;
  label: string;
  uniforms: CrtUniformSettings;
}

export const CRT_PRESET_ORDER: readonly CrtPresetName[] = ['BYPASS', 'CLEAN_PIXEL', 'ARCADE_CRT_1980S', 'TRINITRON_1990S'];

export const CRT_PRESETS: Readonly<Record<CrtPresetName, CrtPreset>> = {
  BYPASS: { name: 'BYPASS', label: 'Bypass', uniforms: { scanlineIntensity: 0, bloomIntensity: 0, curvature: 0, aberrationPixels: 0, shadowMaskIntensity: 0, vignetteIntensity: 0, gamma: 1, overscan: 0, scanlinePhase: 0 } },
  CLEAN_PIXEL: { name: 'CLEAN_PIXEL', label: 'Clean Pixel', uniforms: { scanlineIntensity: 0.04, bloomIntensity: 0.04, curvature: 0, aberrationPixels: 0, shadowMaskIntensity: 0, vignetteIntensity: 0.08, gamma: 1, overscan: 0, scanlinePhase: 0 } },
  ARCADE_CRT_1980S: { name: 'ARCADE_CRT_1980S', label: 'Arcade CRT 1980s', uniforms: { scanlineIntensity: 0.28, bloomIntensity: 0.18, curvature: 0.085, aberrationPixels: 1.15, shadowMaskIntensity: 0.24, vignetteIntensity: 0.52, gamma: 2.2, overscan: 0.02, scanlinePhase: 0 } },
  TRINITRON_1990S: { name: 'TRINITRON_1990S', label: 'Trinitron 1990s', uniforms: { scanlineIntensity: 0.15, bloomIntensity: 0.12, curvature: 0.045, aberrationPixels: 0.7, shadowMaskIntensity: 0.38, vignetteIntensity: 0.34, gamma: 2.35, overscan: 0.01, scanlinePhase: 0.5 } },
};

export const CRT_VERTEX_SHADER = `
precision mediump float;
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const CRT_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uFrame;
uniform vec2 uResolution;
uniform float uScanlineIntensity;
uniform float uBloomIntensity;
uniform float uCurvature;
uniform float uAberrationPixels;
uniform float uShadowMaskIntensity;
uniform float uVignetteIntensity;
uniform float uGamma;
uniform float uOverscan;
uniform float uScanlinePhase;
varying vec2 vUv;

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  centered *= 1.0 - clamp(uOverscan, 0.0, 0.12);
  float radius2 = dot(centered, centered);
  vec2 warped = centered * (1.0 + uCurvature * radius2);
  vec2 uv = warped * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 pixel = 1.0 / max(uResolution, vec2(1.0));
  vec2 chroma = vec2(uAberrationPixels * pixel.x, 0.0);
  vec3 color = vec3(
    texture2D(uFrame, uv + chroma).r,
    texture2D(uFrame, uv).g,
    texture2D(uFrame, uv - chroma).b
  );

  float gamma = clamp(uGamma, 1.0, 2.6);
  color = pow(max(color, vec3(0.0)), vec3(gamma));
  if (uBloomIntensity > 0.001) {
    vec3 glow = pow(texture2D(uFrame, uv + pixel * vec2(1.5, 0.0)).rgb, vec3(gamma));
    glow += pow(texture2D(uFrame, uv - pixel * vec2(1.5, 0.0)).rgb, vec3(gamma));
    glow += pow(texture2D(uFrame, uv + pixel * vec2(0.0, 1.5)).rgb, vec3(gamma));
    glow += pow(texture2D(uFrame, uv - pixel * vec2(0.0, 1.5)).rgb, vec3(gamma));
    color += max(glow * 0.25 - vec3(0.12), vec3(0.0)) * uBloomIntensity;
  }

  float sourceRow = floor(uv.y * uResolution.y);
  float scanPhase = (sourceRow + uScanlinePhase) * 3.14159265;
  float scanline = 1.0 - uScanlineIntensity * (0.5 + 0.5 * cos(scanPhase));
  float lane = mod(floor(gl_FragCoord.x), 3.0);
  vec3 mask = vec3(1.0 - uShadowMaskIntensity * 0.28);
  if (lane < 1.0) mask.r = 1.0;
  else if (lane < 2.0) mask.g = 1.0;
  else mask.b = 1.0;
  float vignette = 1.0 - smoothstep(0.18, 1.42, radius2) * uVignetteIntensity;
  vec3 encoded = pow(max(color * scanline * mask * vignette, vec3(0.0)), vec3(1.0 / gamma));
  gl_FragColor = vec4(encoded, 1.0);
}`;

export interface CrtShaderPipelineOptions {
  createCanvas?: () => HTMLCanvasElement;
  context?: WebGLRenderingContext | null;
}

interface UniformLocations {
  frame: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  scanline: WebGLUniformLocation | null;
  bloom: WebGLUniformLocation | null;
  curvature: WebGLUniformLocation | null;
  aberration: WebGLUniformLocation | null;
  shadowMask: WebGLUniformLocation | null;
  vignette: WebGLUniformLocation | null;
  gamma: WebGLUniformLocation | null;
  overscan: WebGLUniformLocation | null;
  scanlinePhase: WebGLUniformLocation | null;
}

export class CrtShaderPipeline {
  readonly outputCanvas: HTMLCanvasElement;
  private readonly sourceCanvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext | null;
  private readonly sourceOpacity: string;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private uniforms: UniformLocations | null = null;
  private presetName: CrtPresetName = 'BYPASS';
  private status: CrtPipelineStatus;
  private submissionTotalMs = 0;
  private submissionSamples = 0;
  private meanSubmissionMs = 0;
  private calibration: CrtCalibration = { overscan: 0, scanlinePhase: 0 };
  private readonly effective: CrtUniformSettings = { ...CRT_PRESETS.BYPASS.uniforms };

  constructor(sourceCanvas: HTMLCanvasElement, parent: HTMLElement, options: CrtShaderPipelineOptions = {}) {
    this.sourceCanvas = sourceCanvas;
    this.sourceOpacity = sourceCanvas.style.opacity;
    this.outputCanvas = options.createCanvas?.() ?? document.createElement('canvas');
    this.outputCanvas.className = 'arcade-display-surface crt-shader-output';
    this.outputCanvas.dataset.arcadeSurface = 'crt';
    this.outputCanvas.setAttribute('aria-hidden', 'true');
    this.outputCanvas.hidden = true;
    parent.appendChild(this.outputCanvas);
    this.gl = Object.hasOwn(options, 'context') ? options.context ?? null : this.outputCanvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
    this.status = this.gl ? 'READY' : 'UNAVAILABLE';
    if (this.gl && !this.initialize(this.gl)) this.status = 'COMPILE_FAILED';
    this.outputCanvas.addEventListener?.('webglcontextlost', event => { event.preventDefault(); this.showSource('RUNTIME_FAILED'); });
    this.outputCanvas.addEventListener?.('webglcontextrestored', () => {
      if (!this.gl) return;
      CrtProgramCache.invalidate(this.gl); this.program = null; this.texture = null; this.vertexBuffer = null; this.uniforms = null;
      this.status = this.initialize(this.gl) ? 'READY' : 'COMPILE_FAILED';
    });
  }

  setPreset(name: CrtPresetName) { this.presetName = name; }
  setCalibration(calibration: CrtCalibration) { this.calibration = sanitizeCrtCalibration(calibration); }
  get preset() { return CRT_PRESETS[this.presetName]; }
  get pipelineStatus() { return this.status; }
  get meanCpuSubmissionMs() { return this.meanSubmissionMs; }

  render(_timeMs: number, quality: CrtQuality = 'HIGH', _reducedMotion = false) {
    if (this.presetName === 'BYPASS') { this.showSource('BYPASSED'); return false; }
    if (!this.gl || !this.program || !this.texture || !this.vertexBuffer || !this.uniforms) { this.showSource(this.status === 'READY' ? 'UNAVAILABLE' : this.status); return false; }
    // Preserve the current output frame during visual-only hit-stop. Simulation keeps advancing.
    if (this.status === 'ACTIVE' && isVisualFrameFrozen(_timeMs)) return true;
    const width = Math.max(1, this.sourceCanvas.width);
    const height = Math.max(1, this.sourceCanvas.height);
    if (this.outputCanvas.width !== width || this.outputCanvas.height !== height) { this.outputCanvas.width = width; this.outputCanvas.height = height; }
    const profile = applyEffectiveUniforms(this.effective, this.preset.uniforms, quality, this.calibration);
    try {
      const submittedAt = performance.now();
      const gl = this.gl;
      gl.viewport(0, 0, width, height);
      gl.useProgram(this.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.sourceCanvas);
      gl.uniform1i(this.uniforms.frame, 0);
      gl.uniform2f(this.uniforms.resolution, width, height);
      gl.uniform1f(this.uniforms.scanline, profile.scanlineIntensity);
      gl.uniform1f(this.uniforms.bloom, profile.bloomIntensity);
      gl.uniform1f(this.uniforms.curvature, profile.curvature);
      gl.uniform1f(this.uniforms.aberration, profile.aberrationPixels);
      gl.uniform1f(this.uniforms.shadowMask, profile.shadowMaskIntensity);
      gl.uniform1f(this.uniforms.vignette, profile.vignetteIntensity);
      gl.uniform1f(this.uniforms.gamma, profile.gamma);
      gl.uniform1f(this.uniforms.overscan, profile.overscan);
      gl.uniform1f(this.uniforms.scanlinePhase, profile.scanlinePhase);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.recordSubmission(performance.now() - submittedAt);
      this.outputCanvas.hidden = false;
      this.sourceCanvas.style.opacity = '0';
      this.status = 'ACTIVE';
      this.outputCanvas.dataset.crtQuality = quality.toLowerCase();
      this.outputCanvas.dataset.crtOverscan = profile.overscan.toFixed(3);
      this.outputCanvas.dataset.crtProgramCompiles = CrtProgramCache.compileCount.toString();
      return true;
    } catch {
      this.showSource('RUNTIME_FAILED');
      return false;
    }
  }

  destroy() {
    this.sourceCanvas.style.opacity = this.sourceOpacity;
    if (this.gl) {
      if (this.texture) this.gl.deleteTexture(this.texture);
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.program) CrtProgramCache.release(this.gl, CRT_VERTEX_SHADER, CRT_FRAGMENT_SHADER);
    }
    this.outputCanvas.remove();
  }

  private initialize(gl: WebGLRenderingContext) {
    const program = CrtProgramCache.acquire(gl, CRT_VERTEX_SHADER, CRT_FRAGMENT_SHADER);
    const texture = gl.createTexture();
    const vertexBuffer = gl.createBuffer();
    if (!program || !texture || !vertexBuffer) {
      if (program) CrtProgramCache.release(gl, CRT_VERTEX_SHADER, CRT_FRAGMENT_SHADER);
      if (texture) gl.deleteTexture(texture);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      return false;
    }
    this.program = program;
    this.texture = texture;
    this.vertexBuffer = vertexBuffer;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    if (position < 0) {
      gl.deleteTexture(texture); gl.deleteBuffer(vertexBuffer); CrtProgramCache.invalidate(gl);
      this.program = null; this.texture = null; this.vertexBuffer = null;
      return false;
    }
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.uniforms = {
      frame: gl.getUniformLocation(program, 'uFrame'), resolution: gl.getUniformLocation(program, 'uResolution'),
      scanline: gl.getUniformLocation(program, 'uScanlineIntensity'), bloom: gl.getUniformLocation(program, 'uBloomIntensity'), curvature: gl.getUniformLocation(program, 'uCurvature'),
      aberration: gl.getUniformLocation(program, 'uAberrationPixels'), shadowMask: gl.getUniformLocation(program, 'uShadowMaskIntensity'), vignette: gl.getUniformLocation(program, 'uVignetteIntensity'),
      gamma: gl.getUniformLocation(program, 'uGamma'), overscan: gl.getUniformLocation(program, 'uOverscan'), scanlinePhase: gl.getUniformLocation(program, 'uScanlinePhase'),
    };
    return true;
  }

  private showSource(status: CrtPipelineStatus) {
    this.outputCanvas.hidden = true;
    this.sourceCanvas.style.opacity = this.sourceOpacity;
    this.status = status;
  }

  private recordSubmission(durationMs: number) {
    this.submissionTotalMs += Math.max(0, durationMs);
    this.submissionSamples += 1;
    if (this.submissionSamples === 1 && !this.outputCanvas.dataset.crtSubmitMeanMs) {
      this.meanSubmissionMs = this.submissionTotalMs;
      this.outputCanvas.dataset.crtSubmitMeanMs = this.meanSubmissionMs.toFixed(4);
    }
    if (this.submissionSamples < 60) return;
    this.meanSubmissionMs = this.submissionTotalMs / this.submissionSamples;
    this.outputCanvas.dataset.crtSubmitMeanMs = this.meanSubmissionMs.toFixed(4);
    this.submissionTotalMs = 0;
    this.submissionSamples = 0;
  }
}

export function parseCrtPreset(value: string | null, fallback: CrtPresetName = 'BYPASS'): CrtPresetName {
  return value && Object.hasOwn(CRT_PRESETS, value) ? value as CrtPresetName : fallback;
}

export function nextCrtPreset(current: CrtPresetName) {
  return CRT_PRESET_ORDER[(CRT_PRESET_ORDER.indexOf(current) + 1) % CRT_PRESET_ORDER.length];
}

export function parseCrtQuality(value: string | null): CrtQualityPreference {
  return value === 'HIGH' || value === 'MEDIUM' || value === 'LOW' ? value : 'AUTO';
}

export function nextCrtQuality(current: CrtQualityPreference): CrtQualityPreference {
  const order: readonly CrtQualityPreference[] = ['AUTO', 'HIGH', 'MEDIUM', 'LOW'];
  return order[(order.indexOf(current) + 1) % order.length];
}

export function parseCrtOverscan(value: string | null) { return clampNumber(Number(value), 0, 0.08, 0); }
export function nextCrtOverscan(current: number) { return (Math.round(clampNumber(current, 0, 0.08, 0) * 100) + 2) % 10 / 100; }
export function parseCrtScanlinePhase(value: string | null) { return clampNumber(Number(value), 0, 0.75, 0); }
export function nextCrtScanlinePhase(current: number) { return (Math.round(clampNumber(current, 0, 0.75, 0) * 4) + 1) % 4 / 4; }

export function sanitizeCrtCalibration(value: CrtCalibration): CrtCalibration {
  return { overscan: clampNumber(value.overscan, 0, 0.08, 0), scanlinePhase: clampNumber(value.scanlinePhase, 0, 0.75, 0) };
}

export function effectiveUniforms(settings: CrtUniformSettings, quality: CrtQuality): CrtUniformSettings {
  return applyEffectiveUniforms({ ...settings }, settings, quality, { overscan: settings.overscan, scanlinePhase: settings.scanlinePhase });
}

function applyEffectiveUniforms(target: CrtUniformSettings, settings: CrtUniformSettings, quality: CrtQuality, calibration: CrtCalibration) {
  Object.assign(target, settings, calibration);
  if (quality === 'HIGH') return target;
  const factor = quality === 'MEDIUM' ? 0.7 : 0.35;
  target.bloomIntensity = settings.bloomIntensity * factor;
  target.aberrationPixels = settings.aberrationPixels * factor;
  target.shadowMaskIntensity = settings.shadowMaskIntensity * (quality === 'LOW' ? 0.5 : 1);
  return target;
}

interface CachedProgram { program: WebGLProgram; references: number; }
const PROGRAM_CACHE = new WeakMap<WebGLRenderingContext, Map<string, CachedProgram>>();

export class CrtProgramCache {
  static compileCount = 0;
  static acquire(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    let cache = PROGRAM_CACHE.get(gl);
    if (!cache) { cache = new Map(); PROGRAM_CACHE.set(gl, cache); }
    const key = `${vertexSource}\u0000${fragmentSource}`;
    const cached = cache.get(key);
    if (cached) { cached.references += 1; return cached.program; }
    const program = compileCrtProgram(gl, vertexSource, fragmentSource);
    if (!program) return null;
    cache.set(key, { program, references: 1 });
    this.compileCount += 1;
    return program;
  }
  static release(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    const cached = PROGRAM_CACHE.get(gl)?.get(`${vertexSource}\u0000${fragmentSource}`);
    if (cached) cached.references = Math.max(0, cached.references - 1);
  }
  static invalidate(gl: WebGLRenderingContext) {
    const cache = PROGRAM_CACHE.get(gl);
    if (cache) for (const cached of cache.values()) gl.deleteProgram(cached.program);
    PROGRAM_CACHE.delete(gl);
  }
}

function clampNumber(value: number, minimum: number, maximum: number, fallback: number) {
  return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : fallback;
}

export function compileCrtProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); return null; }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return null; }
  return program;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
  return shader;
}
