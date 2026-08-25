# Deep Arcade Engine Architecture

## Voxel surface geometry and planetary LOD

Sample deterministic spherical density fields into bounded grids. Add seeded scalar variation and subtract up to 128 persisted crater fields. Generate one surface-net vertex per sign-changing cell by averaging all edge intersections, then connect neighboring cell vertices around sign-changing grid edges into indexed quads.

Select octree nodes from camera distance and projected node ratio. Cap depth at five in Odyssey and expose a continuous zero-to-one morph factor across the split band. Use the morph factor to blend parent and child geometry in capable renderers. Do not describe this mathematical transition as a universal zero-pop guarantee across every driver or frame budget.

Expose a 64-thread WebGPU density shader contract and retain the deterministic CPU mesher as the verified universal path. Cap one synthetic chunk at 40 cubed cells and 68,921 density samples. Persist crater parameters, not mesh assets.

## Binaural acoustic tracing

March a direct source-to-listener ray and up to 256 Fibonacci-distributed reflection rays through signed-distance geometry. Derive direct occlusion, bounded diffraction gain, propagation delay, and a generated 120 ms impulse response. Calculate interaural time difference from a procedural 8.75 cm head radius and interaural level difference from source azimuth.

Feed the result into the existing WASM phase generator and produce separate left and right sample blocks. Treat the procedural filter as a useful headphone approximation, not a measured listener-specific HRTF dataset or a full physical path tracer.

## Avatar DNA and cosmetic economy

Canonicalize at most 32 cross-game statistics and bind player, creation time, sorted stats, SHA-256 digest, and public key into an Ed25519 signature. Reject modified statistics, malformed identifiers, stale duplicate players, oversized gossip, and invalid signatures. Store one bounded local payload and gossip at most 32 opponent payloads over already connected manual ARC1 peers.

Derive hue, body segments, wing span, decal index, particle rate, and a cosmetic economy tier from digest bytes and aggregate performance. Treat SHA-256 as deterministic derivation and tamper evidence. Treat the Ed25519 signature as authorship by the included ephemeral key, not a central account identity or anti-cheat authority.

## Neon Odyssey

Integrate quaternion pitch, yaw, roll, forward thrust, lateral thrust, vertical thrust, angular velocity, fuel, and un-damped Newtonian drift at the scene timestep. Calculate altitude from the voxel planet radius and blend atmosphere continuously across 120 world units. Persist crater parameters and rebuild generated surface geometry after impacts.

Use the local neural director for encounter pressure and deterministic seeded cycles for commodity prices. Publish signed Odyssey statistics into Avatar DNA when the pilot exits. Generate the ship, stars, planet, terrain points, markets, audio, and cosmetics entirely at runtime.

Current workstation measurements:

- Generate one 32 cubed surface-net chunk in 12.97 ms mean, about 77 complete chunks per second.
- Select one planetary LOD octree in 0.0031 ms mean.
- Trace 64 acoustic rays and build an impulse response in 0.193 ms mean.
- Pass 121 Vitest tests and 17 Playwright Chromium tests.
- Build 110 modules with a 3.09 kB entry and a 10.80 kB Odyssey chunk.

## Competitive rollback and desync recovery

Advance local input immediately at a fixed simulation frame. Predict missing remote input from the latest validated remote frame. Store cloned deterministic states in a fixed ring, record which prediction each frame consumed, and compare late inputs against the consumed value. Restore the state before the first divergent frame and resimulate only the bounded affected range.

Validate each twelve-byte input checksum before simulation. Keep 240 frames by default and cap history at 600. Bundle up to sixteen recent remote frames so later packets repair isolated loss on the existing unordered WebRTC input channel. Treat rollback as latency masking, not latency removal. High ping expands prediction distance and correction risk even when local input remains immediate.

Test 360 fighter frames through 12 percent packet loss, 110 ms base latency, and 35 ms jitter. Deliver twelve-frame redundant bundles and require final state checksum equality with the zero-delay reference.

## WASM AudioWorklet DSP

Create the WebAssembly module from code-owned bytes at runtime and keep binary assets out of the repository. Use its floating-point phase primitive inside an `AudioWorkletProcessor`, then generate bounded square, triangle, and seeded noise output in the audio rendering thread. Send only clamped note parameters across the worklet port.

Render the browser-defined 128-sample quantum. At 48 kHz the quantum duration is 2.67 ms. Keep this distinct from `AudioContext.baseLatency`, output latency, operating-system mixing, and device latency. Never claim zero hardware latency from a synthetic block benchmark.

## Soft-body physics and destructible stages

Integrate up to 4,096 nodes with Verlet position history and solve up to 16,384 distance constraints without per-step node allocation. Pin selected anchors for capes and flags. Expose a 64-thread WGSL node integration kernel with the typed-array solver as the universal path.

Generate destructible cells by clipping the arena rectangle against the perpendicular bisector between each deterministic site pair. Assign fragment velocity from the impact vector and distance. Cap one shatter event at 32 cells.

## Neon Kombat

Advance the complete match state at exactly 60 Hz. Keep positions, health, timers, action frames, stun, combo count, and combo damage in deterministic numeric state. Define startup, active, and recovery windows for every attack. Apply blocking from the defender's away direction, chip damage, block-stun, hit-stun, pushback, and a 25 percent combo-scaling floor.

Build fighter limbs from bounded FABRIK chains, capes from the cloth solver, arena fractures from Voronoi cells, and music from the procedural tracker. Load no fighter sprites, stage textures, level data, models, or audio files.

Current workstation measurements:

- Resimulate 120 divergent frames in 0.195 ms mean.
- Render a 128-sample WASM block in 0.0009 ms mean.
- Step 4,096 cloth nodes in 1.27 ms mean.
- Shatter 32 Voronoi cells in 0.082 ms mean.
- Pass 111 Vitest tests and 15 Playwright Chromium tests.
- Build 102 modules with a 3.05 kB entry and a 10.85 kB Kombat chunk.

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
## Temporal rewind and causal branches

Record fixed-width `Int32Array` world state at 60 Hz in `TemporalRing`. Cap history at 1,800 frames. Store one full keyframe every 60 frames and encode intermediate snapshots as changed `Uint16` indices plus replacement `Int32` values. Rebase the oldest surviving delta into a full frame before its dependency leaves the ring. Reject gaps and oversize state schemas so rewind cannot silently decode partial history.

Record only input masks in `TimelineBrancher`. Spawn at most eight time clones from intervals shorter than the 30-second history and play each interval once. Sort physical bodies by timeline and entity identifier before collision resolution. Give the older timeline positional priority when two timelines overlap, then evaluate switches only after contacts settle. Keep the rule deterministic and avoid clone feedback loops that can rewrite already recorded input.

Use the allocation-free synthetic delta kernel for the 10,000-operation latency gate. Keep the complete archival benchmark separate because it includes typed-array copies, delta allocation, keyframe rebasing, and random-access reconstruction. Current workstation measurements:

- Run 10,000 synthetic delta compressions and resimulations in 0.1468 ms mean.
- Record and decode 10,000 complete compact states through the rolling archive in 18.5306 ms mean.
- Compress sparse eight-value history above 1 to 1 once the ring fills.

## Volumetric atmospheric scattering

Use wavelength-to-the-minus-four Rayleigh coefficients for molecular air and the Henyey-Greenstein phase function for directional Mie haze. Integrate density, optical depth, transmittance, and scattered luminance along each view ray. Keep a CPU reference integrator for deterministic tests and universal presentation.

Dispatch the production WGSL contract in 8x8 compute workgroups to an `rgba16float` storage texture when WebGPU exposes a usable adapter. Vary ray steps from 8-20 on low, 12-40 on medium, and 20-72 on high profiles. Remove two steps after frames above 18 ms and restore one after frames below 13 ms. Never infer WebGPU support from `navigator.gpu` alone. Request an adapter and report `UNAVAILABLE` when acquisition fails.

Current workstation measurement: integrate 10,000 CPU reference rays at 24 steps in 9.0975 ms mean. Headless Chromium exposes the API but returns no adapter on the verification workstation, so the browser gate validates the shader contract and compilation attempt without claiming GPU execution.

## WebTransport multiplexing

Use WebTransport only when the host application supplies a validated HTTPS endpoint backed by HTTP/3. Send packets below 1,200 bytes through QUIC datagrams for avatar telemetry and pace sends to at most 120 Hz. Prefix every packet with a bounded channel identifier, sequence, and payload length. Send replay and mod synchronization over a length-framed bidirectional stream with a 1 MiB application ceiling.

Fall back to the existing manual ARC1 WebRTC link when WebTransport is absent, the endpoint is not configured, connection setup fails, or no adapter service exists. Reuse the unordered zero-retransmit input DataChannel for framed telemetry and the ordered control DataChannel for reliable frames. Retain the existing 16 KiB serialized WebRTC control ceiling and cap one base64-encoded fallback payload at 12,000 bytes. Chunk larger replay or mod transfers at the caller. Do not claim a bundled HTTP/3 server, relay, discovery service, or automatic global mesh.

## Neon Chrono

Integrate platformer movement in fixed-point serializable state. Generate platforms, laser grids, slow fields, gravity zones, switch locations, and gate locations from the chamber index and seed. Slow both physics and tracker tempo inside localized fields. Drop tracker pitch by seven semitones in slow fields and by twelve semitones during rewind, then schedule a generated sawtooth tape signal without audio assets.

Rewind with `R`, branch the prior three seconds into a clone with `C`, jump with Space, and move with the shared Player 1 bindings. Let a live player or clone hold the generated switch while another timeline crosses the gate. Render fog and light shafts from the same scattering reference used by the shader tests.

Current verification:

- Pass 135 Vitest tests across 51 files and 19 Playwright Chromium tests.
- Keep deterministic Chrono simulation and causal collision output identical across repeated 600-frame browser runs.
- Build 117 modules with a 3.09 kB initial entry, a 12.51 kB lazy Chrono chunk, and the deferred 1,352.40 kB Phaser runtime.
## Non-Euclidean portal rendering and physics

Represent each portal with a position, normal, up vector, linked identifier, and bounded rectangular aperture. Convert points and vectors into the entry basis, rotate them through a half turn, and reconstruct them in the exit basis. Apply the same transform to avatar velocity, rigid-body momentum, projectile buffers, and gravity. Preserve vector magnitude and add an 80 ms crossing cooldown to prevent immediate threshold oscillation.

Plan recursive cameras only after validating both ends of a link. Emit a stencil mask pass, a recursively transformed view pass, and a depth restoration pass for every visible level. Use `depth24plus-stencil8`, increment-clamp during masks, preserve the reference during views, decrement-clamp during restoration, and cap recursion at four. Neon Paradox renders a generated Canvas representation of the same recursive plan because Phaser's universal Canvas path does not expose a WebGPU stencil target.

Current workstation measurement: plan 1,000 complete four-level portal frames in 26.4958 ms mean, or 0.02650 ms per frame plan.

## Compute BVH global illumination

Build a median-split flat BVH over at most 4,096 procedural axis-aligned surfaces. Traverse with a fixed 64-entry stack. Evaluate emissive contribution, direct-light visibility, Lambertian bounce, reflective metallic direction, and roughness jitter for up to three bounded bounces. Feed current color, depth, and motion into `TemporalDenoiser`. Clamp history to the current neighborhood and reject depth changes or motion above the stability threshold.

Dispatch the WGSL fallback in 8x8 workgroups when WebGPU supplies an adapter. The W3C WebGPU feature list does not define a standardized ray-tracing feature, so do not claim hardware RT execution. Detect a future `ray-tracing` feature string as experimental only and retain compute BVH traversal as the production contract. See [W3C WebGPU optional capabilities](https://www.w3.org/TR/webgpu/#optional-capabilities) and the [GPUFeatureName index](https://gpuweb.github.io/types/types/GPUFeatureName.html).

Current workstation measurement: trace 10,000 two-bounce CPU reference GI rays across a 256-box BVH in 60.9934 ms mean. Headless Chromium returns no adapter, so browser verification attempts shader compilation and reports `UNAVAILABLE` without claiming GPU timing.

## Local INT4 dialogue transformer

Generate every model parameter from a deterministic seed at runtime. Pack two signed four-bit weights per byte and apply a fixed scale during projection. Bound the model to 32 hidden dimensions, 64 feed-forward dimensions, two attention layers, 64 context tokens, a 64-token vocabulary, and 24 generated tokens. Keep the complete generated parameter set at 10,240 bytes.

Tokenize sanitized local NPC, Avatar DNA tier, victories, stealth lighting, room, and objective context. Apply quantized query, key, value, output, and feed-forward projections with bounded softmax attention. Sample deterministically from the top six logits. Make no API calls, download no model, and claim no general-purpose language understanding or pretrained knowledge.

Compile the INT4 projection WGSL in 64-thread workgroups when WebGPU supplies an adapter. Retain the TypeScript quantized reference path for universal execution and deterministic tests. Current workstation measurement: generate 100 CPU reference dialogue tokens in 35.3797 ms mean, or 2,826.5 tokens per second. Do not label this CPU result as WebGPU throughput.

## Neon Paradox

Generate a bounded reflective heist room, obstructions, tesseract vertices, guards, and objective from the room seed. Move in first person with the shared bindings, turn with arrows, and throw alternating portal anchors with Space. Transform position, velocity, and gravity through linked anchors. Derive player shadow from the same two-bounce BVH lighting path used by tests. Let guards acquire only nearby players above the lighting threshold, then decay alert while the player remains in shadow.

Render recursive portal frames, perspective floor lines, depth-scaled guards, generated objectives, shadow overlays, and context-conditioned local dialogue without image, model, level, or audio assets. Advance into a new deterministic heist room after collecting each objective.

Current verification:

- Pass 148 Vitest tests across 55 files and 21 Playwright Chromium tests.
- Preserve momentum magnitude through oriented portals to six decimal places in browser diagnostics.
- Render byte-identical paused recursive portal frames across consecutive screenshots.
- Build 128 modules with a 3.09 kB entry, a 22.11 kB lazy Paradox chunk, and the deferred 1,352.40 kB Phaser runtime.

## WebXR, world CRDT, and generated motion matching

Treat WebXR session capability as device-owned state. Request `immersive-vr` or `immersive-ar` only from a user gesture, use `XRSession.requestAnimationFrame`, consume every device-supplied `XRView`, and never synthesize a headset pose. Select the supported refresh rate nearest the requested 90 or 120 Hz target when the runtime exposes dynamic frame-rate control. Feed measured frame time into a bounded 0.5 to 1.0 quality scale. Convert grip poses, target buttons, wrists, thumb tips, and index tips into controller state, pinch state, and FABRIK hand targets. Keep desktop rendering available when WebXR is absent.

Represent shared voxel, body, portal, and arcade records in a last-writer-wins map ordered by logical counter and actor identifier. Bind each actor identifier to the SHA-256 digest of its Ed25519 public key. Verify canonical operations before merge, reject malformed shapes, cap verified batches at 4,096 operations, cap each actor at 250,000 keys, and cap a world at 1,000,000 keys. Send signed operations in bounded reliable chunks through `UnifiedTransport`, which selects an application-supplied HTTPS WebTransport endpoint or falls back to an already established WebRTC peer. Do not claim global discovery or protection from a malicious holder of a valid private key.

Generate 4,096 locomotion vectors and twelve-joint poses from a deterministic seed. Project eight normalized inputs into six matrix features, retain a sixteen-item shortlist, score exact velocity, terrain, turn, intent, and phase distance, and exponentially blend the selected pose. Store no model, mocap, texture, level, or audio asset.

## Neon Nexus

Generate thirteen flagship arcade cabinets around a persistent local world. Apply signed crater edits to the CRDT, save the bounded snapshot locally, and broadcast edits after an application attaches `UnifiedTransport`. Update the generated motion matcher and soft-body field each frame. Attach established one-track WebRTC voice streams to the existing HRTF spatial mixer without requesting media automatically. Enter supported immersive VR with `V`, immersive AR with `B`, and the nearest cabinet with `E`.

Current verification:

- Pass 160 Vitest tests across 59 files and 23 Playwright Chromium tests.
- Merge 100,000 concurrent voxel edits into two replicas in 432.14 ms mean and verify identical digests.
- Plan 100,000 dual-view XR frames in 41.74 ms mean.
- Match one query against 4,096 generated locomotion vectors in 0.1750 ms mean.
- Build 138 modules with a 3.17 kB entry, a 15.19 kB lazy Nexus chunk, and the deferred 1,352.40 kB Phaser runtime.

## Quantum game-state simulation

Model a game object's uncertainty as two to sixteen categorical branches with normalized complex amplitudes. Apply phase-only evolution so total probability remains one. Collapse an object only when the supplied camera position falls inside the observation range. Select a branch through deterministic seeded sampling and correlate every object in the same bounded entanglement group to that branch index.

Treat this as a gameplay abstraction. Do not describe it as a physical macroscopic quantum computer, a simulation of decoherence, or faster-than-light networking. Apply the correlated branch immediately inside one deterministic simulation and publish a bounded `BODY` record through the existing CRDT. Let remote peers converge after transport delivery rather than claiming instantaneous network propagation.

Current workstation measurement: calculate 10,000 independent eight-branch camera collapses in 34.9470 ms mean, or 0.003495 ms per collapse.

## Genetic ecosystems and Worker evolution

Represent each organism with eight normalized traits for heat, moisture, fluid, elevation, mobility, fertility, size, and cooperation. Score adaptation against bounded terrain gradients. Select from the leading population quarter, blend two parents per child, apply deterministic bounded mutation, and retain fitness and diversity metrics. Cap one population at 4,096 genomes and validate every restored trait.

Transfer a copied `Float32Array` into a module Worker and transfer ownership of the evolved buffer back. Retain the same CPU kernel when Workers are unavailable. Publish a 64-thread WGSL fitness contract for capable WebGPU runtimes, but retain CPU selection, crossover, and mutation as the deterministic universal path.

Current workstation measurement: evolve 4,096 eight-trait genomes in 3.6237 ms mean.

## Local INT4 swarm society

Instantiate at most 32 independently seeded 10,240-byte INT4 transformers. Sanitize one topic, run one bounded statement per agent, and apply explicit `TRADE`, `ALLY`, `OBSERVE`, or `MIGRATE` state transitions. Track wealth, trust, influence, factions, hierarchy, and plurality consensus in deterministic data structures. Reuse the capability-gated 64-thread INT4 WebGPU projection compiler and retain universal CPU inference.

Treat generated text and policy as procedural game behavior, not general intelligence, understanding, autonomous governance, or factual reasoning. Download no model and call no external service. Current workstation measurement: create and run one complete 24-agent eight-token conversation round in 107.03 ms mean.

## Neon Genesis

Render a generated universe from mathematical spirals, lifeform traits, resource amplitudes, inherited cabinets, and terrain gradients. Move with `WASD`, deform the local voxel field with Space, and observe the nearest correlated resource with `Q`. Evolve 256 organisms in a module Worker while a 24-agent local society updates civilization dialogue and policy independently. Reference fifteen prior engine milestones without importing image, audio, model, or level assets.

Current verification:

- Pass 174 Vitest tests across 63 files and 25 Playwright Chromium tests.
- Preserve probability normalization and correlated branch indices through deterministic tests.
- Complete 1,000 ecosystem generations with bounded traits and mean fitness above 0.5 in unit and browser gates.
- Confirm actual module Worker evolution in headless Chromium and accept `COMPILED` or `UNAVAILABLE` from the WebGPU capability probe.
- Render byte-identical paused Neon Genesis frames across consecutive screenshots.
- Build 145 modules with a 3.17 kB entry, a 1.74 kB Genetic Worker, a 15.24 kB lazy Genesis chunk, and the deferred 1,352.40 kB Phaser runtime.

## WebCodecs broadcast pipeline

Probe `VideoEncoder.isConfigSupported` in AV1 then H.264 order and treat absence as a normal capability result. Capture each Phaser canvas frame into a short-lived `VideoFrame`, submit it to a realtime encoder, close the frame immediately, and stop accepting captures when the encoder queue exceeds five frames. Feed queue depth and frame time into a bounded controller that reduces bitrate under pressure and raises it only after thirty calm samples. Expose a `MediaStreamAudioDestinationNode` so the existing procedural Web Audio graph can be tapped without microphone access.

Frame encoded audio and video chunks in the NSB1 application envelope with track, keyframe, codec, timestamp, duration, and bounded payload metadata. Treat this as application framing, not a standardized MP4 or WebM container. WebCodecs does not provide container muxing and does not guarantee a zero-copy canvas-to-encoder path, so retain those as explicit non-claims. Current workstation measurement: frame 1,000 1 KiB encoded chunks in 2.9146 ms mean.

## Masterless bounded compute grid

Let every connected application peer instantiate the same deterministic coordinator. Accept only named `GENETIC_FITNESS` and `GRADIENT_SUM` kernels with finite numeric arrays, cap jobs at 131,072 values, cap shards at 16,384 values, and cap transport envelopes at 1 MiB. Sort established peers by identifier before assignment. Remove a peer after a rejected or malformed shard result, retry the shard on remaining peers, and complete locally if no peer remains.

Do not accept JavaScript, WebAssembly, shader text, URLs, or arbitrary functions in a grid envelope. Reuse application-established WebRTC or WebTransport sessions because neither transport supplies global discovery or a public worker marketplace. Current workstation measurement: reduce 100,000 values over four local peer adapters in 2.6841 ms mean.

## Safe DSL and raw WebAssembly emission

Parse a line or semicolon-delimited i32 stack language containing `input`, `const`, arithmetic, bitwise operations, shifts, `drop`, and `return`. Cap source at 256 KiB, instructions at 16,384, and stack depth at 256. Reject unknown syntax, invalid operands, stack underflow, trailing instructions, and returns with anything other than one value.

Emit the WebAssembly magic and version followed by type, function, export, and code sections using signed and unsigned LEB128 encodings. Export one `run(i32) -> i32` function and emit no import, table, memory, global, element, or data sections. Validate every module before execution and instantiate it with an empty import object. Current workstation measurement: compile and validate a 10,000-line safe script in 4.0842 ms mean.

## Neon OS

Render a generated three-window workstation through Phaser's managed universal renderer. Keep the graphical window layout deterministic and compile a minimal WebGPU compute contract only when the browser supplies an adapter. Accept bounded terminal commands for help, clearing output, safe DSL execution, window inspection, and numeric grid submission. Display capability outcomes without treating `UNAVAILABLE` as a failure.

Current verification:

- Pass 188 Vitest tests across 67 files and 27 Playwright Chromium tests.
- Compile exactly 10,000 safe DSL instructions and execute an import-free WebAssembly module.
- Recover a rejected distributed shard and preserve a deterministic numeric reduction.
- Exercise WebCodecs canvas capture when supported and accept an explicit unsupported result otherwise.
- Render byte-identical paused Neon OS frames across consecutive screenshots.
- Build 153 modules with a 3.17 kB entry, a 12.28 kB lazy Neon OS chunk, and the deferred 1,352.40 kB Phaser runtime.

## Deterministic neural terrain

Generate network weights from a seed and execute two bounded feed-forward layers with signed integer arithmetic. Quantize spatial coordinates to sixteenth-unit cells, clamp inputs and intermediate activations, and classify five biome logits before emitting elevation, erosion, and mineral channels. Keep authoritative outputs in `Int16Array` and `Uint8Array` chunks. Use the same hash, weights, shifts, clamps, and packed output fields in the 64-thread WGSL kernel.

Do not promise bit-identical results from unrelated floating-point neural runtimes. Preserve identical authoritative output by using fixed-point integer operations with bounded ranges. Apply any later visual interpolation only after the deterministic world fields exist. Current workstation measurement: generate 65,536 CPU reference terrain samples in 27.1218 ms mean, or about 2.416 million samples per second.

## Recursive path lighting

Trace up to 1,024 generated sphere primitives with at most eight bounce steps. Accumulate emissive radiance, rough diffuse or metallic reflection, Schlick dielectric selection, refraction by index of refraction, throughput attenuation, and bounded Russian roulette after the fourth contact. Retain the CPU reference for deterministic tests and low-capability devices. Compile the WebGPU shader in 8x8 workgroups only after adapter discovery.

Apply a depth and normal weighted 3x3 spatial filter before bounded temporal feedback. Clamp temporal history to the current sample neighborhood. Treat this as noise reduction, not guaranteed film-quality reconstruction. WebGPU defines portable compute pipelines but does not standardize hardware ray-tracing acceleration. Label a future `ray-tracing` feature string experimental and never claim hardware execution from the current compute path. Current workstation measurement: trace 100,000 four-bounce CPU reference paths in 66.7981 ms mean, or about 1.497 million primary paths per second. Do not describe this CPU result as GPU throughput or a universal 60 FPS guarantee.

## Authenticated quorum world ledger

Fix membership at four to sixteen Ed25519 identities and require `floor(2N/3) + 1` unique valid votes. Bind every bounded payload to SHA-256, bind every proposal to its sequence and previous root, and derive the next root from the prior root, sequence, and authenticated proposal hash. Reject unknown members, duplicate votes, modified bytes, insufficient quorums, oversized payloads, and proposals that no longer extend the current root. Verify the complete chain before accepting a restored snapshot.

Treat the ledger as an authenticated quorum log inside an application-supplied peer group. It provides tamper evidence, signer attribution, deterministic finalization, and stale-fork rejection. It does not provide automatic peer discovery, Sybil resistance, durable replication, proof that a signed claim is physically true, or a complete Byzantine consensus protocol under asynchronous partitions. Store only bounded safe-mod bytes or broadcast segment digests, not executable host code or complete media streams. Current workstation measurement: create, sign, verify, and commit 100 three-vote records in 182.19 ms mean.

## The Singularity

Present The Singularity as the twenty-fourth selectable game and the synthesis of seventeen established engine architectures. Render a generated path-lit world and fixed-point biome monitor, collapse one local quantum gate deterministically, distribute bounded mineral fitness work, run eight local INT4 society agents, and commit one authenticated world record. Open Neon OS with `O`, generate another seeded world with Space, and request immersive VR with `X` only when WebXR reports support.

Current verification:

- Pass 201 Vitest tests across 71 files and 29 Playwright Chromium tests.
- Preserve terrain, light, and quantum checksums across identical seeds.
- Reject tampered proposals, minority votes, and stale state-root forks.
- Accept `COMPILED` or `UNAVAILABLE` from neural terrain and path-tracing WebGPU probes.
- Render byte-identical paused Singularity frames across consecutive screenshots.
- Build 160 modules with a 3.17 kB entry, a 17.50 kB lazy Singularity chunk, and the deferred 1,352.40 kB Phaser runtime.

## One-time hash-based state attestations

Generate 512 independent 32-byte secrets, hash each secret into a 16 KiB public key, hash the canonical state-root message to 256 bits, and reveal one secret from each pair according to those bits. Verify all 256 revealed values against their selected public hashes. Bind the actor identifier to SHA-256 of the complete public key. Erase private bytes immediately after signing and refuse a second signature from the same signer.

Treat this Lamport SHA-256 construction as a bounded one-time hash signature for local engine research. Do not label it ML-DSA, SLH-DSA, a NIST standardized implementation, audited production cryptography, or a reusable identity. Lamport signatures expose half of every secret pair and become unsafe when a key signs more than one message. Keep Ed25519 for compact quorum proposals and votes, then optionally attach one Lamport proof to a finalized root. Current workstation measurement: verify one 8 KiB state signature against one 16 KiB public key in 10.2269 ms mean.

Use standardized implementations of [NIST FIPS 204 ML-DSA](https://csrc.nist.gov/pubs/fips/204/final) or [NIST FIPS 205 SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final) for production post-quantum deployments after selecting an audited library and migration policy.

## Dynamic spatial peer sharding

Quantize chunk coordinates into bounded spatial regions and score every connected peer with deterministic weighted rendezvous hashing. Select up to the requested replication count without duplicate owners. Preserve most assignments when one peer leaves instead of remapping every region. Route validated `SHARD_STATE` envelopes through the reliable `MOD` channel on an application-established WebTransport or WebRTC session.

Represent millions of chunks virtually by coordinate and seed. Do not allocate, transmit, or retain one million resident voxel chunks. Do not claim automatic discovery, persistent hosting, global availability, or consensus from the assignment function. Current workstation measurement: calculate two-owner assignments for one million virtual chunk coordinates over eight peers in 989.72 ms mean.

## Fixed-weight neural texture detail

Generate a bounded low-resolution RGBA surface, bilinearly reconstruct a 2x or 4x output, and feed color gradients, Laplacian response, subpixel phase, and seeded detail into a small fixed-weight rectified network. Accept a caller-owned output array to eliminate per-frame output allocation. Sample the resulting detail field when calculating path-traced material throughput. Compile the corresponding 8x8 WGSL path only after WebGPU adapter discovery.

Treat this as deterministic procedural texture synthesis. Do not call it DLSS, FSR, a trained super-resolution model, temporal reconstruction, or proof of real-time performance. The current CPU reference allocates no new output when a pool is supplied but still requires the source and output memory. Current isolated workstation measurement: upscale one 128-square input into one 512-square texture in 33.3362 ms mean. Headless Chromium reports `COMPILED` or `UNAVAILABLE`; record no GPU timing without a supplied adapter.

## Relativistic physics and lensing

Calculate Lorentz gamma, rest-length contraction, longitudinal Doppler ratio, Schwarzschild radius, exterior gravitational time factor, combined proper-time delta, and weak-field light deflection with SI constants. Reject or capture inputs at and inside the event horizon where the exterior formulas no longer apply. Use a separate normalized light speed for stable arcade integration and label displayed velocity as a gameplay percentage rather than SI measurement.

Map gravitational lens UVs radially in a deterministic CPU reference and publish an 8x8 WebGPU compute contract that captures the horizon, bends exterior samples, and applies a generated directional color shift. Treat the shader as an arcade weak-field visualization, not a numerical general-relativity solver. Current workstation measurements: step 100,000 normalized combat frames in 18.8338 ms mean and map one 512-square CPU lensing field in 14.8686 ms mean.

## Neon Event Horizon

Present Neon Event Horizon as game twenty-five and the synthesis of exactly eighteen established engine architectures. Render a generated accretion field, black-hole silhouette, neural hull microdetail, and a time-dilated player ship. Keep velocity below 0.95 of the normalized gameplay light speed. Assign the active world coordinate to two deterministic shard owners and authenticate diagnostics with one Lamport state proof. Compile neural texture and lensing WGSL only when WebGPU is available.

Current verification:

- Pass 220 Vitest tests across 77 files and 31 Playwright Chromium tests.
- Reject modified Lamport messages, modified signatures, and one-time key reuse.
- Converge sharding regardless of peer insertion order and limit remapping after peer churn.
- Match Lorentz gamma, contraction, Doppler, and Schwarzschild time-factor reference values.
- Accept `COMPILED` or `UNAVAILABLE` from neural texture and lensing WebGPU probes.
- Render byte-identical paused Event Horizon frames across consecutive screenshots.
- Build 167 modules with a 3.17 kB entry, an 8.66 kB lazy Event Horizon chunk, a shared 9.15 kB path-tracer chunk, and the deferred 1,352.40 kB Phaser runtime.

## Procedural anisotropic Gaussian splatting

Store each generated splat in sixteen packed Float32 values for center, opacity, scale, rotation, color, and lighting terms. Cap one cloud at 100,000 splats. Generate ground cover, trunks, and canopies from a seeded xorshift stream without image, mesh, model, or point-cloud assets. Project a bounded sample through a deterministic camera, reject near and off-screen points, and order visible splats back to front for the universal CPU renderer.

Publish an instanced WebGPU render pipeline with one quad per splat, storage-buffer records, exponential Gaussian falloff, premultiplied alpha, and fixed-function blending. Compile it only after adapter discovery. Treat this as procedural anisotropic Gaussian rendering, not captured-scene 3D Gaussian Splatting reconstruction or a promise of photorealism. The current Neon Epoch scene uses the CPU projection path. Record no GPU throughput without an available adapter and actual command submission timing.

Current workstation measurement: project, cull, and depth-order 4,096 sampled records from a 65,536-splat cloud in 1.0686 ms mean. Do not infer a universal frame rate from this isolated CPU benchmark.

## Scalar and 128-bit SIMD WebAssembly physics

Emit two raw import-free WebAssembly modules from code-owned bytes. Let the scalar module process one Float32 pair per loop and let the SIMD module process four pairs through `v128.load`, `f32x4.sub`, `f32x4.mul`, `f32x4.add`, and `v128.store`. Validate SIMD support before instantiation. Reuse one bounded linear memory and pad only the SIMD tail to four lanes.

Use the SIMD distance stage for circle separation, gravity radius terms, and velocity magnitude terms. Finish inverse-distance gravity and Lorentz square-root terms with deterministic scalar operations because baseline SIMD has no portable exact reciprocal instruction. Preserve the TypeScript reference and assert Float32 equality in tests. Treat the benchmark as a local observation, not a guaranteed speedup on every browser or CPU.

Current workstation measurements for 65,536 collision pairs:

- Run scalar Wasm in 0.3744 ms mean, about 2,671 batches per second.
- Run 128-bit SIMD Wasm in 0.3561 ms mean, about 2,808 batches per second.
- Observe 1.05 times throughput in this isolated run.

## Shared spatial AudioWorklet pipeline

Allocate a single-producer and single-consumer SharedArrayBuffer ring only when the browser reports cross-origin isolation. Advance read and write counters with Atomics and never block the audio rendering thread. Transfer bounded Float32 message blocks through the AudioWorklet port when shared memory is unavailable. Serve Vite development and preview pages with COOP and COEP headers so the shared path can be tested in Chromium.

Calculate propagation delay from distance divided by a bounded speed of sound. Apply a clamped classical radial Doppler ratio and the established gameplay time factor. Treat this as a procedural spatial approximation, not mathematically perfect acoustics, a listener-specific HRTF, or proof of hardware output latency. The Web Audio rendering thread processes browser-defined render quanta independently of the main control thread.

Current workstation measurement: process one 128-sample delayed and pitch-shifted block in 0.0041 ms mean inside the isolated TypeScript delay-line benchmark. Keep this separate from AudioWorklet scheduling, `AudioContext.baseLatency`, operating-system mixing, and device latency.

## Neon Epoch

Present Neon Epoch as game twenty-six and the synthesis of exactly nineteen established engine architectures. Traverse a 24,000-splat generated terrestrial field with changing rain, wind, cloud cover, and temperature. Evolve a mass-conserving cellular water field and render every environment, weather streak, traversal marker, sound, and HUD element at runtime.

Keep the universal CPU splat renderer active in the Phaser scene and expose capability diagnostics for WebGPU compilation, Wasm SIMD validation, cross-origin isolated audio allocation, fluid conservation, and stable seeded checksums. Do not describe the stylized procedural output as photorealistic or captured reality.

Current verification:

- Pass 233 Vitest tests across 81 files and 33 Playwright Chromium tests.
- Match scalar TypeScript, scalar Wasm, and 128-bit SIMD collision output exactly at Float32 precision.
- Allocate the SharedArrayBuffer audio ring in cross-origin isolated Chromium and retain message fallback elsewhere.
- Preserve deterministic splat, fluid, weather, and physics checksums and byte-identical paused Epoch frames.
- Build 173 modules with a 3.17 kB entry, a 4.02 kB spatial AudioWorklet support chunk, a 13.81 kB lazy Neon Epoch chunk, and the deferred 1,352.40 kB Phaser runtime.
