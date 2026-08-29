# Contributing to BiosSystem Neon Arcade

Contribute focused, tested changes only when the repository owner grants access to the existing `BiosSystem/retro-game-replicas` repository. Keep the public product name as BiosSystem Neon Arcade and preserve the repository slug for existing links and deployments.

## Before starting

1. Read [Architecture](docs/ARCHITECTURE.md) and [Developer How-To](docs/WIKI_HOWTO.md).
2. Search existing issues, scene modules, and tests before introducing a parallel subsystem.
3. Keep graphics, audio, levels, and gameplay data procedural or generated. Do not add ROMs, copied game assets, or executable third-party mods.
4. Discuss broad architecture, protocol, security, or package-identifier changes before implementation.

## Branch and commit standards

Use focused branches such as `feat/neon-example-scene`, `fix/pause-overlay`, or `docs/architecture-refresh`.

Write imperative, human-readable commit messages:

```text
Add deterministic boss pattern tests
Preserve arcade mode through scene restart
Document the save-state validation boundary
```

Write concise imperative commit subjects, such as `Improve controller calibration`. Use the `BiosSystem` author identity for project-owned commits.

## Required checks

Run these commands for TypeScript changes:

```bash
npm run lint
npm test
npm run build
npm run test:regression
npm run test:cross-browser
```

Run this command for Tauri changes when Rust is available:

```bash
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

Run the Compose smoke test on a Docker-enabled host when Docker, Nginx, Compose, or hosting files change.

## Pull request checklist

- Explain the gameplay, engine, visual, or documentation outcome.
- Identify changed scene keys, persistence formats, input contracts, or network message formats.
- Add or update Vitest coverage for deterministic rules.
- Add or update Playwright coverage for observable browser behavior.
- Include build and test results.
- Update `README.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and `docs/WIKI_HOWTO.md` when architecture, behavior, or developer workflows change.
- Preserve capability fallbacks for WebGPU, WebXR, WebCodecs, AudioWorklet, SharedArrayBuffer, and Wasm SIMD paths.
- Keep security limits, validation, and asset-generation rules intact.

## Review expectations

Keep pull requests small enough to review. Separate broad refactors from gameplay additions when practical. Treat direct peer networking, cryptography, persistence, and browser security policy as high-risk areas that require tests and explicit rationale.
