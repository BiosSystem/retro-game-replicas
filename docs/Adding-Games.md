# Add a Game

Add every cabinet through the catalog and lazy scene registry. Keep gameplay code isolated from the lobby, preserve shared runtime contracts, and generate visual and audio content from code.

## 1. Create the scene and rule module

Create a folder under `src/games/<game>/`. Keep deterministic rules in a separate module so Vitest can exercise them without booting Phaser.

```typescript
// src/games/pulse/PulseSystems.ts
export function scoreTarget(chain: number): number {
  return 100 * Math.max(1, chain)
}
```

```typescript
// src/games/pulse/NeonPulseScene.ts
import Phaser from 'phaser'

export default class NeonPulseScene extends Phaser.Scene {
  constructor() {
    super('PulseScene')
  }

  create(data: { difficulty?: string; mode?: string }) {
    const difficulty = data.difficulty ?? 'NORMAL'
    const mode = data.mode ?? 'SOLO'
    // Generate textures, initialize state, and bind shared input here.
  }

  update() {
    // Advance bounded gameplay state here.
  }
}
```

Generate textures through Phaser Graphics, Canvas, typed buffers, or shaders. Generate sound through the shared Web Audio engine. Do not add copied sprites, ROMs, music, or executable community scripts.

## 2. Register the catalog entry

Add the public title, scene key, and cabinet icon to `ARCADE_GAMES` in `src/scenes/ArcadeCatalog.ts`:

```typescript
{ name: 'NEON PULSE', scene: 'PulseScene', icon: '◆' },
```

Keep the scene key unique and identical to the key passed to the Phaser scene constructor.

## 3. Register the lazy loader

Add the matching dynamic import to `src/sceneRegistry.ts`:

```typescript
PulseScene: () => import('./games/pulse/NeonPulseScene'),
```

Do not add advanced game scenes to the eager bootstrap list. Let the registry load them only after cabinet selection.

## 4. Use shared contracts

- Read keyboard, touch, and normalized controller actions through `InputManager`.
- Accept `difficulty` and `mode` in scene launch data.
- Use `ArcadeHud` for score, stage, combo, health, and status when its layout fits the game.
- Launch `PauseScene` and `GameOverScene` through their existing data contracts.
- Stop generated music and release scene-owned listeners during shutdown.
- Keep optional WebGPU, Wasm, Worker, and AudioWorklet paths behind capability checks with deterministic fallbacks.

Launch the shared Game Over overlay after the source scene pauses:

```typescript
this.scene.pause()
this.scene.launch('GameOverScene', {
  scene: this.scene.key,
  title: 'PULSE LOST',
  score: this.score,
  difficulty: this.difficulty,
  restartData: { difficulty: this.difficulty, mode: this.mode },
  submitScore: true,
})
```

## 5. Add verification

Add deterministic rule tests next to the system module and add the scene key to catalog launch coverage when necessary. Verify keyboard and controller navigation, Pause restart payloads, Game Over restart, lobby return, and stable paused rendering.

```bash
npm run lint
npm test
npm run baseline
npm run test:regression
npm run test:cross-browser
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

## 6. Update public documentation

Update `README.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and the relevant wiki page. Add a real runtime screenshot only when it comes from the verified production build.
