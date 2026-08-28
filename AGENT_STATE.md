# AGENT_STATE: Retro Game Project

## Current Objective & Milestone
- Active Task: V2_1_DEVELOPMENT_CYCLE - Package the verified P1 advanced CRT calibration milestone from `feat/v2.1-crt-calibration`.
- Target Status: Completed
- Default Target Branch: `master`
- Feature Branch Pattern: `feat/v2.1-<system>`
- Active Pull Request: `https://github.com/BiosSystem/retro-game-replicas/pull/17`

## Verified Working Systems & Mechanics (Do NOT Break/Repeat)
- [x] Pull Request #16 merged into `master` at `e125297` with administrator authorization and its feature branch was deleted remotely. Verified by: GitHub pull request state, remote branch pruning, and local default-branch synchronization.
- [x] The presentation-only CRT pass supports source-row-stable scanlines, gamma-aware phosphor response, 0% through 8% overscan calibration, four scanline phases, and per-context linked-program reuse without affecting deterministic game state. Verified by: seven targeted CRT tests and the complete Chromium rendering matrix.
- [x] Cabinet Control persists CRT AUTO, HIGH, MEDIUM, and LOW quality preferences plus overscan and scanline phase. AUTO consumes the P0 adaptive runtime tier while fixed modes support repeatable profiling. Verified by: Cabinet Control persistence coverage and runtime DOM diagnostics.
- [x] The P1 production baseline passes with 69 generated files, 1,844,715 total bytes, a 113,240-byte bootstrap, and a 1,352,405-byte deferred Phaser runtime. The WebGL CRT CPU submission mean measured 0.0642 ms under the complete browser run. Verified by: `npm run baseline` and Chromium telemetry output.
- [x] The P1 feature branch passes TypeScript analysis, 284 Vitest tests across 97 files, 56 Chromium gameplay and visual regressions, the production build, and the complete locked Cargo test profile. Verified by: local release commands against the production bundle.
- [x] The v2.1 P0 profiler measures frame timing, input event latency, InputManager polling cost, heap peak, and audio-underrun signals through bounded rings without changing deterministic game state. It classifies representative scenes into low, medium, and high-load budgets and reports PASS or WARN through the runtime HUD. Verified by: four targeted PerformanceBaseline tests and TypeScript static analysis.
- [x] Cabinet Control persists the Telemetry toggle and renders the active load class, budget state, input metrics, audio underruns, and heap state. The `B-I-O-S` keyboard sequence remains available. Verified by: focused Chromium settings integration and the complete browser matrix.
- [x] The reproducible production baseline passes with 69 generated files, 1,841,094 total bytes, a 109,619-byte bootstrap, and a 1,352,405-byte deferred Phaser runtime. Verified by: `npm run baseline` and fixed byte budgets.
- [x] The P0 feature branch passes TypeScript analysis, 282 Vitest tests across 97 files, 55 Chromium gameplay and visual regressions, and the complete locked Cargo test profile. Verified by: local release commands against the production bundle.
- [x] The v2.0.0 tag workflow passed source validation, Chromium regression, Firefox and WebKit smoke coverage, container security checks, locked Tauri analysis, GHCR publication, and Linux, Windows, and macOS packaging. The release contains AppImage, DEB, RPM, EXE, MSI, DMG, and macOS app archive assets. Verified by: GitHub Actions run `33162206545` and the final seven-asset GitHub release inventory.
- [x] Remove obsolete one-off patch scripts after confirming they contain broad migration replacements for already completed Gamepad and ledger work. Keep no ignore rule or archived copy because neither script is a safe recurring utility. Verified by: source inspection and completely clean working-tree check.
- [x] Pull Request #14 merged into `master` at `f6ca2fb` with administrator authorization, its feature branch was deleted remotely, and the complete rebranding documentation sweep is live. Verified by: GitHub pull request state, remote branch pruning, and local default-branch synchronization.
- [x] BiosSystem Neon Arcade v2.0.0 is published at `https://github.com/BiosSystem/retro-game-replicas/releases/tag/v2.0.0`. The `v2.0.0` tag resolves to merged commit `f6ca2fb` and the release is neither a draft nor a prerelease. Verified by: local tag resolution and GitHub release metadata.
- [x] The v2.0.0 release commit passes 278 Vitest tests across 96 files and the complete locked Cargo test profile with zero failures. The preceding GitHub gate also passed TypeScript analysis, production build, Chromium regression, Firefox and WebKit smoke coverage, container build and headers, and locked Tauri analysis. Verified by: post-merge local sanity gates and GitHub Actions run `33156017429`.
- [x] Pull Request #13 merged into `master` at `2f76190` with the authentic gameplay gallery and passed every required GitHub check. Verified by: GitHub pull request state and commit history.
- [x] The architecture and developer guides map Neon Vector, Tetris Pulse, Neon Cyber-Caster, Neon Danmaku, Neon Epoch, and Meta-Arcade Hall to their active lazy-loaded scene implementations and engine roles. Verified by: catalog and scene-registry source audit.
- [x] GitHub presents the BiosSystem Neon Arcade description and the retro-gaming, Phaser 4, arcade engine, game development, TypeScript, and Rust discovery topics. Verified by: GitHub repository metadata query.
- [x] The published v2.0.0 release notes include architecture highlights and links to authentic README gameplay captures. Verified by: GitHub release body, release-note links, and image-path audit.
- [x] The final rebranding sweep passes TypeScript static analysis, 278 Vitest tests across 96 files, the locked Cargo test profile, and the 186-module production build. Verified by: `npm run lint`, `npm test`, `cargo test --locked --manifest-path src-tauri/Cargo.toml`, and `npm run build`.
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
- [x] The npm unit-test command quotes its browser-tree exclusion so POSIX and Windows shells pass the same literal Vitest glob. Verified by: 96 files and 278 Vitest tests through the quoted command.
- [x] The Linux validation job installs the GTK, WebKitGTK, AppIndicator, and SVG development libraries required by Tauri before locked Cargo analysis. Verified by: failure isolation against the Ubuntu 22.04 runner and parity with the desktop release job dependency set.
- [x] The README shows a live lobby and five representative game frames captured from the current production build through Phaser's Canvas fallback. Verified by: focused Playwright capture run and visual inspection of every 640x480 output.
- [x] Fun Zone hosting uses a loopback-only Compose template with read-only root filesystem, dropped capabilities, no-new-privileges, and memory-backed Nginx runtime paths. Verified by: Compose schema review and existing CI container smoke workflow.
- [x] Overlay suspension releases legacy synthetic keys and restores the active bridge after close. Verified by: Chromium controller pause-menu regression.
- [x] Production browser shell builds with 186 modules, including responsive cabinet scaling, CRT fallback, IndexedDB save states, offline shell, and local-first leaderboards. Verified by: production build and cross-browser smoke suite.
- [x] Local release baseline passes with 278 Vitest tests across 96 files, 44 Chromium workflows, six Firefox and WebKit smoke workflows, lint, TypeScript build, and zero high-severity npm audit findings. Verify new browser mechanics with focused regressions before the next full release matrix.

## Failed Attempts & Discarded Implementations
- [!] Attempt: Publish the first CRT CPU submission metric only after a complete 60-frame sample window.
  - Failure: A full-catalog Chromium run initialized and compiled the CRT surface but reached the five-second readiness deadline before the rolling metric appeared.
  - Reason Abandoned: Publish the first valid sample immediately for readiness diagnostics, then retain the 60-frame rolling average for steady-state profiling without per-frame DOM writes.
- [!] Attempt: Traverse the Windows production bundle with `URL.pathname` as a filesystem path.
  - Failure: Node resolved the decoded pathname as `D:\\D:\\...\\dist` and the baseline script failed with `ENOENT` after a successful build.
  - Reason Abandoned: Convert the file URL through `fileURLToPath` before passing it to filesystem and path APIs.
- [!] Attempt: Query the published GHCR package version directly through the current GitHub CLI token.
  - Failure: The GitHub Packages API returned HTTP 403 because the token lacks the `read:packages` scope.
  - Reason Abandoned: Trust the successful authenticated GHCR build-and-push job and its explicit `latest` and `v2.0.0` tag configuration. Do not broaden token scopes solely for a redundant read check.
- [!] Attempt: Stage a new rebranding draft release using tag `v1.0.0`.
  - Failure: GitHub already contains a published `v1.0.0` release and the current npm and Cargo manifests declare version `2.0.0`.
  - Reason Abandoned: Preserve published release history and wait for explicit authorization to stage the rebranded draft as `v2.0.0` or another unused tag.
- [!] Attempt: Run locked Cargo analysis after installing only Rust and Playwright browser dependencies.
  - Failure: The Ubuntu runner could not resolve the native `gdk-3.0` development package required by Tauri.
  - Reason Abandoned: Install the explicit Tauri Linux development libraries in the validation job before compiling Rust sources.
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
- [!] Attempt: Pass the unquoted `tests/**` exclusion through the npm test script on Linux.
  - Failure: Bash expanded the glob into positional Vitest filters and CI reported no test files.
  - Reason Abandoned: Quote the exclusion pattern in the package script so PowerShell and POSIX shells pass the same literal Vitest option.

## Active Architecture & Engine Hypothesis
- Current Approach: Keep the verified P0 telemetry and P1 presentation-only CRT contracts stable. Advance next to persistent input profile calibration and preserve the Gamepad API fallback before adding an explicitly activated optional WebHID adapter.

## Engine & Asset Registry
- Target Framework/Engine: Phaser 4, TypeScript, Vite, WebGL canvas post-processing, Web Audio API, WebAssembly, and IndexedDB.
- Asset Pipelines: Procedural canvas graphics, generated shader effects, Web Audio synthesis, generated procedural levels, no imported third-party game assets.
- Performance Baseline: Target 60 FPS with valid high-refresh deltas preserved, 50 ms maximum frame delta, strict integer 640x480 display scaling where possible, 187 production modules, a 113.24 kB initial bootstrap, a deferred 1,352.40 kB Phaser runtime, and a measured 0.0642 ms CRT CPU submission mean.
