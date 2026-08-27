# AGENT_STATE: Retro Game Project

## Current Objective & Milestone
- Active Task: Rebrand the public product as BiosSystem Neon Arcade while retaining the existing repository slug.
- Target Status: Completed

## Verified Working Systems & Mechanics (Do NOT Break/Repeat)
- [x] Animation-frame controller sampling normalizes standard Xbox, PlayStation, and generic layouts with bitmask edges and radial stick deadzones. Verified by: 278 Vitest tests, Chromium regression suite, and production build.
- [x] Legacy keyboard-owned scenes receive scene-scoped synthetic controller transitions and release them on shutdown. Verified by: Snake connected-controller regression.
- [x] Pause and Cabinet Control read shared normalized controller menu input. D-pad or stick navigates, south confirms, and east or Select returns. Verified by: Chromium controller pause-menu regression.
- [x] Name Entry accepts controller-only initials. D-pad or left stick changes a character and selects a slot, south confirms, and east or Select returns to the prior slot. Verified by: Chromium high-score entry regression.
- [x] Game Over restarts are controller-accessible across Snake, Tetris Pulse, Space Defenders, Bird, Frogger, Cyber Chasm, Minesweeper, Pixel Runner, Neon Breakout, Neon Asteroids, Neon Retro Racer, and Neon Cyber-Caster. The shared overlay pauses the source, routes high scores to Name Entry, restarts with south or Space, and returns to the lobby with east, Select, or Escape. Verified by: Chromium controller restart, controller quit, and classic-ending catalog workflows.
- [x] Achievements opens from the lobby with the north face button and closes with east face button or Select. Verified by: Chromium controller overlay regression and catalog suite.
- [x] Pause Restart preserves the source scene's active difficulty and multiplayer mode instead of falling back to defaults. Verified by: Chromium Expert co-op Neon Asteroids pause-restart regression.
- [x] Escape opens the shared Pause overlay in every active game while Pause, Game Over, Settings, Achievements, and Name Entry retain their own Escape behavior. Controller Start cannot pause the foreground Game Over overlay. Verified by: focused Chromium advanced-scene Escape and controller Game Over regressions.
- [x] Escape closes a marked open DOM utility panel before gameplay receives the key, preserving the active game and preventing accidental Pause or lobby navigation. Verified by: focused Chromium save-state-panel regression.
- [x] Controller Start does not pause gameplay behind a visible marked DOM utility panel. Verified by: focused Chromium connected-controller save-state-panel regression.
- [x] Public runtime, PWA manifest, Tauri package metadata, release labels, architecture guide, developer how-to, and contribution guide use BiosSystem Neon Arcade while GitHub and GHCR repository paths remain stable. Verified by: lint, 278 Vitest tests, production build, and Chromium offline PWA regression.
- [x] Fun Zone hosting uses a loopback-only Compose template with read-only root filesystem, dropped capabilities, no-new-privileges, and memory-backed Nginx runtime paths. Verified by: Compose schema review and existing CI container smoke workflow.
- [x] Overlay suspension releases legacy synthetic keys and restores the active bridge after close. Verified by: Chromium controller pause-menu regression.
- [x] Production browser shell builds with 186 modules, including responsive cabinet scaling, CRT fallback, IndexedDB save states, offline shell, and local-first leaderboards. Verified by: production build and cross-browser smoke suite.
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
- [!] Attempt: Use Phaser's scene-local gamepad poller for lobby controller actions.
  - Failure: The lobby did not observe the controller state already normalized by the runtime input frame.
  - Reason Abandoned: Consume the shared InputManager snapshot so all cabinet actions use one animation-frame sample.
- [!] Attempt: Migrate the legacy `src/scenes/AsteroidsScene.ts` loss path.
  - Failure: The active catalog resolves `AsteroidsScene` to `src/games/asteroids/NeonAsteroidsScene.ts`.
  - Reason Abandoned: Keep the inactive legacy class unchanged because the active Neon Asteroids implementation already uses Game Over.
- [!] Attempt: Run the local Docker container validation.
  - Failure: Docker Engine and Docker Compose are not installed in the current workspace.
  - Reason Abandoned: Keep the versioned Compose template and rely on the repository CI container smoke workflow until a Docker-enabled host is available.
- [!] Attempt: Run locked Cargo validation after renaming the Tauri crate.
  - Failure: Cargo is not installed on the current workstation.
  - Reason Abandoned: Keep the manifest and lockfile package names synchronized and run the existing CI Cargo gate on a Rust-enabled runner.

## Active Architecture & Engine Hypothesis
- Current Approach: Deliver BiosSystem Neon Arcade from the existing `BiosSystem/retro-game-replicas` repository and GHCR image path. Keep one requestAnimationFrame-owned InputManager snapshot as the authoritative controller source. Let native shared-input scenes consume Player 1 state directly. Capture keyboard Escape in the runtime before scene-local handlers. Close the first visible DOM utility panel marked with `data-arcade-overlay`, block controller Start while such a panel is visible, open shared Pause only over active gameplay, and leave Phaser foreground overlays in control of their own close behavior. Use an owner-scoped synthetic keyboard bridge only for legacy scenes, suspend it for foreground overlays, route every active classic loss path plus edge-safe two-axis menu, name-entry, Game Over, and achievement-overlay actions through shared scene contracts, provide Game Over restart and lobby exit controls, copy source launch data before Pause Restart, and ship the web shell through the loopback-only Compose template.

## Engine & Asset Registry
- Target Framework/Engine: Phaser 4, TypeScript, Vite, WebGL canvas post-processing, Web Audio API, WebAssembly, and IndexedDB.
- Asset Pipelines: Procedural canvas graphics, generated shader effects, Web Audio synthesis, generated procedural levels, no imported third-party game assets.
- Performance Baseline: Target 60 FPS with valid high-refresh deltas preserved, 50 ms maximum frame delta, strict integer 640x480 display scaling where possible, 186 production modules, a 106.55 kB initial bootstrap, and a deferred 1,352.40 kB Phaser runtime.
