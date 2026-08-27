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
uniform sampler2D uPreviousFrame;
uniform vec2 uResolution;
uniform float uTime;
uniform float uPersistence;
uniform float uAberration;
uniform float uCurvature;
varying vec2 vUv;

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  float radius2 = dot(centered, centered);
  vec2 warped = centered * (1.0 + uCurvature * radius2);
  vec2 uv = warped * 0.5 + 0.5;
  vec2 shift = vec2(uAberration / uResolution.x, 0.0);
  vec3 current = vec3(texture2D(uFrame, uv + shift).r, texture2D(uFrame, uv).g, texture2D(uFrame, uv - shift).b);
  vec3 history = texture2D(uPreviousFrame, uv).rgb * uPersistence;
  float scanline = 0.88 + 0.12 * sin((uv.y * uResolution.y + uTime * 4.0) * 3.14159265);
  float vignette = smoothstep(1.25, 0.25, radius2);
  gl_FragColor = vec4(max(current, history) * scanline * vignette, 1.0);
}`;
