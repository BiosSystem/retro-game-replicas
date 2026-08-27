# Adding a New Game

This guide walks through adding a new game replica to the arcade from scratch. Follow every step in order.

## Step 1 - Create the Scene File

Create a new TypeScript file inside `src/games/`:

```typescript
// src/games/MyGameScene.ts
import Phaser from 'phaser'

export default class MyGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MyGameScene' })
  }

  preload() {
    // Load sprites, audio, or tilemaps here
  }

  create() {
    // Initialize game objects
    // Register gamepad and keyboard listeners
  }

  update() {
    // Per-frame logic - movement, collision, scoring
  }
}
```

## Step 2 - Register the Scene

Open `src/lobby/gameRegistry.ts` and add your scene to the registry:

```typescript
import MyGameScene from '../games/MyGameScene'

export const GAME_REGISTRY = [
  // ... existing entries
  {
    key: 'MyGameScene',
    title: 'My Game',
    genre: 'Arcade',
    scene: MyGameScene,
    controls: { keyboard: 'Arrow Keys', gamepad: 'D-Pad' },
    thumbnail: '/assets/thumbnails/mygame.png',
  },
]
```

## Step 3 - Add a Procedural Preview

Render the game preview through code in the lobby or scene. Keep the repository free of imported game art and do not add thumbnail image assets.

## Step 4 - Implement Gamepad Support

Inside `update()`, read semantic controller actions from `InputManager`:

```typescript
import { InputManager } from '../engine/InputManager'

update() {
  if (InputManager.isP1Down('UP')) this.moveUp()
  if (InputManager.isP1Down('DOWN')) this.moveDown()
  if (InputManager.isP1Down('FIRE')) this.action()
}
```

## Step 5 - Launch Game Over on Loss

When the player loses, pause the source and launch the shared overlay. Preserve restart data for stage and mode-aware games:

```typescript
this.scene.pause()
this.scene.launch('GameOverScene', {
  scene: this.scene.key,
  title: 'SYSTEM OVERLOAD',
  score: this.score,
  difficulty: this.difficulty,
  restartData: { difficulty: this.difficulty, mode: this.mode },
  submitScore: true,
})
```

## Step 6 - Add to the Game List Table in README

Open `README.md` and add a row to the **Game List** table with the correct genre, keyboard controls, and gamepad mapping.

## Step 7 - Test Locally

```bash
npm run dev
```

Open `http://localhost:5173` and navigate to your new game tile. Verify keyboard and gamepad controls work correctly, the shared Game Over overlay can restart the source scene, and Pause Restart preserves the launch data cleanly.
