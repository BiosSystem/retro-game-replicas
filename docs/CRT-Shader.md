# CRT Shader Pipeline

Use `CrtShaderPipeline` as a lightweight WebGL output surface around the Phaser game canvas. Keep Phaser responsible for game rendering and upload the completed source canvas once per presentation frame with nearest-neighbor sampling.

## Processing stages

Control the single fragment pass through uniforms for:

- horizontal scanline intensity
- threshold bloom contribution
- barrel curvature
- red and blue chromatic offsets
- vertical phosphor shadow mask
- edge vignette

Keep the source canvas visible when WebGL context creation, shader compilation, linking, texture upload, or draw submission fails. Hide the source only after the CRT surface renders successfully.

## Presets

Select presets from Cabinet Control:

- `Clean Pixel` keeps nearest-neighbor output with restrained framing effects.
- `Arcade CRT 1980s` applies the strongest scanline, curvature, color split, and vignette profile.
- `Trinitron 1990s` emphasizes the vertical phosphor mask with lower curvature.
- `Bypass` removes the post-process output and displays the Phaser source canvas directly.

Persist the choice under the CRT preset preference. Migrate the earlier boolean CRT preference only as a compatibility fallback. Do not rely on the removed `Ctrl+Shift+C` toggle.

## Display scaling

Calculate a logical 640x480 frame for 4:3 and an 854x480 frame for 16:9. Apply the largest positive integer scale that fits the cabinet. Center the 640x480 source within the selected frame and retain symmetric letterbox or pillar space. Use a bounded fractional fit only when the viewport cannot hold one native source scale.

Apply identical CSS bounds to the source and CRT canvases. Preserve `image-rendering: pixelated` and `image-rendering: crisp-edges` on the game surface.

## Performance policy

Reduce bloom, chromatic aberration, and mask intensity under adaptive quality pressure. Disable post-processing entirely on the lowest tier. Treat `data-crt-submit-mean-ms` as CPU submission and texture-upload time, not GPU completion, scanout, or end-to-end display latency.
