# Project Roadmap

This document outlines the architectural evolution and feature improvements for **BiosSystem Neon Arcade**. Keep the existing `BiosSystem/retro-game-replicas` repository slug for continuity.

## v1.1.0 (Phase 1) - Core Engine Refactor & Input Overhaul
- Scan the local project directory structure and verify local-only AI tracking directories are ignored.
- Refactor game loop logic to use a frame-rate independent delta-time clock (locked for 60Hz/120Hz/144Hz displays).
- Implement a modular `InputManager` class supporting Keyboard, Virtual Touch Controls, and Gamepad API.

## v1.2.0 (Phase 2) - CRT Shader Engine & Web Audio Synthesizer
- Integrate optional Canvas2D/WebGL post-processing filters (CRT scanlines, shadow mask, chromatic aberration).
- Implement dynamic aspect-ratio scaling (4:3, 16:9, Integer Scaling) with `image-rendering: pixelated`.
- Add pure Web Audio API chip-tune generation for retro sound FX.
- Build a dedicated gain-node controller with local storage persistence for master volume.

## v1.3.0 (Phase 3) - Save State Persistence & BiosSystem Integration
- [x] Implement instant game state serialization stored in IndexedDB with an isolated-memory fallback.
- [x] Build UI for slot selection and generated thumbnail previews.
- [x] Create a local-first leaderboard center with persistent device boards and verified connected-peer score gossip.
- [ ] Connect the optional central dashboard after bios-system.net publishes an authenticated score API endpoint and schema.

## v2.0.0 (Phase 4) - PWA Offline Mode & Local Multiplayer Matrix
- [x] Configure a content-versioned Service Worker that precaches the complete production bundle for offline play.
- [x] Introduce the Local Multiplayer Matrix across co-op, competitive, relay, keyboard, and gamepad modes.
- [x] Gate tagged releases behind deterministic frontend, Chromium, cross-browser, and locked Tauri verification.
- [x] Enforce production Nginx security headers, cross-origin isolation, and a compatible Tauri CSP.
- [x] Synchronize web, Tauri, Rust, changelog, and roadmap release metadata at 2.0.0.

## v2.1.0 (Phase 5) - Cabinet Reliability and Fun Zone Hosting
- [x] Unify controller-only cabinet navigation, achievements, high-score entry, and active game-over restart paths.
- [x] Preserve difficulty and arcade mode through Pause Restart.
- [x] Add Game Over restart and safe lobby exit controls for keyboard and controllers.
- [x] Route keyboard Escape through shared Pause without intercepting foreground overlays.
- [x] Prioritize visible DOM utility panels ahead of shared Pause for keyboard Escape.
- [x] Add a loopback-only hardened Compose template for Fun Zone hosting.
- [ ] Run the production Compose smoke test on a host with Docker Engine before public deployment.
