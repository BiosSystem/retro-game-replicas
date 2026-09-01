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

## Create music in Tracker Studio

Launch **SOUND WORKSHOP / TRACKER STUDIO** from the cabinet selector. The studio keeps all authoring data local to the browser and loads a safe blank project if its saved project data is missing, outdated, or malformed.

1. Enter notes into the selected channel with `Z S X D C V G B H N J M` for C-3 through B-3 or `Q 2 W 3 E R 5 T 6 Y 7 U` for C-4 through B-4.
2. Move through rows and channels with arrow keys and `Tab`. Clear a cell with `Delete` or `Backspace`.
3. Press `F5` or `Space` to play the song, `F6` for the active pattern, `F8` to stop, and `F9` to arm record mode.
4. Press `[` or `]` to adjust FM modulation. Use `F1`, `F2`, and `F3` to select low-pass, high-pass, and band-pass filtering. Audition changes immediately with a piano key.
5. Save a portable binary song with `O`. Load a validated `.neonseq` file with `L`. Render an offline WAV download with `Ctrl+W`.
6. Stop the track, then use the cabinet pause flow to return to the lobby. The active song and its Meta-Arcade Hall BGM slot persist in local storage automatically.

Keep `.neonseq` files small and versioned. The binary codec rejects invalid signatures, truncated content, unsupported rows, invalid order references, and trailing data instead of passing malformed data to the audio engine.

## Build a Homebrew cartridge

Launch **HOMEBREW STUDIO / CARTRIDGE PLAYER** to run the bundled *Neon Invader* reference cartridge, load a local `.neongame` file, or verify a cartridge error boundary. Keep cartridges deterministic. The runtime gives each module a fixed 1 MiB heap and stops execution after 100,000 instructions in one frame.

| Segment | Encoding |
|---|---|
| Header | `NEON` magic (`0x4E454F4E`), version byte, target tick rate (`uint16`, little-endian) |
| Metadata | Length-prefixed UTF-8 title, author, and version strings |
| Program | Bytecode length (`uint32`) followed by the instruction buffer |
| Static assets | Count plus ID and length-prefixed vector and audio segments |
| Integrity | FNV checksum over the complete payload, verified before execution |

| Opcode group | Operations |
|---|---|
| Stack and heap | `OP_PUSH`, `OP_POP`, `OP_DUP`, `OP_SWAP`, `OP_LOAD_I32`, `OP_STORE_I32` |
| Arithmetic and logic | `OP_ADD`, `OP_SUB`, `OP_MUL`, `OP_DIV`, `OP_MOD`, `OP_BIT_AND`, `OP_BIT_OR`, `OP_BIT_XOR`, `OP_NOT` |
| Control flow | `OP_JUMP`, `OP_JUMP_IF`, `OP_CALL`, `OP_RET`, `OP_HALT` |
| Host bridge | `OP_HOST_DRAW`, `OP_HOST_AUDIO`, `OP_HOST_INPUT`, `OP_HOST_TIME` |

Use the host bridge only through these stack call signatures. The bridge clamps all parameters and exposes no DOM, Phaser scene, network, or raw audio-context references.

| Host command | Stack parameters |
|---|---|
| `DrawVectorPath` | `pathId, x, y, scale, color` |
| `PlaySynthNote` | `channel, patchId, note, volume` |
| `ReadInputBitmask` | `playerIndex` and pushes the normalized input bitmask |
| `ReadTime` | Pushes a bounded millisecond clock value |

## Test container delivery

Use a Docker-enabled host:

```bash
cp compose.example.yaml compose.yaml
docker compose up --build -d
curl --fail http://127.0.0.1:8080/healthz
```

Keep `compose.yaml` local and ignored. Preserve loopback binding and route public traffic through an HTTPS reverse proxy.
# Netplay versus development

Use the rollback state codecs and `VersusRules` when adding a versus scene adapter. Send a state hash every 60 fixed ticks, queue Tetris garbage only after a confirmed multi-line clear, and begin the 15-second reconnect clock only after a connected peer disconnects. Keep the normal offline scene path available.
