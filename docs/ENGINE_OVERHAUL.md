# Deep Arcade Engine Architecture

## Rendering and physics

Keep Phaser Arcade Physics on its 60 Hz fixed step. Phaser already maintains an RTree broad-phase index for dynamic bodies, so do not add a second quadtree around Phaser bodies. Use `SpatialHashGrid` only for custom systems that operate outside Arcade Physics, such as projectile threat queries and particle neighborhoods. Clamp sprite-state updates to 250 ms after stalls and let the runtime suspend the game loop when the document is hidden.

Use generated pixel textures and global texture keys. Drive character state through `SpriteStateMachine`, which owns deterministic frame timing, direction, state-specific hitboxes, interpolation progress, and one-shot action events. Keep collision bodies smaller than visible silhouettes to avoid punishing edge contacts.

References:

- [Phaser Arcade Physics](https://docs.phaser.io/phaser/concepts/physics/arcade)
- [Phaser animation system](https://docs.phaser.io/phaser/concepts/animations)
- [Phaser Arcade body offsets](https://docs.phaser.io/phaser-editor/v4/scene-editor/arcade-physics/arcade-physics-add-object)

## Procedural audio

Create one `AudioContext` after a user gesture and route every source through one master gain. Schedule oscillator frequency and gain through AudioParam timelines. Generate a deterministic in-memory noise buffer for explosions. Compose effects from short tone plans:

- Laser: descending square wave.
- Explosion: descending sawtooth plus filtered noise.
- Coin: two square-wave notes.
- Power-up: ascending triangle arpeggio.
- Stage clear: four-note square-wave fanfare.

Keep background music sequenced in code and stop its timer when a scene exits. Never load external audio assets.

Reference: [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

## Progression and persistence

Use `ProgressionDirector` for stage counters, combo expiry, score multipliers, power-up thresholds, and enemy behavior selection. Space Defenders selects patrol, chase, or barrage fire based on stage and distance. Clear a wave to advance without resetting the score.

Store the top ten scores per game and difficulty in the versioned v3 ledger. Migrate v2 best scores once. Sanitize initials before storage. Store cabinet theme and key bindings in a separate versioned preference record, validate every loaded value, and fall back to safe defaults after corrupt data.

## Verification targets

- TypeScript static analysis must pass with `erasableSyntaxOnly` enabled.
- Unit tests must cover animation transitions, collision queries, combo expiry, AI selection, effect plans, preference validation, and stable top-ten ordering.
- The spatial hash benchmark must insert 5,000 bodies and execute 500 regional queries per sample.
- The production Vite build must complete with zero errors.
