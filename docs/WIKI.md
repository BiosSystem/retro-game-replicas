# Universal Retro Arcade - Technical Wiki

Welcome to the Universal Retro Arcade Developer Wiki. This document provides a comprehensive technical overview of the architecture, features, deployment, and security models of the project.

## 🏗️ Architecture

The Universal Retro Arcade employs a modern, multi-platform architecture bridging a Rust-based shell with a high-performance web frontend.

### Core Components
- **Tauri v2 Shell (Rust)**: The native application container that provides the IPC bridge, Filesystem API, and capability scoping.
- **Web Frontend (TypeScript + Vite)**: The user interface layer, managing the arcade lobby, routing, gamepad input, and score management.
- **Phaser 4 Game Engines**: The core game logic running 11 distinct replica games in high-performance WebGL/Canvas contexts.
- **Post-Processing**: A GLSL CRT shader pipeline providing visual effects like chromatic aberration and barrel distortion.
- **Local Storage**: IndexedDB is used to persist high scores and game states locally.

### Data Flow
1. The **Arcade Lobby** routes users to specific games via the **Game Router**.
2. Input is managed by the **Gamepad Manager**, which feeds state to the active **Phaser 4** engine.
3. Rendering output is piped through the **Post-Processing** stack before reaching the screen.
4. **Score Manager** tracks high scores and persists them via **IndexedDB** and the **High Score Table**.
5. The **Tauri Shell** interacts with the frontend via **IPC**, restricted by **Capability Scoping**.

## ✨ Features

The application is a fully self-contained arcade experience with no external ROM dependencies.

- **11 Built-In Games**: Snake, Pong, Asteroids, Breakout, Frogger, Space Invaders, Tetris, Minesweeper, Runner, Flappy Bird, and Cyber Chasm.
- **Hardware Gamepad Support**: Plug-and-play Xbox and PlayStation controller support via the HTML5 Gamepad API.
- **GLSL CRT Shader**: Hardware-accelerated post-processing pipeline (Toggle with `Ctrl+Shift+C`).
- **Persistent High-Score Board**: Per-game difficulty high scores saved locally.
- **B-I-O-S Easter Egg**: A diagnostic overlay activated by typing `B-I-O-S`.

## 🚀 Deployment

The project is configured for rapid development and multi-platform deployment using Node.js 20+ and Rust.

### Development Stack
- Node.js & npm (for Vite and TypeScript compilation)
- Rust toolchain & Cargo (for Tauri shell compilation)
- `@tauri-apps/cli` for managing builds and development servers.

### Build Instructions
To launch the development server:
```bash
npm run tauri dev
```

To build a release binary:
```bash
npm run tauri build
```
Compiled artifacts are output to `src-tauri/target/release/bundle/`.

### Supported Platforms
- **macOS** (arm64/x64): Native desktop app via Metal (.dmg)
- **Windows** (x64): Standalone installer using WebView2 (.exe)
- **Android** (arm64): Touch-optimized mobile build (.apk)
- **Cloud/Headless**: Remote high-score tracking server (.tar.gz)

## 🔒 Security

Universal Retro Arcade enforces strict client sandboxing to ensure a secure local execution environment.

### Security Mechanisms
- **Tauri v2 IPC Scoping**: API interactions between the Phaser frontend and Rust backend are strictly scoped with restricted capabilities configuration.
- **IndexedDB State Verification**: High scores and game states are bounds-checked at runtime to prevent local storage tampering.
- **Shader Bounds Enforcement**: GLSL post-processing scanline shaders are bounds-checked to prevent WebGL resource memory overflow.

For detailed security policies and reporting guidelines, refer to the [Security Policy](../SECURITY.md) in the root repository.
