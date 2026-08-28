# BiosSystem Neon Arcade Roadmap

## v2.1.0 development cycle

Use `master` as the protected integration target. Create focused branches with the `feat/v2.1-<system>` or `fix/v2.1-<system>` pattern. Preserve the v2.0.0 release commit as the performance and behavior baseline.

## Active milestone

- Workstream: P1 Next-level graphics, UI, and player identity
- Branch: `feat/v2.1-nextlevel-graphics-ui`
- Status: Implemented and verified
- Scope: Generated Nine Slice panels, animated controls, deterministic pixel avatars, local profiles, leaderboard identities, and unified featured-game HUDs
- Boundary: Add no third-party raster assets or runtime network dependency. Keep the complete production bundle within the 1.85 MiB target

## Prioritized engineering queue

| Priority | Workstream | Planned outcome | Acceptance gate |
|---|---|---|---|
| P0 | Baseline and telemetry | Capture stable frame-time, memory, input-latency, audio-underrun, and bundle-size baselines for representative low, medium, and high-load scenes | Record reproducible benchmark commands and budgets. Keep all existing test, browser, container, and Cargo gates green |
| P1 | Advanced CRT and scanline pipeline | Extend existing presets with scanline phase stability, gamma-aware phosphor response, overscan calibration, shader program caching, and adaptive quality controls | Preserve Clean Pixel and Bypass accuracy. Pass shader fallback, resize, high-refresh, and screenshot regressions without per-frame allocation growth |
| P1 | Additional arcade cabinets | Add two original procedural cabinet scenes through the lazy catalog and shared Pause, Game Over, score, difficulty, input, and audio contracts | Add deterministic systems tests and catalog launch coverage. Use no ROMs, copied art, copied audio, or external asset bloat |
| P1 | Gamepad and WebHID mapping | Add user-remappable profiles, stick and trigger calibration, controller fingerprint persistence, hot-plug diagnostics, and an optional capability-gated WebHID adapter | Retain the Gamepad API fallback. Require explicit user activation for WebHID. Verify Xbox, PlayStation, generic, keyboard, touch, and dual-player isolation |
| P2 | Audio engine optimization | Reduce graph churn with reusable nodes, bounded voice allocation, scheduler lookahead tuning, AudioWorklet ring-buffer telemetry, and deterministic suspend and resume behavior | Record underrun and voice-count metrics. Preserve generated audio, autoplay-safe initialization, spatial DSP fallback, and zero steady-state allocation spikes |
| P2 | Release pipeline maintenance | Track native Node.js 24 action support and remove the forced compatibility path when Docker publication actions adopt it | Keep GHCR `latest` and version tags, all seven native release assets, and the complete release validation matrix intact |

## Delivery sequence

1. Establish the P0 benchmark baseline and publish the measurement protocol. Completed on `feat/v2.1-performance-baseline`.
2. Implement CRT calibration and shader-cache improvements behind existing runtime presets. Completed on `feat/v2.1-crt-calibration` with 284 Vitest tests, 56 Chromium regressions, locked Cargo validation, and a 0.0642 ms measured CRT CPU submission mean.
3. Implement the generated UI, local profile, and featured-game HUD architecture. Completed on `feat/v2.1-nextlevel-graphics-ui` with 287 Vitest tests, 57 Chromium regressions, locked Cargo validation, and a 1,852,248-byte production output.
4. Implement input profile persistence and calibration before enabling the optional WebHID adapter.
5. Add each new cabinet as an isolated scene milestone with its own deterministic rule module.
6. Optimize the audio scheduler only after collecting baseline underrun and allocation evidence.
7. Run the complete release matrix and document migration notes before cutting v2.1.0.

## Release requirements

- Pass TypeScript static analysis and every Vitest unit and integration test.
- Pass full Chromium regression and Firefox and WebKit smoke coverage.
- Pass the hardened container build, runtime identity, health endpoint, and security-header checks.
- Pass locked Cargo analysis and cross-platform Tauri packaging.
- Keep gameplay graphics, music, sound effects, and levels procedurally generated.
- Document user-visible settings, controls, performance budgets, and new catalog entries.

## Non-goals

- Do not add ROM execution, copied proprietary game content, or third-party binary asset packs.
- Do not require WebGPU, WebHID, AudioWorklet, Wasm SIMD, or network access for core offline play.
- Do not replace deterministic browser-safe fallbacks with capability-specific implementations.
- Do not publish from a feature branch or bypass the protected `master` validation contract.
