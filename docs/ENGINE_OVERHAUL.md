# Deep Arcade Engine Architecture

## Projectile ECS, adaptive director, and Neon Danmaku

Store up to 100,000 projectiles in fixed position, velocity, lifetime, kind, and activity typed arrays. Allocate one contiguous float buffer and one byte buffer, reuse dead slots, and allocate nothing inside the CPU update loop. Use `SharedArrayBuffer` only when the browser reports cross-origin isolation and retain `ArrayBuffer` everywhere else.

Pack six-value projectile records into the optional 64-thread WebGPU backend. Clamp dispatches to 100,000 records, validate record shape before GPU allocation, read results through a staging buffer, and destroy each transient GPU buffer. Keep the synchronous typed-array kernel as the universal gameplay path because WebGPU availability and readback cost vary by device.

Feed damage rate, accuracy, movement entropy, near misses, remaining lives, and stage into a bounded 6-16-4 local network. Make one decision at most every 750 ms. Adjust density and speed around a target pressure band, increase power-up relief under sustained stress, and keep every output inside explicit gameplay bounds.

Generate Fibonacci spirals, polygon rings, and homing fans from math alone. Select higher-stage boss phases through gas-metered NeonVM bytecode and build eight articulated boss limbs through FABRIK. Render a capped sample of the live ECS when frame time rises while continuing to simulate the complete fixed arena.

Current workstation measurements:

- Update 100,000 live CPU projectiles in 2.94 ms mean, about 340 complete updates per second.
- Evaluate and train one AI Director decision in 0.0023 ms mean.
- Pass 102 Vitest tests and 13 Playwright Chromium tests.
- Build 96 modules with a 3.02 kB entry and an 8.55 kB Danmaku chunk.

## Spatial WebRTC voice

Request microphone permission only from the explicit Voice control. Accept one audio track, reject video and multiple audio tracks, and attach media to the existing manual ARC1 peer connection. Route each remote stream through `MediaStreamAudioSourceNode`, HRTF `PannerNode`, a distance-aware low-pass filter, dry gain, and a shared `ConvolverNode` filled with generated impulse data. Cap voice at the same eight direct peers as presence.

Treat the feature as direct-peer audio, not a hosted voice service. Require a fresh room-code exchange after enabling a track, external TURN configuration where NAT traversal needs relay service, and browser permission from each participant. Test negotiation constraints and graph limits locally. Do not claim measured end-to-end voice latency without two real endpoints and network instrumentation.

## NeonVM

Decode each instruction from one 16-bit word. Reserve the high nibble for the opcode and two register nibbles for operands. Provide sixteen unsigned 16-bit registers and `HALT`, `LOADI`, `ADD`, `MULQ8`, `LOADCTX`, `EMIT`, `JUMP`, and `JNZ`. Bound programs to 4,096 words, context to 256 words, gas to 100,000 cycles, and output to 64 events. Check every immediate and jump before use. Expose no DOM, network, storage, Phaser, Web Audio, dynamic import, or JavaScript evaluator.

Compile the already validated acyclic Visual Studio graph into event and action bytecode. Keep the signed declarative manifest as the portable package and treat bytecode as a derived runtime artifact. Never accept source strings or execute community JavaScript.

## Connected score gossip

Sign canonical score claims with an ephemeral Ed25519 identity. Bind player, game, score, logical clock, public key, and verified replay hash into the signature. Reject invalid shapes, modified claims, oversized batches, and duplicate identifiers. Merge valid claims through an order-independent grow-only map and rebroadcast the bounded 256-claim envelope across each connected `PeerLink`.

Persist at most 4,096 verified claims in IndexedDB and render the top ten through the connected-swarm UI. Require one manual ARC1 offer-answer exchange per peer. Provide no background internet discovery, universal global view, authoritative identity, or central anti-cheat guarantee because browser WebRTC cannot discover strangers without signaling infrastructure.

## Kinematics and cellular fluid

Solve chains through bounded FABRIK forward and backward passes while preserving segment lengths and the root anchor. Cap chains at 64 joints and iterations at 32. Simulate water or lava in preallocated byte grids, prefer downward transfer, distribute residual mass sideways, and retain total mass unless a game explicitly adds or removes cells.

Expose a 64-thread WGSL cellular copy contract for WebGPU evolution and retain the deterministic CPU implementation as the production fallback. Allocate no animation frames, fluid textures, or level assets.

## Neon Labyrinth

Generate each 32x24 room from integer chunk coordinates and keep only nine recent chunks. Carve matching side openings for seamless transitions. Gate outward progression behind dash, wall cling, and double jump rewards. Render hazards from the cellular field and build six-leg bosses from real-time FABRIK chains aimed toward the player.

Current workstation measurements:

- Execute about 1.31 million 67-instruction NeonVM programs per second.
- Keep native arithmetic 17.91 times faster than the interpreter and report the comparison honestly.
- Sort 1,000 converged score claims in 0.136 ms mean.
- Solve 1,000 sixteen-joint IK chains in 9.29 ms mean.
- Step 8,192 fluid cells in 0.025 ms mean.
- Pass 95 Vitest tests and 11 Playwright Chromium tests.
- Build 91 modules with a 2.99 kB entry and a 5.49 kB Labyrinth chunk.

## Immersive Meta-Arcade

Generate a 32x32 arcade hall from the existing BSP dungeon system. Place six flagship cabinets inside deterministic rooms. Render the hall through 160 corrected DDA rays and depth-test cabinet and remote-avatar billboards against the wall buffer. Launch a cabinet through the existing lazy scene lifecycle instead of embedding a second Phaser runtime.

Build presence as a bounded collection of direct `PeerLink` connections. Exchange one manual ARC1 offer-answer pair for each remote peer and cap the mesh at eight links. Broadcast validated player transforms at 10 Hz over reliable control channels. Keep global discovery, identity, authoritative state, and relay infrastructure outside this zero-server client.

## Deterministic replay and speedrun validation

Sample Player 1 input into a five-bit mask at the 60 Hz runtime cadence. Store only state changes with integer ticks, the scene identifier, a replay seed, and the fixed tick rate. Cap sessions at twelve hours and 200,000 changes. Restart the recorded lazy scene with the replay seed, override live Player 1 input, and drive play, pause, rewind, fast-forward, and range seeking from the timeline HUD.

Canonicalize replay fields and hash UTF-8 bytes with SHA-256 before local persistence. Recalculate the digest before accepting a speedrun ledger. Treat the hash as tamper evidence, not player identity or proof that the original client was uncompromised.

## Spatial cabinet audio

Create all cabinet tones with oscillators. Route each source through `PannerNode`, a distance-aware low-pass filter, dry gain, and a shared `ConvolverNode`. Generate the stereo impulse response from deterministic decaying noise. Update relative position, inverse-square attenuation, cutoff, and wet mix from hall coordinates. Cap the field at sixteen sources and destroy every node when the hall exits.

## Neon Tactics

Store up to 1,000 live units in one preallocated `Float32Array`. Build one breadth-first flow field per command target, then dispatch unit direction lookups without per-unit path allocation. Retain bounded A-star for individual route queries. Represent fog visibility in one byte per map cell and resources in `Uint16Array` storage.

Expose a 64-thread WGSL flow lookup contract for WebGPU adapters. Retain the deterministic typed-array CPU path as the universal production fallback. Add marquee selection, shared move targets, harvesting, base construction, fog masking, and a six-sensor Q-learning commander. Cap maps at 64x64, units at 1,000 in play, and synthetic dispatch at 10,000 units.

Current workstation measurements:

- Dispatch 10,000 units through one flow field in 0.095 ms mean.
- Process a 36,000-tick replay ledger in 0.130 ms mean.
- Compress 36,000 raw input-mask bytes into a 4,828-byte state-change ledger, a 7.46 to 1 ratio.
- Pass 86 Vitest tests across 30 files and 9 Playwright Chromium tests.
- Build 83 modules with a 2.99 kB entry, a 5.48 kB Tactics chunk, a 6.06 kB Meta-Arcade chunk, and no Vite warning.

## Capability-gated compute

Pack each AABB pair into eight contiguous float values. Dispatch independent overlap tests through a WGSL storage-buffer kernel when `navigator.gpu` and a suitable adapter are available. Transfer the packed `ArrayBuffer` to a module Worker when WebGPU is unavailable. Probe WebAssembly compilation for the next capability tier, then retain the same bounded scalar kernel for computation. Fall back synchronously to the CPU when neither asynchronous tier is usable.

Keep Phaser Arcade Physics and its renderer-owned state unchanged. Use this pipeline only for explicit custom batches and stress workloads. Reject malformed arrays and cap generated stress batches at one million pairs. Handle empty batches without issuing a zero-workgroup GPU dispatch.

References: [W3C WebGPU](https://www.w3.org/TR/webgpu/), [MDN GPU adapter selection](https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter), [MDN transferable Worker buffers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

## Local learning ghosts

Run one bounded dense network with six normalized sensors, twelve hidden neurons, and three discrete steering actions. Train with temporal-difference Q targets at an 80 ms decision cadence. Keep weights in `Float32Array` storage, clamp rewards and sensor inputs, cap serialized snapshots below 20 KiB, and make no network requests.

Race the generated ghost car in Neon Retro Racer. Toggle the Breakout ghost with `G` to let the same architecture learn paddle tracking from ball position and velocity. Persist separate local snapshots for each game and save on scene shutdown.

## Visual authoring studio

Represent safe mod logic as a bounded directed acyclic graph. Start traversal from an event node, reject cycles and dangling edge identifiers, map reachable hazard, score, effect, and patch nodes into the existing declarative schema, then validate the compiled manifest. Sign canonical bytes with a generated Ed25519 session key. Never evaluate node text or grant a graph access to DOM, storage, network, Phaser, or Web Audio objects.

## Neon Cyber-Caster

Split a seeded dungeon recursively through binary space partitioning. Connect room centers with orthogonal corridors and place a generated exit on a reachable floor. Cast 160 rays through the grid with DDA, correct fish-eye distance, shade wall strips with deterministic coordinate patterns, and use the ray depth buffer to occlude generated billboard sprites. Keep collision, hitscan combat, enemies, health, and floor progression inside the generated 640x480 scene.

## Advanced browser verification

Fix the Chromium viewport, reduced-motion preference, and random seed. Compare two paused Raycaster Canvas frames byte-for-byte. Compile and verify a signed graph package in the browser. Use Chromium heap instrumentation plus explicit collection around repeated scene launch and removal cycles, then reject growth above 16 MiB. Store no golden screenshot assets.

Current workstation measurements:

- Process 100,000 packed AABB pairs in 1.09 ms mean.
- Cast 100,000 DDA rays in 16.75 ms mean.
- Run 10,000 neural inferences in 6.98 ms mean.
- Pass 77 Vitest tests and 6 Playwright Chromium tests.
- Build 74 modules with a 2.91 kB initial entry, a 0.39 kB compute Worker, an 8.17 kB Raycaster chunk, a 66.07 kB bootstrap, and no Vite warning.

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

## Community creation tools

Mount `ModManagerController` outside the Phaser canvas so creation tools remain available without coupling untrusted data to a scene. Route drag-and-drop, local file, paste, and URL input through one `CommunityModState` validator before registering any manifest. Fetch remote documents only from credential-free HTTPS URLs, refuse redirects, omit credentials, enforce an eight-second timeout, and verify both declared and actual response size.

Render previews with a dedicated Canvas using validated hazard lanes and skin colors. Write labels through `textContent`. Never evaluate imported text, inject it as HTML, or expose DOM, storage, fetch, Phaser, or audio objects to a mod.

Store sound patches as bounded oscillator and envelope records. Resolve effect-slot assignments inside `AudioEngine`, then build the Web Audio graph from validated values. Keep oscillator, pulse, and noise sources procedural and release every source and filter node after its envelope ends.

## Neon Breakout

Generate each brick field from its stage number. Increase brick durability by tier, introduce indestructible walls from stage four, and place a boss formation every fifth stage. Compute paddle reflection from normalized contact position plus bounded paddle velocity, then normalize the result to preserve predictable ball speed.

Represent laser, multiball, sticky, and slow effects as timed or immediate state changes. Reuse generated textures and Phaser groups for every entity. Merge active mod hazards and two-color skins into the deterministic field before creating bodies.

## Bundle architecture

Keep `src/main.ts` limited to CSS, BIOS output, and one dynamic bootstrap import. Split all 11 games into separate dynamic entries. Isolate tracker code and Phaser into stable shared chunks. The production build measures:

- Initial JavaScript entry: 2.91 kB, 1.46 kB gzip.
- Deferred bootstrap: 53.62 kB, 16.24 kB gzip.
- Lazy game modules: 2.99-9.76 kB each.
- Deferred cached Phaser runtime: 1,352.40 kB, 351.52 kB gzip.

Set the Vite warning ceiling to 1.5 MB for the known Phaser runtime. Keep every application-owned entry below 500 kB and emit a manifest for bundle verification. Do not claim the Phaser framework itself became smaller.

Reference: [Vite production build guidance](https://vite.dev/guide/build)

## Direct WebRTC netplay

Exchange complete ICE offer and answer descriptions as bounded `ARC1` room codes through a user-selected trusted channel. Do not claim automatic global discovery without a signaling service. Load optional STUN and TURN records from validated local configuration and never place relay credentials in source control.

Send gameplay inputs through an unordered DataChannel with zero retransmissions. Send synchronization and lobby control records through a separate ordered reliable channel. Encode every input in 12 bytes with frame number, button mask, signed axes, and checksum. Refuse input sends when the channel buffer exceeds 64 KiB.

Retain 120 frames of cloned deterministic state. Predict missing remote input from the most recent confirmed frame. Restore the state before a late frame and replay local plus confirmed remote inputs through the current frame. Keep this generic rollback adapter separate from Phaser rendering so visual state cannot alter simulation results.

Reference: [W3C WebRTC Recommendation](https://www.w3.org/TR/webrtc/)

## Signed community repository

Canonicalize validated manifest objects by sorting keys and rejecting unsupported values. Calculate SHA-256 over the canonical UTF-8 bytes. Import a raw 32-byte Ed25519 public key and verify the 64-byte signature over the same canonical bytes. Compare the declared and actual content hashes before signature verification.

Fetch packages only over credential-free HTTPS. Refuse redirects, responses over 96 KiB, unknown envelope fields, modified content, invalid signatures, and invalid inner manifests. Cache only verified declarative data. Never evaluate or sandbox JavaScript from a package.

References: [MDN SubtleCrypto digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest), [MDN SubtleCrypto verify](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify)

## Neon Retro Racer

Project the road as four-pixel horizontal scanlines below a fixed horizon. Grow road width with squared depth and apply stage-derived curvature to the center position. Sort procedural trees, signs, lamps, traffic, and mod hazards from far to near. Keep the generated player car at the foreground layer.

Apply gear-specific speed limits, drag, braking, steering response, manual upshifts and downshifts, regenerating nitro, and depth-aware collision severity. Compose Midnight Highway through the existing four-voice tracker. Load no road, vehicle, billboard, or audio assets.

## Headless regression gate

Run Playwright against the production preview with a fixed viewport, reduced motion, seeded random output, and one Chromium worker. Compare two Canvas RGBA captures with a per-channel threshold and a changed-pixel ratio. Smoke-test the cabinet creation tools, netplay panel, and lazy Racer scene launch. Keep binary screenshots out of the repository.

Reference: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)

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

## CRT persistence and filter pipeline

Keep Phaser 4 in control of WebGL state. Install camera bloom as threshold, blur, and additive composition. Add managed barrel and vignette filters to the same external chain. Do not access the raw WebGL context.

Blend phosphor history through two reusable half-resolution Canvas surfaces. Read from one surface, decay it into the other, add the current Phaser canvas with screen composition, then swap references. Allocate no canvas or pixel buffer during a frame. Disable persistence under reduced motion.

Use three adaptive profiles:

- High: enable bloom, barrel, vignette, scanlines, chromatic fallback, and 0.14 persistence.
- Medium: disable bloom, retain light framing, and reduce persistence to 0.08.
- Low: disable all post-processing and hide the feedback surface.

Keep the combined GLSL contract in `src/graphics/shaders/crtShaders.ts` so a renderer-native custom filter can consume the same curvature, aberration, scanline, vignette, and previous-frame uniforms. Use the managed Phaser filter implementation in production to retain context restoration.

## Declarative mod runtime

Treat every mod as untrusted data. Parse no more than 64 KiB of JSON. Accept only API version 1, safe identifiers, semantic versions, bounded hazard records, two hex skin colors, known lifecycle events, and known instructions. Reject unknown properties at every nesting level.

Store at most 32 registered mods. Limit each stage patch to 64 hazards, each manifest to 16 hooks, and each hook to 16 instructions. Copy data at runtime boundaries. Expose only register, unregister, and list operations to the browser. Expose no evaluator, DOM, storage, network, Phaser, or audio graph object.

Merge validated hazards and skins into deterministic procedural stages. Apply score-scale instructions through `ProgressionDirector`. Execute existing procedural audio effects on stage-clear hooks. Keep native stage generation bounded at 80 total hazards after mod composition.

## Benchmark telemetry

Record frame durations in one 240-entry Float32Array ring. Ignore invalid and one-second samples. Calculate estimated FPS, mean frame time, p95 frame time, and the percentage of samples slower than the 55 FPS budget. Update the hidden BIOS overlay once per second. Type `B-I-O-S` to toggle it.

Current verification measures:

- Pass 41 tests across 15 files.
- Record 100,000 telemetry frames and calculate a snapshot at 1,141.9 ops/s with a 0.88 ms mean.
- Update 10,000 simultaneous particles at 1,108.8 ops/s with a 0.90 ms mean.
- Insert 5,000 spatial bodies and execute 500 queries at 540.7 ops/s with a 1.85 ms mean.
- Build 50 modules with a 2.87 kB initial entry, a 31.92 kB deferred bootstrap, and no Vite warning.

## Progression and persistence

Use `ProgressionDirector` for stage counters, combo expiry, score multipliers, power-up thresholds, and enemy behavior selection. Space Defenders selects patrol, chase, or barrage fire based on stage and distance. Clear a wave to advance without resetting the score.

Store the top ten scores per game and difficulty in the versioned v3 ledger. Migrate v2 best scores once. Sanitize initials before storage. Store cabinet theme and key bindings in a separate versioned preference record, validate every loaded value, and fall back to safe defaults after corrupt data.

## Verification targets

- TypeScript static analysis must pass with `erasableSyntaxOnly` enabled.
- Unit tests must cover animation transitions, collision queries, combo expiry, AI selection, effect plans, preference validation, and stable top-ten ordering.
- The spatial hash benchmark must insert 5,000 bodies and execute 500 regional queries per sample.
- The production Vite build must complete with zero errors.
