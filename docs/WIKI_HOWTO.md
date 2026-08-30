# BiosSystem Neon Arcade Developer How-To

## Set up the local toolchain

Install Node.js 24 or a compatible current release. Install Rust only for Tauri work.

```bash
npm ci
npm run dev
```

Run the standard verification sequence before opening a pull request:

```bash
npm run lint
npm test
npm run build
npm run test:regression
npm run test:cross-browser
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

Run the Cargo command only when Rust is installed. Build native desktop packages with `npm run tauri build`.

## Add a game module

Follow the complete [Add a Game](Adding-Games.md) checklist. Keep these registration rules synchronized:

1. Create a scene under `src/games/<game>/`, or use `src/scenes/` only for a foundational cabinet-style replica.
2. Keep deterministic game rules and testable systems in a sibling `*Systems.ts` module. Add a matching Vitest file when the rules are nontrivial.
3. Register a lazy loader in `src/sceneRegistry.ts`.
4. Add the game name, scene key, and icon to `src/scenes/ArcadeCatalog.ts`.
5. Start the game from launch data with safe defaults for `difficulty` and supported `mode` values.
6. Use `InputManager` semantic actions. Do not add a second raw controller polling loop.
7. Launch the shared Game Over overlay on loss and preserve restart data.
8. Add a browser regression if the scene adds a new game-flow contract. The catalog launch regression will also cover registration.

Use this scene shape:

```ts
import Phaser from 'phaser';
import { InputManager } from '../../engine/InputManager';

export default class NeonExampleScene extends Phaser.Scene {
  constructor() { super('ExampleScene'); }

  create() {
    this.add.text(320, 240, 'EXAMPLE', { fontFamily: 'Courier', fontSize: '24px' }).setOrigin(0.5);
  }

  update() {
    if (InputManager.isP1Down('FIRE')) {
      // Apply one deterministic game action.
    }
  }
}
```

## Trace the active catalog

Start with `src/scenes/ArcadeCatalog.ts` when auditing names, order, icons, and public scene keys. Follow each key into `src/sceneRegistry.ts` to find its lazy-loaded implementation. Confirm the featured modules through these mappings:

| Public game | Scene key | Implementation |
|---|---|---|
| Neon Vector | `AsteroidsScene` | `src/games/asteroids/NeonAsteroidsScene.ts` |
| Tetris Pulse | `TetrisScene` | `src/scenes/TetrisScene.ts` |
| Neon Cyber-Caster | `RaycasterScene` | `src/games/raycaster/NeonCyberCasterScene.ts` |
| Neon Danmaku | `DanmakuScene` | `src/games/danmaku/NeonDanmakuScene.ts` |
| Neon Epoch | `EpochScene` | `src/games/epoch/NeonEpochScene.ts` |
| Neon Breaker | `BreakoutScene` | `src/games/breakout/NeonBreakoutScene.ts` |
| Cyber-Racer | `RacerScene` | `src/games/racer/NeonRacerScene.ts` |
| Neon Relay | `RelayScene` | `src/games/cabinets/NeonRelayScene.ts` |
| Prism Spiral | `SpiralScene` | `src/games/cabinets/NeonSpiralScene.ts` |
| Meta-Arcade Hall | `MetaArcadeScene` | `src/hub/MetaArcadeScene.ts` |

Do not infer the active implementation from a duplicate legacy filename. Resolve it through the registry and keep the catalog, registry, tests, README, and architecture table synchronized.

## Bind inputs correctly

Use semantic actions such as `UP`, `DOWN`, `LEFT`, `RIGHT`, and `FIRE` through `InputManager`. The runtime normalizes standard Xbox, PlayStation, and generic layouts every animation frame. Use `MultiInput` and the local multiplayer modules for Player 2 rather than binding raw browser keys inside a shared scene.

Keep Escape and controller Start reserved for the runtime Pause flow. Do not make a game jump directly to the lobby from a new input handler. Existing legacy scenes remain protected by runtime capture for compatibility.

## Debug memory and frame issues

1. Open the built-in telemetry overlay with the `B-I-O-S` sequence.
2. Reproduce the issue in a production build, not only a development server.
3. Inspect allocations in browser performance tools. Avoid allocating arrays, particles, path nodes, or audio nodes inside a per-frame loop.
4. Prefer typed arrays, fixed-capacity rings, reusable objects, and pooled particles.
5. Preserve hard bounds for WebGPU buffers, Worker messages, save states, replay records, and peer packets.
6. Add a Vitest regression for deterministic rule failures and a Playwright regression for scene-flow failures.

Run the benchmark suite when modifying a measured subsystem:

```bash
npm run benchmark
```

## Add procedural assets

Generate visuals with Phaser graphics, canvas, typed buffers, or shaders. Generate audio with the tracker, Web Audio nodes, or validated sound patches. Do not add ROMs, copied sprite sheets, copied music, or executable downloaded mods.

## Test container delivery

Use a Docker-enabled host:

```bash
cp compose.example.yaml compose.yaml
docker compose up --build -d
curl --fail http://127.0.0.1:8080/healthz
```

Keep `compose.yaml` local and ignored. Preserve loopback binding and route public traffic through an HTTPS reverse proxy.
