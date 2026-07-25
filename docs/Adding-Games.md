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

## Step 3 - Add a Thumbnail

Drop a `200x150` PNG into `public/assets/thumbnails/` named `mygame.png`. This image appears on the lobby game tile.

## Step 4 - Implement Gamepad Support

Inside your `create()` method, subscribe to the `GamepadManager`:

```typescript
import { GamepadManager } from '../lobby/GamepadManager'

create() {
  GamepadManager.on('dpad-up', () => this.moveUp())
  GamepadManager.on('dpad-down', () => this.moveDown())
  GamepadManager.on('button-a', () => this.action())
}
```

## Step 5 - Emit `game-over` on Loss

When the player loses, emit the event so the router returns to the lobby:

```typescript
this.events.emit('game-over', { score: this.score })
```

## Step 6 - Add to the Game List Table in README

Open `README.md` and add a row to the **Game List** table with the correct genre, keyboard controls, and gamepad mapping.

## Step 7 - Test Locally

```bash
npm run dev
```

Open `http://localhost:5173` and navigate to your new game tile. Verify keyboard and gamepad controls work correctly, and that the game-over event returns you to the lobby cleanly.
