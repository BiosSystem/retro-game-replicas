# Credits and Acknowledgments

BiosSystem Neon Arcade is an original open-source project maintained by the BiosSystem Open Source Community. The repository contains original game implementations and code-generated visual and audio content. It includes no game ROMs, copied sprite sheets, or copied music.

## Runtime and development software

| Component | Project | License | Role |
|---|---|---|---|
| Phaser | [Phaser](https://github.com/phaserjs/phaser) | MIT | Browser game runtime, physics, input, and generated Nine Slice UI |
| TypeScript | [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 | Static analysis and application source |
| Vite | [Vite](https://github.com/vitejs/vite) | MIT | Development server and production bundling |
| Vitest | [Vitest](https://github.com/vitest-dev/vitest) | MIT | Unit, integration, and benchmark verification |
| Playwright | [Playwright](https://github.com/microsoft/playwright) | Apache-2.0 | Chromium, Firefox, and WebKit verification |
| Tauri | [Tauri](https://github.com/tauri-apps/tauri) | MIT or Apache-2.0 | Optional desktop shell and packaging |
| Nginx | [Nginx](https://nginx.org/) | BSD-2-Clause | Hardened static web container runtime |

Review exact resolved versions in `package-lock.json` and `src-tauri/Cargo.lock`. Review incorporated and evaluated visual resources in [docs/ATTRIBUTIONS.md](docs/ATTRIBUTIONS.md).

## Original game catalog

| Group | Games |
|---|---|
| Classic cabinet replicas | Snake Evolution, Neon Pong, Neon Vector, Neon Breakout, Froggie Crosser, Space Defenders, Tetris Pulse, Minesweeper, Pixel Runner, Brave Bird, Cyber Chasm |
| Modern arcade games | Neon Retro Racer, Neon Cyber-Caster, Neon Tactics, Neon Labyrinth, Neon Danmaku, Neon Kombat |
| Procedural Neon worlds | Neon Odyssey, Neon Chrono, Neon Paradox, Neon Nexus, Neon Genesis, Neon OS, The Singularity, Event Horizon, Neon Epoch |
| Generated hub | Meta-Arcade Hall |

## Open-source references

| Project | License | Use |
|---|---|---|
| [Phaser Examples](https://github.com/phaserjs/examples) | MIT source code | Reference Phaser API patterns without incorporating example assets |
| [phaser-fullscreen](https://github.com/RocketshipGames/phaser-fullscreen) | MIT | Reference user-initiated fullscreen interaction patterns while retaining an original standard Fullscreen API implementation |

Release project-owned source and generated content under the repository [MIT License](LICENSE).
