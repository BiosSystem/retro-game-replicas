# BiosSystem Neon Arcade Rebranding Release

> Draft release notes. Assign an unused version tag before publication. The current manifests declare `2.0.0`, while GitHub already contains a published `v1.0.0` release.

## Enter BiosSystem Neon Arcade

Rename Retro Gaming Replicas to BiosSystem Neon Arcade. Keep the established `BiosSystem/retro-game-replicas` repository and GHCR paths stable while presenting one consistent product identity across the web runtime, PWA, Tauri desktop package, documentation, and release metadata.

## Explore the current arcade

[Open the complete live gameplay gallery](https://github.com/BiosSystem/retro-game-replicas#live-game-gallery).

[![BiosSystem Neon Arcade lobby](https://raw.githubusercontent.com/BiosSystem/retro-game-replicas/master/docs/images/screenshots/lobby.png)](https://github.com/BiosSystem/retro-game-replicas#live-game-gallery)

| Neon Vector | Tetris Pulse |
|---|---|
| [![Neon Vector gameplay](https://raw.githubusercontent.com/BiosSystem/retro-game-replicas/master/docs/images/screenshots/neon-vector.png)](https://github.com/BiosSystem/retro-game-replicas#live-game-gallery) | [![Tetris Pulse gameplay](https://raw.githubusercontent.com/BiosSystem/retro-game-replicas/master/docs/images/screenshots/tetris-pulse.png)](https://github.com/BiosSystem/retro-game-replicas#live-game-gallery) |
| Neon Cyber-Caster | Neon Danmaku |
| [![Neon Cyber-Caster gameplay](https://raw.githubusercontent.com/BiosSystem/retro-game-replicas/master/docs/images/screenshots/neon-cyber-caster.png)](https://github.com/BiosSystem/retro-game-replicas#live-game-gallery) | [![Neon Danmaku gameplay](https://raw.githubusercontent.com/BiosSystem/retro-game-replicas/master/docs/images/screenshots/neon-danmaku.png)](https://github.com/BiosSystem/retro-game-replicas#live-game-gallery) |

[![Neon Epoch gameplay](https://raw.githubusercontent.com/BiosSystem/retro-game-replicas/master/docs/images/screenshots/neon-epoch.png)](https://github.com/BiosSystem/retro-game-replicas#live-game-gallery)

## Run the modular arcade platform

- Launch 27 lazy-loaded catalog entries through a shared Phaser 4 cabinet runtime.
- Route keyboard, touch, PlayStation, Xbox, and generic gamepad input through one animation-frame snapshot.
- Render generated pixel, vector, ray-cast, projectile ECS, volumetric, CRT, and display-scaling paths without bundled third-party game assets.
- Generate tracker music, sound effects, and spatial audio through Web Audio, AudioWorklet, and capability-gated Wasm DSP paths.
- Persist preferences, local leaderboards, deterministic replays, and bounded Neon Epoch save states locally.
- Package the browser build as a PWA, hardened Nginx container, and Tauri desktop application.

## Validate the release candidate

- Pass TypeScript static analysis with no errors.
- Pass 278 Vitest tests across 96 files.
- Pass the locked Cargo test profile for the Tauri crate.
- Build 186 Vite modules with a 106.55 kB bootstrap and deferred 1,352.40 kB Phaser runtime.

Review the [architecture guide](https://github.com/BiosSystem/retro-game-replicas/blob/master/docs/ARCHITECTURE.md), [developer how-to](https://github.com/BiosSystem/retro-game-replicas/blob/master/docs/WIKI_HOWTO.md), and [contribution guide](https://github.com/BiosSystem/retro-game-replicas/blob/master/CONTRIBUTING.md) for implementation details.
