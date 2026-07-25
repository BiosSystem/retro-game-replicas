# Architecture & Game Engine

Universal Retro Arcade is a TypeScript + Phaser 4 frontend wrapped in a Tauri v2 Rust shell. Understanding how these layers interact is essential for contributors.

## Technology Stack

| Layer | Technology |
|---|---|
| Game Engine | Phaser 4 (WebGL renderer) |
| Frontend Language | TypeScript + Vite |
| Desktop Shell | Tauri v2 (Rust) |
| State Persistence | IndexedDB via localforage |
| CI/CD | GitHub Actions (matrix: Windows, macOS, Ubuntu) |

## The Phaser 4 Scene System

Each game is implemented as a self-contained Phaser 4 `Scene` class. The arcade lobby manages a global Phaser `Game` instance and swaps between scenes using the `SceneManager`:

1. **Lobby Scene** - The initial landing screen. Displays game tiles and handles user selection.
2. **Game Scenes** - Each game (`SnakeScene`, `TetrisScene`, etc.) extends `Phaser.Scene`. They receive configuration from the router and return control to the lobby on game-over.
3. **PostFX Scene** - A persistent overlay scene that applies GLSL post-processing to the game canvas.

## Game Router

The game router is a lightweight TypeScript module. When a player clicks a game tile in the lobby, the router:

1. Stops the current Lobby scene.
2. Starts the target game scene, passing control config (keyboard vs. gamepad).
3. Registers a `game-over` event listener to return to the lobby when the game ends.

## Tauri v2 IPC

The Rust backend exposes a minimal set of IPC commands:

- `read_scores` - Reads the IndexedDB high score file from the native filesystem.
- `write_scores` - Writes updated scores back to disk, bypassing browser storage quotas.

All commands are declared in `src-tauri/capabilities/` using Tauri v2's capability scoping, ensuring the frontend can only call explicitly permitted backend commands.

## Gamepad Manager

The `GamepadManager` module polls the HTML5 Gamepad API on each `requestAnimationFrame` tick. It maps analog stick axes and button indices to standard directional/action events that each game scene subscribes to.
