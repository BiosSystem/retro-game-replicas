# Security Policy

Protect the Universal Retro Arcade web and Tauri runtimes through narrow capabilities, bounded data contracts, browser isolation, and verification before publication.

## Supported versions

Support only the latest tagged release. Apply security fixes to the active release branch, then publish a new tag after the validation workflow passes.

| Version | Supported |
|---|---|
| Latest tagged release | Yes |
| Older releases | No |

## Report a vulnerability

Do not open a public issue for an undisclosed vulnerability. Send the report to `security@bios-system.net` with affected versions, reproduction steps, impact, and any proposed mitigation.

Target acknowledgement within 24 hours and a remediation plan within three business days. Coordinate disclosure after a verified fix becomes available.

## Security boundaries

### Tauri shell

Expose no custom Rust commands. Grant the main window only `core:default` permissions through `src-tauri/capabilities/default.json`. Enable the production CSP in `src-tauri/tauri.conf.json`. Do not grant shell, filesystem, process, updater, or arbitrary HTTP plugin permissions without a separate threat review and capability test.

### Hosted shell

Serve the container through `nginx.conf`. Enforce Content Security Policy, cross-origin isolation, same-origin resource policy, MIME sniffing protection, frame denial, a restrictive permissions policy, and no-referrer behavior. Keep the Nginx worker unprivileged.

Allow `blob:` scripts and workers only because generated AudioWorklet modules require them. Allow `wasm-unsafe-eval` only because the engine validates and instantiates code-owned Wasm bytes at runtime. Keep community mods declarative and never evaluate imported JavaScript.

### Local persistence

Store score boards and preferences in versioned `localStorage` records. Sanitize player initials and write dynamic DOM values with `textContent`. Treat local scores as user-controlled local data, not authoritative records.

Store bounded save-state memory and verified connected-peer claims in IndexedDB. Validate save-state version, slot, memory size, player transforms, seed, preview encoding, timestamp, and SHA-256 digest before restoration. Fall back to isolated volatile memory when IndexedDB fails.

### Peer protocols

Require manual peer establishment. Bound message sizes, peer counts, replay records, score envelopes, and world-state operations. Verify Ed25519 signatures before accepting peer score claims or signed state. Treat signatures as integrity and actor-key proofs, not central identity or anti-cheat guarantees.

### Rendering and compute

Clamp canvas dimensions, shader uniforms, particle counts, simulation iterations, Worker messages, Wasm memory, and WebGPU buffer contracts. Detect WebGPU, WebXR, WebCodecs, WebTransport, SharedArrayBuffer, AudioWorklet, and Wasm SIMD support before use. Retain bounded fallback paths.

## Release gate

Require the GitHub validation job to pass before tag-triggered package publication. Run deterministic dependency installation, TypeScript analysis, Vitest, the production build, Chromium regression tests, Firefox and WebKit smoke tests, and locked Cargo analysis. Keep container and desktop publication jobs dependent on that validation result.

Do not publish from an unreviewed local feature branch. Do not claim a platform is supported until its packaged artifact completes a smoke test.
