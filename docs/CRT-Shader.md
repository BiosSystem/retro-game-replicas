# CRT Shader Pipeline

The GLSL CRT post-processing pipeline is one of the defining visual features of the arcade. Toggle it at runtime with `Ctrl+Shift+C`.

## Overview

The pipeline runs as a Phaser 4 post-processing plugin applied to the game canvas after all game objects have been rendered. It stacks three effects in a single shader pass to keep performance overhead minimal.

## The Three Effects

### 1. Barrel Distortion

Simulates the curved glass of a CRT monitor. The vertex shader applies a radial outward warp to UV coordinates:

```glsl
vec2 curved(vec2 uv) {
  uv = (uv - 0.5) * 2.0;
  uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
  uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
  uv = (uv / 2.0) + 0.5;
  return uv;
}
```

### 2. Chromatic Aberration

Splits the red, green, and blue channels slightly along the horizontal axis to mimic electron gun misalignment in real CRT hardware:

```glsl
float r = texture2D(uSampler, vec2(uv.x + 0.001, uv.y)).r;
float g = texture2D(uSampler, uv).g;
float b = texture2D(uSampler, vec2(uv.x - 0.001, uv.y)).b;
gl_FragColor = vec4(r, g, b, 1.0);
```

### 3. Scanline Vignette

Applies horizontal scanlines at a 2px interval and a radial vignette darkening toward the screen edges:

```glsl
// Scanlines
float scanline = sin(uv.y * resolution.y * 3.14159) * 0.04;

// Vignette
float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
vignette = clamp(pow(16.0 * vignette, 0.3), 0.0, 1.0);

gl_FragColor.rgb *= (1.0 - scanline) * vignette;
```

## Toggling the Shader

The shader is registered globally in the Phaser `Game` config. The `Ctrl+Shift+C` keyboard binding simply calls:

```typescript
phaserGame.renderer.pipelines.get('CRTShader').setActive(!isActive)
```

## Performance Notes

The entire pipeline runs in a single WebGL fragment shader pass, keeping GPU overhead low. On mobile devices (Android APK), the barrel distortion is automatically reduced from full to half intensity to maintain a stable 60fps.
