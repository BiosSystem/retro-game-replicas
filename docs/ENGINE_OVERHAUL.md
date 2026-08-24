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

### Four-voice tracker

Run `ChiptuneSequencer` on a 25 ms timer and schedule 100 ms ahead against `AudioContext.currentTime`. Keep musical timing on the audio clock instead of the JavaScript timer. Route lead, arpeggio, bass, and drum voices through independent gains into a cross-faded tracker bus.

- Lead: alternate 25 and 50 percent pulse waves across notes and apply 6 Hz vibrato.
- Arpeggio: subdivide chord steps across fast pulse notes.
- Bass: use a triangle oscillator with a short frequency slide.
- Drums: filter a deterministic white-noise buffer into kick, snare, and hi-hat envelopes.

Define Arcade Plaza at 132 BPM, Deep Space Recon at 116 BPM, Cyber Sprint at 172 BPM, and Hyper Vector at 148 BPM. Suspend the tracker with the audio context when the document becomes hidden. Disconnect and remove every scheduled source through its `onended` handler.

Reference: [MDN advanced audio sequencing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)

## Menu and scene lifecycle

Run the BIOS POST in the small entry module before importing Phaser. Persist credits and free-play state locally. Consume one credit only when launching a selected difficulty. Enter attract mode after 30 seconds without keyboard or gamepad activity and rotate animated vector preview reels every four seconds.

Register system overlays at bootstrap. Import game scenes through `sceneRegistry` only when selected, add each scene to Phaser once, and reuse it on later launches. Preserve pause and settings overlays across lazy scene transitions.

## Neon Vector Asteroids

Use inertial thrust, rotation, damping, world wrapping, and fixed-step Arcade Physics. Fracture size-three asteroids into two size-two children, then into size-one fragments. Drop minerals on every fracture. Unlock laser fire at five minerals and EMP at twelve. Grant a shield every seventh mineral.

Spawn scout UFOs on a timed lane and solve the projectile interception quadratic against ship velocity. Advance stages after every asteroid fragment is cleared. Increase field density per stage while preserving the current score and mineral inventory.

## Bundle architecture

Keep `src/main.ts` limited to CSS, BIOS output, and one dynamic bootstrap import. Split all 11 games into separate dynamic entries. Isolate tracker code and Phaser into stable shared chunks. The production build measures:

- Initial JavaScript entry: 2.83 kB, 1.41 kB gzip.
- Deferred bootstrap: 26.07 kB, 7.68 kB gzip.
- Lazy game modules: 2.99-7.16 kB each.
- Deferred cached Phaser runtime: 1,352.40 kB, 351.52 kB gzip.

Set the Vite warning ceiling to 1.5 MB for the known Phaser runtime. Keep every application-owned entry below 500 kB and emit a manifest for bundle verification. Do not claim the Phaser framework itself became smaller.

Reference: [Vite production build guidance](https://vite.dev/guide/build)

## Local multiplayer

Poll keyboard and gamepads once per animation frame through `MultiInput`. Bind P1 to WASD plus Space and P2 to arrows plus Enter. Sort connected gamepads by browser index and assign the first two live devices to player slots. Reassign immediately after disconnect without retaining a dead slot.

Use `CoopSession` for independent lives, player-attributed scores, shared totals, and an alternating-player cooperative multiplier. Use minimum-axis collision separation for custom player bodies and Phaser colliders for scene entities.

Pass Solo, Co-op, or Versus through every scene launch. Implement bespoke dual entities in Neon Vector Asteroids and Pixel Runner. Keep Neon Pong's existing two-paddle competitive rules. Route both players into every remaining single-avatar replica through shared co-op controls or alternating 15-second versus relay turns. Show the active relay player in the cabinet status indicator and bypass relay routing for native dual-player scenes.

## Infinite procedural stages

Generate each stage from one campaign seed combined with the stage number. Use xorshift output for repeatable lanes, offsets, speeds, and hazard types. Grow density with the square root of stage number and speed with a logarithmic curve. Clamp hazards to 80 and spawn intervals to 220 ms so stage 10,000 stays finite.

Spawn a boss every fifth stage. Enable random high-tier modifiers from stage four onward:

- Low Gravity reduces Pixel Runner gravity.
- Fast Bullets accelerates Neon Vector UFO fire.
- Inverted Controls reverses steering or jump and duck intent.

## Pooled rendering and adaptive effects

Allocate particle position, velocity, life, size, and color storage once in typed arrays. Reuse slots through a ring cursor. Clamp updates after stalls, batch every active particle into one Phaser Graphics object, and remove the update listener on scene shutdown.

Sample six one-second FPS windows. Keep full effects at 54 FPS or higher, reduce particle bursts and scanline opacity between 42 and 53 FPS, and disable scanlines and chromatic filters below 42 FPS. Expose 1.0, 0.85, and 0.7 render-scale recommendations for offscreen surfaces without changing the fixed 640x480 game coordinate system.

Stress results on the development workstation:

- Update 10,000 simultaneous particles at 1,219.1 ops/s with a 0.82 ms mean.
- Insert 5,000 spatial bodies and perform 500 queries at 578.0 ops/s with a 1.73 ms mean.
- Complete 32 tests across 12 files.
- Build 45 modules with a 2.88 kB initial entry and no Vite warning.

## Progression and persistence

Use `ProgressionDirector` for stage counters, combo expiry, score multipliers, power-up thresholds, and enemy behavior selection. Space Defenders selects patrol, chase, or barrage fire based on stage and distance. Clear a wave to advance without resetting the score.

Store the top ten scores per game and difficulty in the versioned v3 ledger. Migrate v2 best scores once. Sanitize initials before storage. Store cabinet theme and key bindings in a separate versioned preference record, validate every loaded value, and fall back to safe defaults after corrupt data.

## Verification targets

- TypeScript static analysis must pass with `erasableSyntaxOnly` enabled.
- Unit tests must cover animation transitions, collision queries, combo expiry, AI selection, effect plans, preference validation, and stable top-ten ordering.
- The spatial hash benchmark must insert 5,000 bodies and execute 500 regional queries per sample.
- The production Vite build must complete with zero errors.
