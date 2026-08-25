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
