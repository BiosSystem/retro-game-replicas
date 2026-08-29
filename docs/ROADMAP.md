# BiosSystem Neon Arcade Roadmap

## v2.2.0 development cycle

Use `master` as the protected integration target. Create focused branches with the `feat/v2.2-<system>` or `fix/v2.2-<system>` pattern. Preserve the v2.1.0 release commit as the performance and behavior baseline.

## Completed milestone

- Workstream: P1 Next-level graphics, UI, and player identity
- Branch: `feat/v2.1-nextlevel-graphics-ui`
- Status: Implemented and verified
- Scope: Generated Nine Slice panels, animated controls, deterministic pixel avatars, local profiles, leaderboard identities, and unified featured-game HUDs
- Boundary: Add no third-party raster assets or runtime network dependency. Keep the complete production bundle within the 1.85 MiB target

## Completed milestone

- Workstream: P1 2026 visual pipeline
- Branch: `feat/v2.1-2026-visual-pipeline`
- Status: Merged and verified
- Scope: Persisted Classic and Overdrive modes, bounded point lights, one GPU particle render node per active scene, selective glow, directional camera feedback, and visual-only hit-stop
- Boundary: Preserve fixed-step game logic, hitboxes, scene clocks, replay timing, CPU particle fallback, and the current no-external-asset policy
- Verification: 290 Vitest tests across 100 files, 57 Chromium regressions, 6 Firefox and WebKit smoke checks, locked Cargo tests, and a 1,856,795-byte production output

## Completed milestone

- Workstream: P1 unified controller input and optional WebHID
- Branch: `feat/v2.1-unified-input-webhid`
- Status: Merged and released in v2.1.0
- Scope: Controller fingerprint profiles, radial and scaled-radial calibration, trigger thresholds, conflict-free bindings, generated live calibration UI, hot-plug pause recovery, and explicit WebHID report transport
- Boundary: Retain the standard Gamepad API as the default offline input path. Require a user gesture for WebHID access and preserve keyboard, touch, replay, multiplayer, and legacy-scene input contracts
- Verification: 295 Vitest tests across 102 files, 58 Chromium regressions, 6 Firefox and WebKit smoke checks, locked Cargo tests, and the standard repository production baseline

## Active milestone

- Workstream: P1 additional procedural cabinets
- Branch: `feat/v2.2-procedural-cabinets`
- Status: In progress
- Scope: Add Neon Relay and Prism Spiral as lazy, original scenes with deterministic wave rules, semantic local co-op input, shared overlays, generated rendering, and no asset payload

## Prioritized engineering queue

| Priority | Workstream | Planned outcome | Acceptance gate |
|---|---|---|---|
| P0 | Baseline and telemetry | Capture stable frame-time, memory, input-latency, audio-underrun, and bundle-size baselines for representative low, medium, and high-load scenes | Record reproducible benchmark commands and budgets. Keep all existing test, browser, container, and Cargo gates green |
| P1 | 2026 visual pipeline | Add Classic and Overdrive visual modes with bounded lights, selective glow, one GPU particle render node per scene, camera feedback, and display-only hit-stop | Preserve the fixed-step simulation and Canvas fallback. Keep one generated spark texture, twelve lights, and 768 GPU particles per scene as hard limits |
| P1 | Additional arcade cabinets | Add two original procedural cabinet scenes through the lazy catalog and shared Pause, Game Over, score, difficulty, input, and audio contracts | Add deterministic systems tests and catalog launch coverage. Use no ROMs, copied art, copied audio, or external asset bloat |
| P1 | Gamepad and WebHID mapping | Add user-remappable profiles, stick and trigger calibration, controller fingerprint persistence, hot-plug diagnostics, and an optional capability-gated WebHID adapter | Retain the Gamepad API fallback. Require explicit user activation for WebHID. Verify Xbox, PlayStation, Nintendo, 8BitDo, arcade encoders, generic, keyboard, touch, and dual-player isolation |
| P2 | Audio engine optimization | Reduce graph churn with reusable nodes, bounded voice allocation, scheduler lookahead tuning, AudioWorklet ring-buffer telemetry, and deterministic suspend and resume behavior | Record underrun and voice-count metrics. Preserve generated audio, autoplay-safe initialization, spatial DSP fallback, and zero steady-state allocation spikes |
| P2 | Release pipeline maintenance | Track native Node.js 24 action support and remove the forced compatibility path when Docker publication actions adopt it | Keep GHCR `latest` and version tags, all seven native release assets, and the complete release validation matrix intact |

## Delivery sequence

1. Establish the P0 benchmark baseline and publish the measurement protocol. Completed on `feat/v2.1-performance-baseline`.
2. Implement CRT calibration and shader-cache improvements behind existing runtime presets. Completed on `feat/v2.1-crt-calibration` with 284 Vitest tests, 56 Chromium regressions, locked Cargo validation, and a 0.0642 ms measured CRT CPU submission mean.
3. Implement the generated UI, local profile, and featured-game HUD architecture. Completed on `feat/v2.1-nextlevel-graphics-ui` with 287 Vitest tests, 57 Chromium regressions, locked Cargo validation, and a 1,852,248-byte production output.
4. Implement controller profile persistence, calibration, hot-plug recovery, and the optional WebHID report transport before adding new cabinets.
5. Add each new cabinet as an isolated scene milestone with its own deterministic rule module.
6. Optimize the audio scheduler only after collecting baseline underrun and allocation evidence.
7. Run the complete release matrix and document migration notes before cutting v2.1.0. Completed with the v2.1.0 release.

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
