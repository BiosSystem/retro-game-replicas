# Project Roadmap

This document outlines the architectural evolution and feature improvements for the **retro-game-replicas** project.

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
- Implement instant game state serialization stored in IndexedDB or localStorage.
- Build UI for slot selection and thumbnail previews.
- Create local-first leaderboard system with optional API sync to central bios-system.net dashboard.

## v2.0.0 (Phase 4) - PWA Offline Mode & Local Multiplayer Matrix
- [x] Configure a content-versioned Service Worker that precaches the complete production bundle for offline play.
- [x] Introduce the Local Multiplayer Matrix across co-op, competitive, relay, keyboard, and gamepad modes.
