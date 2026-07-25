# Developer Wiki - Universal Retro Arcade

Welcome to the **Universal Retro Arcade Developer Wiki**. This is the technical reference for developers who want to understand the codebase, contribute new games, or extend the platform.

## Table of Contents

- **[Architecture & Game Engine](Game-Engine.md)**: How Phaser 4, TypeScript, and the Tauri v2 shell fit together. Covers the scene system, game routing, and gamepad manager.
- **[Adding a New Game](Adding-Games.md)**: Step-by-step guide to scaffolding, registering, and integrating a new game replica into the arcade lobby.
- **[CRT Shader Pipeline](CRT-Shader.md)**: Deep dive into the GLSL post-processing pipeline - barrel distortion, chromatic aberration, and vignette effects.

## Quick Start for Contributors

Refer to the `CONTRIBUTING.md` in the project root for commit guidelines, author identity rules, and the development workflow.

## Project Structure

```
retro-game-replicas/
├── src/
│   ├── games/          # Individual Phaser 4 game scenes
│   ├── lobby/          # Arcade lobby UI and game router
│   ├── shaders/        # GLSL CRT post-processing shaders
│   └── scores/         # IndexedDB high score persistence
├── src-tauri/          # Rust Tauri v2 shell and capability config
├── public/             # Static assets
└── docs/               # Developer wiki (this folder)
```
