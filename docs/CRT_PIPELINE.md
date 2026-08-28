# Advanced CRT Pipeline

## Runtime contract

Keep `CrtShaderPipeline` as a presentation-only pass over the Phaser source canvas. Do not feed CRT state into game logic, physics, input, audio scheduling, or replay checksums. Fall back to the original source canvas after WebGL compilation failure, context loss, or runtime submission failure.

## Stable scanline model

Anchor scanlines to integer source rows with a bounded phase calibration. Do not animate scanline position with wall-clock time. Preserve the same row phase at 60 Hz, 120 Hz, 144 Hz, and variable refresh rates.

Set `SCANLINE PHASE` to 0.00, 0.25, 0.50, or 0.75 through Cabinet Control. Persist the selection in `arcade_crt_scanline_phase`.

## Gamma-aware phosphor response

Decode sampled colors into a bounded linear-light approximation before bloom, scanline, mask, and vignette operations. Encode the final phosphor result for display after applying the selected preset. Keep Clean Pixel at gamma 1.0 and use calibrated CRT gamma values for the Arcade CRT and Trinitron presets.

## Overscan calibration

Apply overscan before radial curvature so edge cropping remains consistent across both 4:3 and 16:9 display frames. Cycle `CRT OVERSCAN` from 0% through 8% in 2% steps. Clamp invalid stored values before uploading a uniform.

## Adaptive quality

Select `CRT QUALITY: AUTO` to follow the shared runtime quality tier measured by the P0 telemetry monitor. Select HIGH, MEDIUM, or LOW to pin the post-processing cost for profiling. Reduce bloom, chromatic aberration, and shadow-mask cost under pressure while preserving scanline phase, gamma, curvature, overscan, and Clean Pixel accuracy.

## Program cache

Cache linked shader programs by WebGL context and exact vertex and fragment source. Reuse the linked program when a pipeline is reconstructed in the same context. Invalidate and delete cached programs after context loss or an invalid attribute contract. Keep textures and vertex buffers owned by each pipeline instance.

## Verification

Run the focused shader and browser controls:

```bash
npx vitest run src/engine/graphics/CrtShaderPipeline.test.ts
npx playwright test tests/regression/arcade.spec.ts --grep "CRT"
```

Run the complete gates before submission:

```bash
npm run baseline
npm test
npx playwright test
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

Keep CPU submission time and the overall frame result visible through `data-crt-submit-mean-ms`, the runtime telemetry overlay, and the build baseline. Reject changes that exceed the documented medium-load budgets without measured justification.
