# Contributing to retro-game-replicas

This is a private project under the BiosSystem suite. External contributions are not accepted.

## Internal Development Notes

### Repository Owner

BiosSystem - https://github.com/BiosSystem

### Purpose

A collection of classic arcade game replicas built with TypeScript + Phaser 4, packaged as a cross-platform desktop app via Tauri v2.

### Stack

| Component | Technology |
|---|---|
| Game Engine | Phaser 4 + TypeScript |
| Desktop Shell | Tauri v2 |
| CI Build | GitHub Actions: Tauri matrix (Windows, macOS, Ubuntu) |

### Commit Guidelines

- Author identity: `BiosSystem`
- Plain imperative messages: `Add Snake game`, `Fix collision detection`, `Update Tauri build matrix`
- No `feat:` / `fix:` / `chore:` prefixes
- No AI signatures

### Development Workflow

```bash
npm install

# Web dev server
npm run dev

# Tauri desktop app
npm run tauri dev

# Production build
npm run tauri build
```

<!-- formatting tweak -->
