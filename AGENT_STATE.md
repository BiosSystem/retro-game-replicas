# AGENT_STATE: Retro Game Project

## Current Objective & Milestone
- Active Task: Maintain the verified controller menu reliability milestone and continue the highest-priority usability and release-hardening work.
- Target Status: Completed

## Verified Working Systems & Mechanics (Do NOT Break/Repeat)
- [x] Animation-frame controller sampling normalizes standard Xbox, PlayStation, and generic layouts with bitmask edges and radial stick deadzones. Verified by: 278 Vitest tests, Chromium regression suite, and production build.
- [x] Legacy keyboard-owned scenes receive scene-scoped synthetic controller transitions and release them on shutdown. Verified by: Snake connected-controller regression.
- [x] Pause and Cabinet Control read shared normalized controller menu input. D-pad or stick navigates, south confirms, and east or Select returns. Verified by: Chromium controller pause-menu regression.
- [x] Overlay suspension releases legacy synthetic keys and restores the active bridge after close. Verified by: Chromium controller pause-menu regression.
- [x] Production browser shell builds with 185 modules, including responsive cabinet scaling, CRT fallback, IndexedDB save states, offline shell, and local-first leaderboards. Verified by: production build and cross-browser smoke suite.
- [x] Local release verification passes with 278 Vitest tests across 96 files, 44 Chromium workflows, six Firefox and WebKit smoke workflows, lint, TypeScript build, and zero high-severity npm audit findings. Verified by: local release-hardening run on 2026-08-27.

## Failed Attempts & Discarded Implementations
- [!] Attempt: Start the Chromium suite before rebuilding the Vite production bundle.
  - Failure: Browser tests served a prior bundle that lacked the new PauseScene controller state.
  - Reason Abandoned: Always run the production build before Playwright because preview serves dist rather than source.
- [!] Attempt: Run Playwright browsers inside the filesystem sandbox.
  - Failure: Chromium launch returned EPERM.
  - Reason Abandoned: Run browser suites outside the sandbox while retaining the normal project test commands.

## Active Architecture & Engine Hypothesis
- Current Approach: Keep one requestAnimationFrame-owned InputManager snapshot as the authoritative controller source. Let native shared-input scenes consume Player 1 state directly. Use an owner-scoped synthetic keyboard bridge only for legacy scenes, suspend it for foreground overlays, and read edge-safe menu actions directly from the shared frame.

## Engine & Asset Registry
- Target Framework/Engine: Phaser 4, TypeScript, Vite, WebGL canvas post-processing, Web Audio API, WebAssembly, and IndexedDB.
- Asset Pipelines: Procedural canvas graphics, generated shader effects, Web Audio synthesis, generated procedural levels, no imported third-party game assets.
- Performance Baseline: Target 60 FPS with valid high-refresh deltas preserved, 50 ms maximum frame delta, strict integer 640x480 display scaling where possible, and deferred 1,352.40 kB Phaser runtime.
