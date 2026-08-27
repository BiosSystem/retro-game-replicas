# BiosSystem Neon Arcade Developer Wiki

Use these references when extending the project:

- [Architecture and Game Engine](Game-Engine.md)
- [Current Runtime Architecture](ARCHITECTURE.md)
- [Developer How-To](WIKI_HOWTO.md)
- [Engine Overhaul Contracts](ENGINE_OVERHAUL.md)
- [Adding a New Game](Adding-Games.md)
- [CRT Shader Pipeline](CRT-Shader.md)
- [Modding](MODDING.md)
- [Open Source Research](OPEN_SOURCE_RESEARCH.md)

## Project structure

```text
biossystem-neon-arcade/  # Product name. Keep the GitHub repository slug unchanged.
|- build/              Production bundle and release configuration
|- docs/               Architecture and contributor references
|- public/             Manifest icons and static shell resources
|- src/
|  |- ai/              Local bounded learning and simulation systems
|  |- audio/           Tracker, Web Audio, Wasm, and AudioWorklet systems
|  |- engine/          Runtime, input, persistence, physics, and graphics
|  |- games/           Lazy advanced Phaser game scenes
|  |- generators/      Deterministic stages and difficulty curves
|  |- graphics/        Procedural rendering and pooled effects
|  |- multiplayer/     Local session and mode coordination
|  |- net/             Direct-peer transport and signed state protocols
|  |- scenes/          Lobby and foundational game scenes
|  `- ui/              Cabinet drawers and runtime controls
|- src-tauri/           Minimal Tauri shell and capability policy
|- tests/               Chromium regression and cross-browser smoke suites
|- compose.example.yaml Tracked loopback-only hardened web service template
|- Dockerfile           Reproducible web container build
`- nginx.conf           Production shell and security header policy
```

Run `npm ci`, then use the scripts declared in `package.json`. Keep generated assets procedural and preserve capability fallbacks for browsers without advanced APIs.
