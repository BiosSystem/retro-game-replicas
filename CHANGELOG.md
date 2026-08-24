## [Unreleased] - 2026-08-24
### Changed
- Wrap the game viewport in a responsive arcade cabinet with a marquee, bezel, console rails, and live frame, input, and runtime indicators.
- Restore requestAnimationFrame scheduling and suspend the Phaser loop while the document is hidden.
- Apply CRT and reduced-motion preferences immediately from the settings overlay.
- Remove the external Google Fonts runtime dependency and use local system monospace fonts.

### Verified
- Pass TypeScript compilation and the Vite production build.
- Confirm the generated production bundle contains 28 transformed modules with no build errors.

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
