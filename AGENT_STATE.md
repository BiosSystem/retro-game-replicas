# AGENT_STATE: Retro Game Project

## Current Objective & Milestone
- Active Task: Complete controller-only high-score entry across the shared overlay input path.
- Target Status: Completed

## Verified Working Systems & Mechanics (Do NOT Break/Repeat)
- [x] Animation-frame controller sampling normalizes standard Xbox, PlayStation, and generic layouts with bitmask edges and radial stick deadzones. Verified by: 278 Vitest tests, Chromium regression suite, and production build.
- [x] Legacy keyboard-owned scenes receive scene-scoped synthetic controller transitions and release them on shutdown. Verified by: Snake connected-controller regression.
- [x] Pause and Cabinet Control read shared normalized controller menu input. D-pad or stick navigates, south confirms, and east or Select returns. Verified by: Chromium controller pause-menu regression.
- [x] Name Entry accepts controller-only initials. D-pad or left stick changes a character and selects a slot, south confirms, and east or Select returns to the prior slot. Verified by: Chromium high-score entry regression.
- [x] Overlay suspension releases legacy synthetic keys and restores the active bridge after close. Verified by: Chromium controller pause-menu regression.
- [x] Production browser shell builds with 185 modules, including responsive cabinet scaling, CRT fallback, IndexedDB save states, offline shell, and local-first leaderboards. Verified by: production build and cross-browser smoke suite.
- [x] Local release baseline passes with 278 Vitest tests across 96 files, 44 Chromium workflows, six Firefox and WebKit smoke workflows, lint, TypeScript build, and zero high-severity npm audit findings. Verify new browser mechanics with focused regressions before the next full release matrix.

## Failed Attempts & Discarded Implementations
- [!] Attempt: Start the Chromium suite before rebuilding the Vite production bundle.
  - Failure: Browser tests served a prior bundle that lacked the new PauseScene controller state.
  - Reason Abandoned: Always run the production build before Playwright because preview serves dist rather than source.
- [!] Attempt: Run Playwright browsers inside the filesystem sandbox.
  - Failure: Chromium launch returned EPERM.
  - Reason Abandoned: Run browser suites outside the sandbox while retaining the normal project test commands.
- [!] Attempt: Launch a parallel Phaser overlay from the global scene manager in browser coverage.
  - Failure: The global manager exposes no overlay launch operation.
  - Reason Abandoned: Launch overlays through the active source scene plugin, matching the production game-over flow.
- [!] Attempt: Run a second complete Playwright matrix while a prior browser invocation still owned the preview server.
  - Failure: The orphaned runner held port 4173 and a later suite lost its server.
  - Reason Abandoned: Run focused browser coverage for an atomic input change, then run one clean full release matrix only after confirming no preview process remains.

## Active Architecture & Engine Hypothesis
- Current Approach: Keep one requestAnimationFrame-owned InputManager snapshot as the authoritative controller source. Let native shared-input scenes consume Player 1 state directly. Use an owner-scoped synthetic keyboard bridge only for legacy scenes, suspend it for foreground overlays, and read edge-safe two-axis menu and name-entry actions directly from the shared frame.

## Engine & Asset Registry
- Target Framework/Engine: Phaser 4, TypeScript, Vite, WebGL canvas post-processing, Web Audio API, WebAssembly, and IndexedDB.
- Asset Pipelines: Procedural canvas graphics, generated shader effects, Web Audio synthesis, generated procedural levels, no imported third-party game assets.
- Performance Baseline: Target 60 FPS with valid high-refresh deltas preserved, 50 ms maximum frame delta, strict integer 640x480 display scaling where possible, and deferred 1,352.40 kB Phaser runtime.
