## [Unreleased] - 2026-08-24
### Changed
- Add a four-voice programmable tracker with pulse lead, chord arpeggiator, triangle bass, synthesized percussion, 25 ms lookahead scheduling, channel mixing, cross-fades, and focus suspension.
- Compose Arcade Plaza, Deep Space Recon, Cyber Sprint, and Hyper Vector as code-defined looping tracks with zero audio assets.
- Add a first-session BIOS POST, persistent coin credits, free play, animated attract previews, game records, and credit-gated launches to the arcade lobby.
- Add live fire-key capture, separate BGM volume controls, Amber phosphor styling, and gamepad Start pause support.
- Replace Astro Drift with Neon Vector Asteroids featuring three-tier fractures, mineral collection, predictive UFO fire, spread, laser, and EMP weapons, shields, stages, and vector particles.
- Defer Phaser bootstrap and load all 11 game scenes through dynamic imports.
- Split the initial JavaScript entry to 2.83 kB, the bootstrap to 26.07 kB, and game modules to 2.99-7.16 kB while isolating the cached Phaser runtime.
- Remove the Vite large-chunk warning with an explicit 1.5 MB ceiling for the known deferred Phaser runtime.
- Add deterministic sprite animation states with directional metadata, interpolated frame progress, per-state hitboxes, and action emission hooks.
- Expand Space Defenders with endless stage progression, combo multipliers, patrol, chase, and barrage fire, shield power-ups, and procedural effects.
- Replace the Pixel Runner rectangle with generated animated character frames and state-specific collision bodies.
- Expand Web Audio synthesis with scheduled laser, explosion, coin, power-up, and stage-clear effects plus a generated noise channel.
- Migrate best scores into a persistent top-ten ledger per game and difficulty while preserving v2 compatibility.
- Add validated persistent cabinet themes and remappable Player 1 control bindings.
- Add classic woodgrain and cyber cabinet themes to the neon default.
- Add shared progression and spatial-hash engines with unit and benchmark coverage.
- Update Vite and Vitest to advisory-fixed versions and clear the npm audit.
- Wrap the game viewport in a responsive arcade cabinet with a marquee, bezel, console rails, and live frame, input, and runtime indicators.
- Restore requestAnimationFrame scheduling and suspend the Phaser loop while the document is hidden.
- Apply CRT and reduced-motion preferences immediately from the settings overlay.
- Remove the external Google Fonts runtime dependency and use local system monospace fonts.

### Verified
- Pass 22 unit and integration tests across 9 files.
- Build 40 transformed modules with a 2.83 kB initial entry and no Vite chunk warning.
- Process the spatial benchmark at 616.9 operations per second with a 1.62 ms mean.
- Pass 11 unit tests across 5 test files.
- Process 5,000 spatial bodies and 500 regional queries at 442.9 operations per second with a 2.26 ms mean on the development workstation.
- Pass npm audit with zero known vulnerabilities.
- Pass TypeScript compilation and the Vite production build.
- Confirm the generated production bundle contains 32 transformed modules with no build errors.

### Added
- Native HTML5 Gamepad API integration for Player 1 and Player 2 local co-op.
- In-game UI overlay for controller connection status.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0] - Planned

### Verified
- Live build and test verification completed.

### Added
- Core Engine Refactor: Frame-rate independent delta-time clock lock (60Hz/120Hz/144Hz support).
- Modular `InputManager` supporting Keyboard, Virtual Touch Controls, and Gamepad API.

## [v1.0.0] - Baseline

### Verified
- Live build and test verification completed.

### Added
- Completed implementation for all 11 premium game replicas.
- Added **Cyber Chasm**, a high-tech labyrinth runner with overclock power-ups and sentinel AI.
- Added **Pixel Runner**, an infinite runner with parallax backgrounds and ducking mechanics.
- Added **Brave Bird**, a precision flapper with velocity-based rotation.
- Added **Froggie Crosser**, a grid-based crosser with dynamic river/road obstacles.
- Added **Tetris: Pulse**, featuring ghost pieces, screen shake, and line-clear particles.
- Added **Minesweeper: Tactical**, a cyberpunk-themed version with recursive flood-fill logic.
- Expanded the main Launcher Lobby to seamlessly support all 11 games with back-to-menu functionality.

### Changed
- Rebranded project to **Universal Retro Arcade Launcher** in `package.json` and Tauri configuration.
- Upgraded the `README.md` to reflect the full 11-game suite with documentation.
- Removed all local, hardcoded absolute system paths to ensure professional cross-platform compilation.
- Replaced all em dashes with hyphens in `README.md` and `CREDITS.md` for cross-platform doc consistency.
