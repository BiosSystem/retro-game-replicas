# v2.1 Performance Baseline

## Objective

Measure the v2.0.0 runtime before changing CRT, input, cabinet, or audio behavior. Keep sampling bounded, allocation-stable during frame recording, and independent from game-state simulation.

## Subsystem boundaries

| Boundary | Responsibility | Location |
|---|---|---|
| Runtime sampling | Record frame deltas, input event delay, InputManager polling cost, heap peak, and audio underrun signals | `src/engine/ArcadeRuntime.ts`, `src/engine/PerformanceBaseline.ts` |
| Presentation | Render one-second telemetry snapshots and expose a persistent Cabinet Control toggle | `src/engine/FrameTelemetry.ts`, `src/scenes/SettingsScene.ts` |
| Build measurement | Measure the generated distribution, bootstrap chunk, and deferred Phaser runtime against fixed byte budgets | `scripts/performance-baseline.mjs` |
| Gameplay | Supply only the active scene key for load classification | Existing Phaser scenes remain unchanged |
| Audio | Emit `arcade-audio-underrun` only when an audio backend detects a missed render quantum | Existing audio synthesis and scheduling remain unchanged |

Do not feed telemetry results into deterministic game rules. Keep adaptive rendering quality as the only runtime consumer of measured frame rate.

## Representative runtime budgets

| Load | Representative scenes | P95 frame | Dropped frames | Input event P95 | Input poll P95 | Peak heap | Audio underruns |
|---|---|---:|---:|---:|---:|---:|---:|
| Low | Lobby, Snake, Pong, Tetris Pulse, Minesweeper | 18.5 ms | 5% | 16.7 ms | 1.0 ms | 160 MB | 0 |
| Medium | Neon Vector, Neon Cyber-Caster, Pixel Runner, remaining standard scenes | 21.0 ms | 10% | 25.0 ms | 1.5 ms | 224 MB | 0 |
| High | Neon Danmaku, Neon Epoch, Event Horizon, The Singularity, Neon Genesis | 25.0 ms | 18% | 33.4 ms | 2.0 ms | 320 MB | 0 |

Treat the browser heap value as unavailable when the runtime does not expose `performance.memory`. Keep frame, input, and underrun measurements active on those browsers.

## Reproduce the baseline

Run static analysis, unit coverage, the production build, and bundle budget validation:

```bash
npm run lint
npm test
npm run baseline
```

Run browser scenarios against the production bundle:

```bash
npm run test:regression
npm run test:cross-browser
```

Open Cabinet Control and set `TELEMETRY: ON`, or enter the `B-I-O-S` keyboard sequence. Capture at least 120 samples after scene warm-up. Record the active load class, status, P95 frame time, dropped-frame percentage, input event latency, input polling cost, audio underruns, and heap usage.

## Build budgets

| Measurement | Budget |
|---|---:|
| Complete generated `dist` tree | 2,500,000 bytes |
| Bootstrap JavaScript chunk | 131,072 bytes |
| Deferred Phaser runtime | 1,450,000 bytes |

Fail `npm run baseline` when any build budget is exceeded. Update a budget only with measured evidence and a documented architectural reason.
