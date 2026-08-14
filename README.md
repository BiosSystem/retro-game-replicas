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

<p align="center">
  <strong>🌐 Part of the <a href="https://bios-system.net">BiosSystem Suite</a></strong>
</p>

## 🚀 Elevator Pitch

**Universal Retro Arcade** is a premium, open-source collection of 11 classic and 2000s-era game replicas. Built from scratch using modern web technologies (Phaser 4, TypeScript, Vite) and packaged natively for all platforms via Tauri v2.

Enjoy pixel-perfect gameplay with full gamepad support, hardware-accelerated GLSL CRT shaders, and local persistence - without needing external emulators or illegal ROMs.

## ✨ Features

- **11 Built-In Games** - Snake, Pong, Asteroids, Breakout, Frogger, Space Invaders, Tetris, Minesweeper, Runner, Flappy Bird, and Cyber Chasm.
- **Hardware Gamepad Support** - Plug-and-play support for Xbox and PlayStation controllers via the HTML5 Gamepad API.
- **Hardware-Accelerated Post-FX** - Toggle GLSL CRT scanlines, chromatic aberration, and barrel distortion (`Ctrl+Shift+C`).
- **Cross-Platform Native** - Less than 15MB binary size for desktop (macOS, Windows), with native Android APK support.
- **Self-Contained Architecture** - Zero external ROMs. High-score tracking via IndexedDB.

## ⚡ Quick Start

**1. Install Prerequisites:**
- [Node.js 20+](https://nodejs.org/)
- [Rust toolchain](https://rustup.rs/)
- Tauri CLI: `npm install -g @tauri-apps/cli`

**2. Setup & Run:**
```bash
git clone https://github.com/BiosSystem/retro-game-replicas.git
cd retro-game-replicas
npm install
npm run tauri dev
```

## 📖 Deep Technical Details

For comprehensive details on architecture (IPC bridge, capability scoping), deployment, security mechanisms, and the complete feature matrix, please visit the Developer Wiki:

**👉 [View the Developer Wiki](docs/WIKI.md)**

---

*Copyright © 2026 BiosSystem | Powered by BiosSystem Kernel*
