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

## Progression and persistence

Use `ProgressionDirector` for stage counters, combo expiry, score multipliers, power-up thresholds, and enemy behavior selection. Space Defenders selects patrol, chase, or barrage fire based on stage and distance. Clear a wave to advance without resetting the score.

Store the top ten scores per game and difficulty in the versioned v3 ledger. Migrate v2 best scores once. Sanitize initials before storage. Store cabinet theme and key bindings in a separate versioned preference record, validate every loaded value, and fall back to safe defaults after corrupt data.

## Verification targets

- TypeScript static analysis must pass with `erasableSyntaxOnly` enabled.
- Unit tests must cover animation transitions, collision queries, combo expiry, AI selection, effect plans, preference validation, and stable top-ten ordering.
- The spatial hash benchmark must insert 5,000 bodies and execute 500 regional queries per sample.
- The production Vite build must complete with zero errors.
