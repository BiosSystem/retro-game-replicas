# BiosSystem Neon Arcade Technical Wiki

Use this document as the concise architecture, deployment, and security overview. Use [ARCHITECTURE.md](ARCHITECTURE.md) for the current runtime map, [WIKI_HOWTO.md](WIKI_HOWTO.md) for development procedures, and `ENGINE_OVERHAUL.md` for detailed subsystem contracts and measured verification results.

## Architecture

- Run one Phaser 4 game instance inside a TypeScript and Vite frontend.
- Load the lobby and persistent utility scenes at startup, then import game scenes only when selected.
- Sample keyboard, touch, gamepad, and optional network input through shared managers once per animation frame.
- Route controller menu actions and keyboard Escape through common overlay contracts. Close a visible marked DOM utility panel before Pause, preserve the source scene payload through Pause Restart, and let Phaser foreground overlays retain their own close actions.
- Render the 640x480 game canvas into an optional WebGL CRT output surface and scale both through the same display frame.
- Generate graphics, stages, previews, particles, and audio at runtime.
- Package the production frontend inside a minimal Tauri v2 shell with only `core:default` permissions and an unprivileged Nginx container option.

The Rust shell exposes no custom IPC commands and performs no filesystem score access. Keep local score boards and preferences in `localStorage`. Keep Wasm save states and verified connected-peer claims in IndexedDB with bounded memory fallbacks where implemented.

## Product scope

- Provide 26 built-in games plus the generated Meta-Arcade hall.
- Support solo, cooperative, competitive, relay, keyboard, touch, and gamepad play where each scene permits it.
- Provide four CRT presets, selectable 4:3 or 16:9 frames, and adaptive visual quality.
- Provide generated chiptune, effects, spatial audio, and capability-gated AudioWorklet processing.
- Provide local-first leaderboards, manual direct-peer netplay, signed peer-score gossip, replay validation, save states, and offline PWA operation.
- Provide declarative signed mods without executing community JavaScript.

Treat WebGPU, WebXR, WebCodecs, WebTransport, SharedArrayBuffer, AudioWorklet, and Wasm SIMD as capability-gated paths. Keep deterministic CPU, WebRTC, message-block, scalar Wasm, or source-canvas fallbacks available.

## Development and verification

Use Node.js 24 in release automation. Install the Rust toolchain only for Tauri work.

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:regression
npm run test:cross-browser
```

Run the native source gate when Cargo is installed:

```bash
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

Build native packages with `npm run tauri build`. Build the container from `Dockerfile`; it installs the generated PWA under an unprivileged UID 10001 Nginx runtime with CSP, cross-origin isolation, security headers, and a `/healthz` probe. Copy `compose.example.yaml` to the ignored local `compose.yaml` to bind the service to localhost with a read-only root filesystem, dropped capabilities, no-new-privileges, and memory-backed runtime directories. Start it with `docker compose up --build -d` and probe it with `curl --fail http://127.0.0.1:8080/healthz`. Publish it through an HTTPS reverse proxy on a dedicated origin. Keep the application at `/` and do not iframe it under the current frame-denial policy.

## Security boundary

- Validate and bound every imported mod, replay, save state, peer message, and score claim.
- Keep Tauri capabilities minimal and enforce a production CSP.
- Keep the hosted shell cross-origin isolated for SharedArrayBuffer support.
- Request microphone access only from the explicit voice control.
- Treat local scores as local data and peer scores as signed connected-peer claims, not authoritative global records.
- Keep central score synchronization disabled until BiosSystem publishes an authenticated service contract.

Report vulnerabilities through [SECURITY.md](../SECURITY.md).
