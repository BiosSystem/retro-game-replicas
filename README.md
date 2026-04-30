<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Share+Tech+Mono&weight=bold&size=34&duration=3000&pause=1000&color=00FF72&center=true&vCenter=true&width=600&lines=Universal+Retro+Arcade;11+Classic+Games;Tauri+v2+Multi-Platform;BiosSystem+Kernel" alt="Retro Arcade Typing Title" />
</p>

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=rust,ts,vite,html" alt="Tech Stack" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/BiosSystem/retro-game-replicas?color=00ff72&style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Tauri-v2-blue?style=flat-square" alt="Tauri">
  <img src="https://img.shields.io/badge/Phaser-4.1-orange?style=flat-square" alt="Phaser">
  <img src="https://img.shields.io/github/license/BiosSystem/retro-game-replicas?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/stars/BiosSystem/retro-game-replicas?style=flat-square&color=00ff72" alt="Stars">
</p>

---

**Universal Retro Arcade** is a premium collection of 11 classic and 2000s-era game replicas rebuilt using modern cross-platform web technologies. Optimized for everything from MacBooks to mobile devices.

<p align="center">
  <img src="https://raw.githubusercontent.com/BiosSystem/retro-game-replicas/master/docs/images/lobby.png" width="800" alt="Retro Arcade Lobby" />
</p>

## ✨ Why It's Unique

Most retro game projects are either standalone web games or bulky emulator frontends requiring illegal ROMs. This is an entirely self-contained arcade:

- **11 Built-In Games** — Snake, Pong, Asteroids, Breakout, Frogger, Space Invaders, Tetris, Minesweeper, Runner, Flappy Bird, and Cyber Chasm. All built from scratch.
- **Hardware Gamepad Support** — Plug-and-play support for Xbox and PlayStation controllers via the HTML5 Gamepad API, automatically mapped to all games.
- **GLSL CRT Shader** — Press `Ctrl+Shift+C` to toggle a hardware-accelerated post-processing pipeline featuring chromatic aberration, barrel distortion, and vignette.
- **Persistent High-Score Board** — Per-game difficulty high scores saved locally with IndexedDB.
- **B-I-O-S Easter Egg** — Type `B-I-O-S` on your keyboard to activate a neon diagnostic overlay.

## 📊 Feature Matrix

| Feature | Universal Retro Arcade | EmulationStation | Web Retro Clones |
|---|:---:|:---:|:---:|
| **Included Games** | 11 Built-in | Requires ROMs | Usually 1 |
| **Binary Size** | <15MB (Tauri v2) | >100MB | N/A |
| **Native Mobile APK** | ✅ | ❌ | ❌ |
| **GLSL CRT Shaders** | ✅ | ✅ | ❌ |
| **Gamepad Support** | ✅ | ✅ | ❌ |

## 🖥️ Platform Support

| Platform | Artifact | Notes |
|---|---|---|
| **macOS** (`arm64`/`x64`) | `.dmg` | Native desktop app via Metal. |
| **Windows** (`x64`) | `.exe` | Standalone installer using WebView2. |
| **Android** (`arm64`) | `.apk` | Touch-optimized controls. |
| **Cloud / Headless** | `.tar.gz` | Remote high-score tracking server. |

## 🚀 Quick Start (Development)

```bash
# Install dependencies
npm install

# Run the Tauri desktop launcher locally
npm run tauri dev
```

## 📖 Documentation

Full documentation is available in the **[Wiki](https://github.com/BiosSystem/retro-game-replicas/wiki)**.

## 🕹️ Game List

| Game | Genre | Controls |
|---|---|---|
| Snake | Arcade | Arrow Keys / D-Pad |
| Pong | Sports | W/S Keys / Left Stick |
| Asteroids | Shooter | WASD + Space / Right Trigger |
| Breakout | Arcade | Mouse / Left Stick |
| Frogger | Arcade | Arrow Keys / D-Pad |
| Space Invaders | Shooter | Arrow Keys + Space |
| Tetris | Puzzle | Arrow Keys / D-Pad |
| Minesweeper | Puzzle | Mouse / Touch |
| Runner | Endless | Space / A Button |
| Flappy Bird | Endless | Space / A Button |
| Cyber Chasm | Platformer | WASD / Left Stick |

## 🙏 Credits & Maintenance

All game replica logic, physics tuning, particle systems, CRT shaders, and Tauri integration are designed and maintained by **BiosSystem**.

---
*Copyright © 2026 BiosSystem | Powered by BiosSystem Kernel*
