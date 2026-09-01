# BiosSystem Neon Arcade Roadmap

## v2.5.0 development cycle

Use `master` as the protected integration target. Create focused branches with the `feat/v2.5-<system>` or `fix/v2.5-<system>` pattern. Preserve the v2.4.0 release as the performance and behavior baseline.

| Priority | Workstream | Planned outcome | Acceptance gate |
|---|---|---|---|
| P1 | Sandboxed Bytecode VM and Arcade Modding SDK | Build bounded integer bytecode execution, validated `.neongame` cartridges, a scene-independent host bridge, and the lazy Cartridge Player reference runtime. | Enforce per-tick quotas, a 1 MiB module heap, no DOM access, malformed-file rejection, browser runtime coverage, and the 1,950,000-byte bundle budget |
| P2 | Multi-Peer Tournament Brackets and Spectator Broadcast Room | Add local-first bracket orchestration, opted-in spectator rooms, and deterministic match result relay. | Preserve direct peer consent, bounded peer state, and offline cabinet behavior |
| P3 | Low-Latency Direct Raw Input Driver and Arcade Stick Remapping | Extend controller profiles with explicit arcade-stick capabilities and measured polling telemetry. | Preserve Gamepad API fallback, user gesture requirements, and keyboard accessibility |

## v2.4.0 release status

All v2.4.0 milestones are complete. The release delivers the Tracker Studio, Cabinet Decal Workshop, and signed replay-proof leaderboard features while preserving generated asset pipelines and offline-first play.

## v2.3.0 release status

All v2.3.0 milestones are complete and released. The release includes direct WebRTC room exchange, rollback-ready state boundaries, network telemetry, a bounded Shader Workshop with curved CRT controls, live versus presentation, reconnect-forfeit handling, generated cabinet UI, and dual-browser verification.

## Historical v2.3.0 development cycle

Use `master` as the protected integration target. Create focused branches with the `feat/v2.3-<system>` or `fix/v2.3-<system>` pattern. Preserve the v2.2.0 release commit as the performance and behavior baseline.

## v2.2.0 release status

All v2.2.0 milestones are complete and released. The release includes procedural co-op cabinets, bounded audio scheduling and underrun telemetry, Node 24 release-workflow alignment, and the Neon Breaker and Cyber-Racer Overdrive upgrade.

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

## Completed milestone

- Workstream: P1 additional procedural cabinets
- Branch: `feat/v2.2-procedural-cabinets`
- Status: Merged into `master` and verified
- Scope: Add Neon Relay and Prism Spiral as lazy, original scenes with deterministic wave rules, semantic local co-op input, shared overlays, generated rendering, and no asset payload
- Verification: 298 Vitest tests across 103 files, static analysis, production build, enforced bundle baseline, full catalog launch coverage, and a dedicated local co-op browser regression

## Completed milestone

- Workstream: P1 flagship cabinet Overdrive upgrade
- Branch: `feat/v2.2-breaker-racer-overdrive`
- Status: Merged and released in v2.2.0
- Scope: Upgrade the existing Neon Breaker and Cyber-Racer cabinets with deterministic racer stepping, generated horizon and city variation, pooled point-light exhaust feedback, and cabinet-facing catalog and Meta-Arcade labels.
- Boundary: Preserve stable scene keys, local high-score identity, unified input mappings, generated assets, fixed 60 Hz Arcade Physics, and Classic mode fallbacks.
- Local verification: 302 Vitest tests across 104 files, TypeScript analysis, locked Cargo tests, a 1,883,711-byte bundle baseline, and two focused Chromium cabinet-flow tests.

## Completed milestone

- Workstream: P2 audio engine optimization
- Branch: `feat/v2.2-audio-engine`
- Status: Merged into `master` and verified
- Scope: Bound generated effect and tracker voice graphs, cache tracker wave data, surface shared-worklet underruns through runtime telemetry, and preserve autoplay-safe browser fallbacks
- Verification: 301 Vitest tests across 104 files, static analysis, production build, enforced bundle baseline, and Neon Epoch spatial-audio browser coverage

## Completed milestone

- Workstream: P2 release pipeline maintenance
- Branch: `feat/v2.2-audio-engine`
- Status: Merged into `master` and verified
- Scope: Remove the temporary forced Node 24 action-runtime override after GitHub-hosted runners adopted Node 24 by default. Refresh checkout and Node setup actions to the current documented majors.
- Verification: Preserve Node 24 application setup, tag-gated validation, GHCR latest and version tags, desktop packaging, and the existing workflow configuration tests.

## v2.3.0 prioritized engineering queue

| Priority | Workstream | Planned outcome | Acceptance gate |
|---|---|---|---|
| P1 | Online netplay and rollback lobby | Add a local-first room browser, direct peer invite flow, rollback session negotiation, and reconnect recovery without a central match server | Preserve manual WebRTC consent, fixed-width input frames, replay compatibility, and offline cabinet play |
| P2 | Custom shader workshop | Add a validated visual-graph authoring surface with generated preview scenes, bounded uniforms, and shareable local presets | Retain CRT fallback, block unbounded shader sources, and keep HUD text outside effect filters |
| P2 | Curved CRT cabinet presentation | Add persisted bezel geometry, Bezier cabinet curvature, adaptive integer framing, and accessibility-safe visual controls | Preserve the core 640x480 render surface, pointer input, Canvas fallback, and the 60 FPS budget |

## Completed milestone

- Workstream: P1 deterministic snapshots and direct rollback transport
- Branch: `feat/v2.3-rollback-netplay`
- Status: Merged and verified
- Scope: Add fixed-capacity state codecs for Neon Vector and Tetris Pulse, a twelve-frame typed input ring, an in-place rollback coordinator, and manual WebRTC lobby invites.
- Boundary: Retain current offline Phaser scene behavior until game-specific deterministic state loops adopt the new codec boundary. Keep manual peer consent and do not introduce a matchmaking service or a mandatory network path.
- Local verification: 308 Vitest tests across 107 files, TypeScript analysis, locked Cargo tests, a 1,885,438-byte bundle baseline, and direct Chromium startup coverage. The complete browser matrix is deferred to protected remote CI because the local sandbox intermittently denies later Chromium process launches.

## Completed milestone

- Workstream: P1 cabinet netplay lobby and telemetry HUD
- Branch: `feat/v2.3-netplay-lobby-ui`
- Status: Merged and verified
- Scope: Add host and challenger lobby seats, sanitized room input, manual invite exchange, ready states, recovery status, rolling network telemetry, adaptive input-delay recommendations, and a persisted bezel HUD setting.
- Boundary: Preserve manual direct signaling, do not represent a six-character label as a standalone SDP transport, and keep the telemetry UI separate from deterministic game state and rendering.
- Local verification: 312 Vitest tests across 109 files, TypeScript analysis, 62 Chromium catalog, visual, and gameplay tests, locked Cargo tests, and a 1,894,501-byte production baseline. The Chromium matrix completed in 5.6 minutes against the production preview.

## Completed milestone

- Workstream: P2 Shader Workshop and curved CRT presentation
- Branch: `feat/v2.3-shader-workshop-curved-crt`
- Status: Merged and released in v2.3.0
- Scope: Add bounded factory and local CRT profiles, persisted tuning, JSON import/export, a cabinet overlay, and presentation-only curvature and phosphor controls.
- Boundary: Retain fixed-step gameplay, the 640x480 source surface, Canvas fallback, and bounded GPU submission cost. Do not execute user-authored GLSL.
- Local verification: 314 Vitest tests across 110 files, TypeScript analysis, 63 Chromium catalog and visual tests in 6.1 minutes, locked Cargo tests, and a 1,900,393-byte production baseline with a 110,154-byte bootstrap.

## Completed milestone

- Workstream: P1 live versus netplay scene adapters and v2.3.0 release staging
- Branch: `feat/v2.3-versus-netplay-release`
- Status: Merged and released in v2.3.0
- Scope: Complete live versus presentation with packet telemetry, heartbeat recovery, disconnect forfeit handling, procedural player podiums, generated cabinet UI, and dual-browser browser verification.
- Boundary: Wire only snapshot-backed state into live scenes. Do not mutate active Phaser objects from unvalidated network messages.

## Historical v2.1 delivery sequence

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
