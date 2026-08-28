# Architecture and Game Engine

BiosSystem Neon Arcade uses a TypeScript and Phaser 4 frontend wrapped by a minimal Tauri v2 Rust shell.

## Runtime layers

| Layer | Implementation |
|---|---|
| Game runtime | Phaser 4 with fixed-step Arcade Physics |
| Frontend | TypeScript 6 and Vite 8 |
| Desktop shell | Tauri v2 with `core:default` permissions |
| Scores and preferences | Versioned `localStorage` records |
| Save states and peer claims | IndexedDB with bounded fallbacks |
| Offline delivery | Content-versioned service worker and web app manifest |
| Verification | Vitest plus Playwright Chromium, Firefox, and WebKit gates |
| Cabinet UI | Generated Nine Slice panels, shared HUD frames, and deterministic local profiles |

## Scene lifecycle

Start `LobbyScene`, pause, settings, achievement, name-entry, and Game Over utilities with the Phaser instance. Resolve selected games through the lazy scene lifecycle, import each scene chunk only when requested, mount it once, and start it with the selected difficulty and arcade mode. Capture keyboard Escape before scene-local handlers, close the first visible DOM utility panel marked with `data-arcade-overlay`, then open Pause from active gameplay while leaving Phaser foreground overlays responsible for their own Escape behavior. Game Over restarts through south or Space and exits safely to the lobby through east, Select, or Escape. Copy the paused source scene data before Pause Restart so difficulty, local co-op, versus, stage, and score values remain intact.

Suspend hidden gameplay through the shared runtime. Guard the active Phaser animation callback with a finite 50 ms delta cap while preserving normal high-refresh intervals. Keep physics fixed at 60 Hz.

## Input

Poll keyboard and gamepads once per animation frame through the shared input layer. Map standard PlayStation, Xbox, and generic controllers into bitmasks, press and release edges, radial stick deadzones, and bounded trigger thresholds. Use south to confirm, north to open Achievements in the lobby, east or Select to return, Escape or Start to open Pause during active play, and Start to open Cabinet Control from the lobby. Block Start pause input while a marked DOM utility panel is visible. Route local Player 1, Player 2, and optional network state through the same scene-facing actions.

## Rendering

Render gameplay at 640x480 with pixel-art sampling. Wrap the source with an optional WebGL CRT output surface. Keep 4:3 and 16:9 frame calculations separate from gameplay coordinates. Generate sprites, previews, particles, levels, shaders, and visual effects from code.

Generate one shared Nine Slice panel texture per Phaser texture manager. Use the WebGL Nine Slice object when available and retain the Canvas rectangle fallback. Reuse `ArcadeHud` for featured-game score, stage, combo, health, and status values without allocating display objects each frame.

## Player profile

Store one sanitized player name and deterministic avatar seed under `bios_arcade_profile_v1`. Generate the pixel avatar locally and reuse it in the lobby, Profile scene, Name Entry, and leaderboard. Keep profile rendering independent from remote image services and account systems.

## Audio

Use one Web Audio graph for generated effects and tracker music. Schedule sequencer events ahead of playback time. Request AudioWorklet processing only after capability checks and retain message-block or main-graph fallbacks.

## Persistence and networking

Store top-ten score boards per game and difficulty locally. Store bounded Wasm save states in IndexedDB after asynchronous integrity validation. Exchange multiplayer and verified score data only across manually established peer sessions. Provide no automatic global peer discovery or central leaderboard until server contracts exist.

## Tauri boundary

Expose no custom Rust commands. Read no scores from the native filesystem. Keep the shell responsible for packaging and window creation only. Enforce the production CSP in `src-tauri/tauri.conf.json` and keep capabilities in `src-tauri/capabilities/default.json` minimal.

## Fun Zone container

Copy `compose.example.yaml` to the ignored host-local `compose.yaml` before starting the Nginx container. Bind the service only to loopback, keep the root filesystem read-only, drop every Linux capability, enable no-new-privileges, and mount only the Nginx PID and cache paths as memory-backed temporary filesystems. Terminate HTTPS at a reverse proxy and preserve the container response headers.
