## [Unreleased]

### Added
- Add a README gallery captured directly from the current lobby, Neon Vector, Tetris Pulse, Neon Cyber-Caster, Neon Danmaku, and Neon Epoch runtime surfaces.
- Add a loopback-only hardened Compose template for Fun Zone web hosting.
- Add a user-initiated Fullscreen control to Cabinet Control with standard browser API detection, failure-safe state reporting, and no new dependency or asset.
- Add normalized controller menu controls for Pause and Cabinet Control. D-pad or left stick navigates, the south face button confirms, and east face button or Select returns.
- Add controller-only high-score initials entry with two-axis slot and character navigation, south-button confirmation, and east-button or Select slot return.
- Add a shared controller-aware Game Over overlay for Bird, Frogger, Cyber Chasm, Minesweeper, Pixel Runner, Neon Breakout, Neon Asteroids, Neon Retro Racer, and Neon Cyber-Caster.
- Route Snake Evolution, Tetris Pulse, and Space Defenders loss states through the shared Game Over overlay for consistent controller restart and high-score handling.
- Add controller access to the Achievements overlay. Use the north face button from the lobby to open it, then the east face button or Select to close it.
- Add a safe Game Over exit path. Use east face button, Select, or Escape to stop the finished game and return to the lobby.

### Changed
- Install the native Tauri Linux development libraries before locked Cargo analysis in the GitHub release gate.
- Quote the Vitest browser-tree exclusion so Linux CI and Windows development discover the same 96 unit-test files.
- Rebrand the public product, desktop package, PWA manifest, runtime cabinet title, and delivery labels as BiosSystem Neon Arcade while retaining the existing repository slug and container publication path.
- Block controller Start pause input while a marked DOM utility panel is visible.
- Close visible DOM utility panels through the shared Escape priority path before active games can receive Pause or legacy lobby navigation.
- Route keyboard Escape through shared Pause for every active game and exclude foreground overlays, including Game Over, from global pause interception.
- Preserve active difficulty and multiplayer mode when restarting a game from Pause.
- Route lobby controller actions through the shared InputManager frame instead of a second scene-local gamepad poll.
- Route Player 1 controller direction and face-button transitions through an opt-in compatibility bridge for the keyboard-owned Snake, Tetris, Frogger, Brave Bird, Cyber Chasm, and Neon Singularity replicas, then release synthetic input on scene shutdown.
- Add a browser regression that launches Snake with a normalized connected controller and verifies the legacy keyboard path receives its direction.
- Track compatibility bridge owners and overlay suspensions independently so pausing a legacy game releases synthetic keys, avoids duplicate menu navigation, and resumes the original bridge after the overlay closes.
- Reserve Start for Cabinet Control from the lobby and reserve the south face button for selection so a controller cannot select and back out from one face-button press.

## [2.0.0] - 2026-08-26
### Changed
- Gate every tag-triggered container and desktop publication behind deterministic npm installation, TypeScript analysis, 265 Vitest tests, the production build, 38 Chromium regressions, four Firefox and WebKit smoke checks, a live container shell and header smoke test, and locked Cargo analysis.
- Add a production Nginx configuration with CSP, cross-origin isolation, resource policy, MIME protection, frame denial, permissions policy, no-referrer behavior, PWA navigation fallback, immutable asset caching, and an unprivileged runtime.
- Exclude the 2.5 GB Rust target tree, installed Node modules, generated bundles, browser reports, tests, documentation, and local scripts from the web container context.
- Extract the immutable 27-entry lobby catalog and four-tier difficulty contract into a dedicated tested module, then remove the obsolete lobby-owned Phaser CRT filters and `Ctrl+Shift+C` preference path that conflicted with the standalone CRT pipeline.
- Persist the exact newly verified score claims returned by gossip merging instead of persisting the highest N claims, preventing accepted low-rank peer scores from disappearing after restart.
- Enforce the 4,096-claim IndexedDB ceiling on disk, prune the oldest logical clocks inside the write transaction, and hydrate retained claims newest-first through an indexed cursor.
- Bind new connected-score identifiers to signer key fingerprints, prevent simultaneous cross-peer claim collisions, reject negative logical clocks, and relay the newest deterministic 256-claim window.
- Hydrate up to 4,096 persisted score claims through verified 256-claim batches instead of passing the complete local database through the wire-envelope limit and losing every score above 256 records.
- Pin the Node and Nginx container stages, run Nginx as fixed UID 10001, add a live health probe, and provide a localhost-only read-only compose profile for dedicated Fun Zone hosting.
- Route semantic touch controls through paired WASD and arrow events so keyboard-owned games respond on phones and touch laptops, then sweep all 27 registered arcade scenes for launch-time failures.
- Enable the Tauri production CSP while retaining the minimum blob, Wasm, worker, asset protocol, IPC, HTTPS, and secure WebSocket sources required by generated engine systems.
- Add the missing Cargo lockfile, use `npm ci` in containers and release jobs, compile an 8.54 MB locked Windows release binary, and synchronize web, Tauri, and Rust versions at 2.0.0.
- Add efficient Firefox and WebKit smoke coverage for cabinet startup, runtime delta protection, persistent controls, IndexedDB, local storage, and safe canvas rendering fallbacks.
- Replace stale wiki and security descriptions with the current 26-game architecture, standalone canvas CRT pass, local persistence boundaries, minimal Tauri shell, release policy, and verified platform scope.
- Replace the compact connected-score list with a responsive local-first leaderboard center that merges persistent device boards and Ed25519-verified connected-peer claims, filters by game and source, and exposes cabinet, L-key, and Escape controls.
- Add enumerable score-board snapshots, deterministic cross-source ranking, live refresh after score submission, and explicit device or peer provenance without inventing an unsupported central service.
- Preserve the optional bios-system.net dashboard as a pending integration until an authenticated endpoint, request schema, and response schema are published.
- Add a responsive Neon Epoch memory-bank drawer with one autosave and three manual slots, generated thumbnail previews, saved coordinates and timestamps, keyboard access, and save, load, or delete controls.
- Share one IndexedDB or isolated-memory save-state store between the active scene and cabinet UI, enable commands only after Wasm physics initialization, and detach the scene bridge on shutdown.
- Extend version-one save states with optional validated WebP or PNG data previews capped at 128 KiB while preserving existing states without thumbnails.
- Generate a content-versioned service worker from every production build, precache the complete 68-key arcade shell including all lazy game chunks, and remove only superseded BiosSystem cache versions.
- Add a standalone web app manifest, defer secure-context worker registration until window load, keep development and Tauri startup non-blocking, and expose offline registration state through document diagnostics.
- Serve known build assets cache-first by canonical pathname and use the cached app shell only when navigation fails, preserving normal online update checks while enabling complete play after one successful installation.
- Guard the active Phaser animation callback so every scene, timer, tween, and physics step receives a finite delta capped at 50 ms while valid 60 Hz, 120 Hz, 144 Hz, and VRR intervals remain unchanged.
- Install the Phaser delta guard after the runtime binds its real step callback, expose the configured 50 ms cap for browser diagnostics, and restore the original callback during teardown.
- Add a modular WebGL CRT post-process surface with nearest-neighbor frame upload, compile and runtime fallback, and uniform-driven scanlines, threshold bloom, barrel curvature, chromatic aberration, phosphor shadow mask, and edge vignette stages.
- Add Clean Pixel, Arcade CRT 1980s, Trinitron 1990s, and Bypass runtime presets with adaptive quality reductions for expensive shader controls.
- Add selectable 4:3 and 16:9 display frames with strict integer source scaling, centered letterbox or pillar space, and a bounded fractional fit only when the container cannot hold one source-resolution pixel scale.
- Clamp invalid or long core-loop deltas to 50 ms, preserve native 60 Hz, 120 Hz, 144 Hz, and VRR intervals, and cap fixed-step catch-up at four updates per animation frame.
- Replace the legacy CRT toggle in Cabinet Control with live CRT preset and display aspect selectors while preserving the earlier boolean preference as a migration fallback.
- Add unit and Chromium coverage for preset uniforms, shader compile failure, WebGL fallback, integer viewport math, high-refresh delta bounds, synchronized source and post-process surfaces, and CPU submission timing.
- Add one animation-frame Gamepad API sample with canonical standard-layout bitmasks, press and release edges, radial stick deadzones, analog trigger thresholds, PlayStation and Xbox family labels, and a bounded raw DualShock face-button fallback.
- Route local multiplayer and pause controls through the shared controller frame so scenes do not issue duplicate `navigator.getGamepads()` calls.
- Add a versioned IndexedDB save-state pipeline for up to 16 MiB of Wasm memory, four player transforms, and Neon Epoch seeds with scheduled capture, asynchronous SHA-256 integrity checks, isolated memory fallback, autosaves, and shutdown persistence.
- Add Wasm physics memory copy and restore operations plus Neon Epoch session restoration through the new save-state adapter.
- Add unit and benchmark coverage for controller mappings, deadzones, bitmask edges, hot-unplug behavior, IndexedDB failure fallback, validation bounds, and live SIMD memory restoration.
- Configure direct Vitest invocations to exclude Playwright browser specifications while retaining the dedicated Playwright regression gate.
- Add deterministic procedural anisotropic Gaussian point clouds with generated terrain, trunk, and canopy distributions, back-to-front CPU projection, stable checksums, a 100,000-splat ceiling, and an instanced WebGPU alpha-blending pipeline contract.
- Add import-free scalar and 128-bit SIMD WebAssembly physics modules with four-lane collision separation, batched gravity distance stages, relativistic time factors, typed-memory reuse, capability validation, and scalar fallback.
- Add a cross-origin isolated spatial audio path with a lock-free SharedArrayBuffer ring, message-block fallback, AudioWorklet rendering, bounded speed-of-sound delays, Doppler ratios, and fixed delay-line storage.
- Add Neon Epoch as the twenty-sixth game and a synthesis of nineteen established architectures with generated volumetric flora, traversal, dynamic rain and wind, mass-conserving fluid, and procedural audio.
- Add COOP and COEP development and preview headers so capable browser sessions can allocate SharedArrayBuffer storage safely.
- Add unit, benchmark, and Playwright coverage for deterministic splats, scalar and SIMD Wasm equivalence, gravity and time batches, audio allocation, stable paused Epoch rendering, and cross-origin isolation.
- Add Lamport SHA-256 one-time state attestations with 16 KiB public keys, 8 KiB signatures, automatic secret erasure, tamper rejection, and explicit key-reuse prevention.
- Extend the quorum ledger with optional one-time hash-based root attestations while retaining Ed25519 proposal and vote compatibility.
- Add deterministic weighted rendezvous sharding for one million virtual chunk coordinates, bounded replication, peer-churn movement measurement, validated shard envelopes, and reliable WebTransport or WebRTC routing through the existing transport mux.
- Add a pooled fixed-weight neural texture synthesizer with deterministic 2x or 4x edge detail, caller-owned output storage, path-traced material modulation, and an 8x8 WebGPU compute contract.
- Add special-relativity factors, Schwarzschild time dilation, weak-field light deflection, normalized near-light-speed combat physics, and a generated WebGPU gravitational lensing contract.
- Add Neon Event Horizon as the twenty-fifth game and a synthesis of eighteen established architectures with relativistic combat, generated hull microdetail, spatial shard ownership, and one-time hash-authenticated state diagnostics.
- Add unit, benchmark, and Playwright coverage for signature tampering and reuse, one million shard assignments, 512-square texture upscaling, relativistic invariants, lens mapping, capability handling, and stable paused rendering.
- Add a deterministic fixed-point neural terrain network with seeded integer weights, five biome classes, elevation, erosion, mineral fields, 128-square chunks, and a matching 64-thread WebGPU compute contract.
- Add a bounded recursive path tracer with rough reflection, dielectric refraction, Russian roulette termination, generated emissive lighting, spatial-temporal filtering, and a capability-gated WebGPU compute shader.
- Add an Ed25519 authenticated quorum world ledger with four to sixteen fixed members, supermajority votes, payload hashes, chained SHA-256 state roots, stale-fork rejection, and verified snapshots.
- Add The Singularity as the twenty-fourth game and a synthesis of seventeen established architectures with neural terrain, path lighting, quantum state, grid compute, local society, WebXR, WebCodecs, and Neon OS access.
- Add unit, benchmark, and Playwright coverage for 65,536 terrain samples, 100,000 recursive paths, 100 signed consensus records, tampering, minority votes, stale roots, capability handling, and stable paused rendering.
- Add a capability-gated WebCodecs broadcast pipeline with AV1 or H.264 probing, canvas frame capture, Web Audio capture taps, custom application framing, queue-aware frame dropping, and adaptive 0.4 to 8 Mbps bitrate control.
- Add a masterless grid coordinator for established peers with deterministic declarative genetic-fitness and gradient kernels, 1 MiB transport envelopes, bounded shards, peer-churn retries, and local recovery.
- Add a safe Neon DSL compiler that validates stack effects and emits raw import-free WebAssembly v1 binaries for bounded i32 programs without JavaScript evaluation, memory, or host imports.
- Add Neon OS with a generated terminal, bounded window manager, safe DSL execution, grid job submission, capability diagnostics, and a lazy 12.28 kB scene chunk.
- Add unit, benchmark, and Playwright coverage for 10,000-line compilation, 100,000-value grid reduction, broadcast framing, codec capability handling, peer loss, stable Neon OS rendering, and browser canvas capture attempts.
- Add a bounded categorical quantum game-state solver with normalized complex amplitudes, deterministic camera-triggered observation, correlated entanglement groups, phase evolution, and CRDT collapse records.
- Add an eight-trait genetic ecosystem with terrain-gradient fitness, natural selection, crossover, bounded mutation, diversity metrics, snapshot validation, a 64-thread WebGPU fitness contract, and transferable Worker evolution with CPU fallback.
- Add a seeded local INT4 society for up to 32 agents with concurrent conversation rounds, bounded statements, trade, alliances, migration, faction membership, influence, hierarchy, consensus, and capability-gated WebGPU pipeline compilation.
- Add Neon Genesis with procedural universe rendering, player terrain deformation, 256-lifeform Worker evolution, camera observation of correlated resources, 24-agent civilization rounds, inherited arcade cabinets, and fifteen milestone references.
- Add unit, benchmark, and Playwright coverage for 10,000 collapses, 4,096-genome evolution, 24-agent dialogue, 1,000-generation stability, Worker execution, WebGPU capability handling, entanglement correlation, consensus, and stable paused rendering.
- Add capability-gated immersive VR and AR sessions, device-supplied stereo view planning, nearest supported 90 or 120 Hz refresh selection, adaptive render budgets, controller poses, hand joints, pinch detection, and FABRIK arm mapping.
- Add an Ed25519 signed last-writer-wins world CRDT for voxel, body, portal, and arcade state with deterministic actor tie-breaking, bounded quotas, snapshot restoration, and reliable WebTransport or WebRTC chunk routing.
- Add a generated 4,096-vector motion database and deterministic matrix-projection matcher that scores velocity, terrain slope, intent, turn, and phase before blending twelve-joint poses.
- Add Neon Nexus with persistent voxel edits, generated cabinet placement for thirteen flagship games, soft-body decoration, motion-matched locomotion, capability-gated XR entry, attachable spatial voice, and attachable CRDT peer transport.
- Add a 100,000-edit two-replica CRDT convergence benchmark, 100,000-frame stereo planning benchmark, 4,096-vector motion benchmark, unit coverage, and Playwright stereo, convergence, motion, and paused-frame gates.
- Add oriented non-Euclidean portals with crossing tests, momentum and gravity transformation, packed projectile traversal, four-level recursive camera planning, and stencil mask or restore contracts.
- Add a deterministic flat BVH, reflective two-bounce global illumination, soft visibility, a WebGPU compute traversal shader, and temporal depth or motion rejection for denoising.
- Add a seeded 10,240-byte INT4 transformer with bounded attention, feed-forward inference, sanitized Avatar DNA and telemetry context, local dialogue, quest synthesis, and a 64-thread WebGPU projection shader.
- Add Neon Paradox with generated heist geometry, tesseract vertices, throwable portal anchors, gravity-aware traversal, shadow-driven guard detection, recursive corridor presentation, objectives, and procedural tracker audio.
- Add unit, benchmark, and Playwright coverage for portal transforms, projectile momentum, stencil recursion, BVH intersections, GI, temporal denoising, INT4 packing, dialogue determinism, stable portal frames, and compute compilation attempts.
- Add a 1,800-frame temporal ring with sparse delta snapshots, rolling keyframe rebasing, rewind branching, bounded recorded-input clones, and deterministic causal collision priority.
- Add Rayleigh and Mie atmospheric integration, adaptive volumetric ray steps, an 8x8 WebGPU compute shader, and a universal CPU reference path.
- Add WebTransport datagram and bidirectional stream backends, 120 Hz telemetry pacing, replay and mod multiplexing, validated size ceilings, and WebRTC DataChannel fallback.
- Add Neon Chrono with fixed-point movement, full-world rewind, time-clone switch cooperation, generated chambers, laser grids, slow fields, gravity inversion, and tracker tempo or pitch warping.
- Add unit, benchmark, and Playwright coverage for temporal compression, timeline branching, causal collisions, transport routing, scattering math, deterministic Chrono simulation, and WebGPU pipeline compilation attempts.
- Add deterministic spherical voxel fields, persistent bounded crater edits, real surface-net edge intersections, indexed meshes, continuous LOD morph factors, and a 64-thread WebGPU density shader contract.
- Add bounded acoustic SDF ray marching with direct occlusion, diffraction gain, generated dynamic impulse responses, and procedural binaural interaural delay and level filtering.
- Add Ed25519 signed Avatar DNA across bounded cross-game statistics, SHA-256 cosmetic derivation, local persistence, opponent gossip, and tamper rejection.
- Add Neon Odyssey with quaternion 6-DOF flight, Newtonian drift, continuous atmospheric state, voxel planet descent, crater persistence, adaptive encounters, and deterministic trading markets.
- Add unit, benchmark, and Playwright coverage for surface nets, crater restoration, LOD transitions, acoustic output, DNA signing, 6-DOF integration, and stable planetary rendering.
- Add fixed-capacity rollback state history, checksum-validated inputs, local prediction, late-input rewind, bounded resimulation telemetry, and twelve-frame redundant input bundles.
- Add loss, 110 ms latency, and 35 ms jitter desync simulation that reconverges deterministic fighter state after dropped packets.
- Add a generated WebAssembly phase core and AudioWorklet synthesizer for 128-sample square, triangle, and noise rendering outside the main thread.
- Add a 4,096-node Verlet soft-body solver, a 64-thread WebGPU deformation shader, and deterministic clipped Voronoi stage shattering.
- Add Neon Kombat with fixed 60 Hz fighter state, startup and active frame data, hit-stun, block-stun, combo scaling, IK poses, cloth capes, and destructible boundaries.
- Add unit, benchmark, and browser gates for rollback convergence, redundant packet recovery, WASM audio blocks, soft-body deformation, Voronoi fragments, and stable fighter rendering.
- Add a 100,000-projectile structure-of-arrays ECS with fixed typed-array storage, capability-gated SharedArrayBuffer allocation, allocation-free CPU updates, and a real 64-thread WebGPU compute backend.
- Add a bounded neural AI Director that adapts density, speed, pattern selection, and power-up relief from damage, accuracy, movement, near-miss, life, and stage telemetry.
- Add opt-in WebRTC microphone tracks with one-audio-track enforcement, video rejection, eight-peer limits, HRTF positioning, distance filtering, and generated convolution reverb.
- Add Neon Danmaku with Fibonacci spirals, polygon curtains, homing fans, adaptive render budgets, generated chiptune audio, NeonVM boss phases, and eight-limb FABRIK bosses.
- Add unit, benchmark, and Playwright coverage for deterministic patterns, director cadence, media constraints, fixed projectile capacity, and stable dense-curtain rendering.
- Add NeonVM with sixteen 16-bit registers, bounded programs, deterministic gas metering, checked jumps, fixed-point arithmetic, and a 64-event output cap.
- Compile validated Visual Mod Studio graphs into NeonVM bytecode without evaluating JavaScript.
- Add Ed25519 signed score claims, replay-hash binding, deterministic gossip merging, connected-peer rebroadcast, and bounded IndexedDB accumulation.
- Add a connected-swarm leaderboard UI while explicitly retaining manual ARC1 signaling and rejecting unsupported global discovery claims.
- Add a FABRIK inverse-kinematics solver and mass-conserving cellular fluid simulation with a 64-thread WebGPU shader contract and CPU fallback.
- Add Neon Labyrinth with a nine-chunk cache, seamless procedural rooms, dash, wall-cling, double-jump gates, cellular lava, and reactive six-leg IK bosses.
- Add Playwright gates for deterministic Labyrinth room transitions and browser-native signed-score convergence.
- Add a deterministic Meta-Arcade hall with BSP rooms, six interactable flagship cabinets, DDA rendering, and generated remote-player avatars.
- Add a bounded eight-link WebRTC presence mesh that exchanges validated avatar transforms over reliable control channels without a discovery server.
- Add fixed 60 Hz input-change replay ledgers, interactive timeline playback, scene restart from replay seeds, SHA-256 validation, and bounded local persistence.
- Add procedural spatial cabinet audio with HRTF panning, inverse-distance attenuation, low-pass muffling, and generated convolution reverb.
- Add Neon Tactics with 1,000-unit typed-array storage, flow-field movement, A-star paths, marquee selection, harvesting, construction, fog of war, and a local Q-learning commander.
- Add a WebGPU-compatible 64-thread flow dispatch shader contract with a deterministic CPU execution path for universal runtime support.
- Add Playwright scale coverage for stable Meta-Arcade pixels, replay hash and timeline accuracy, and bounded Neon Tactics swarm launch.
- Add a capability-gated AABB compute pipeline with WebGPU WGSL dispatch, transferable Worker buffers, a WebAssembly capability tier, and a synchronous CPU fallback.
- Add deterministic 100,000-pair collision stress generation without changing Phaser Arcade Physics internals.
- Add bounded local neural Q-learning ghosts for Neon Retro Racer and opt-in Neon Breakout paddle control with persisted model snapshots.
- Add a draggable Visual Mod Studio that compiles acyclic event graphs into validated declarative manifests and signs them with session Ed25519 keys.
- Add Neon Cyber-Caster with deterministic BSP dungeons, grid DDA ray casting, generated wall patterns, depth-buffered sprites, hitscan combat, and infinite floors.
- Add Playwright gates for stable Raycaster pixels, signed studio output, compute initialization, and bounded heap growth across repeated scene lifecycles.
- Add a direct WebRTC netplay panel with bounded manual offer-answer room codes and configurable STUN or TURN servers.
- Add fixed 12-byte input frames, unreliable low-latency input delivery, reliable control messages, prediction, rollback history, reconciliation, and remote Player 2 input routing.
- Add deterministic packet-loss, latency, and jitter simulation plus a 10,000-packet benchmark.
- Add SHA-256 content hashing, canonical JSON encoding, Ed25519 verification, verified-package caching, and signed HTTPS repository imports.
- Reject unsigned, modified, oversized, credential-bearing, redirected, executable, or schema-invalid mod packages.
- Add Neon Retro Racer with a scanline-projected curved highway, depth-sorted billboards, generated traffic hazards, five gears, nitro, collisions, mod track hazards, and a procedural synthwave track.
- Add a Playwright Chromium regression gate for stable Canvas pixels, cabinet overlays, netplay controls, and Racer scene loading.
- Add a cabinet Mod Manager with drag-and-drop, paste, file, and credential-free HTTPS JSON import paths.
- Validate community mods before activation, preview stage palettes and hazard lanes on Canvas, and persist up to 32 bounded manifests locally.
- Add a visual chiptune patch editor with pulse, noise, oscillator, envelope, filter, preview, save, and effect-slot assignment controls.
- Extend declarative mod hooks with boss-entry and power-up events plus saved sound-patch playback.
- Replace the basic Breakout scene with Neon Breakout featuring paddle spin, deterministic stage palettes, tiered bricks, boss walls, multiball, lasers, sticky catches, and slow-ball drops.
- Apply validated mod hazards and skins directly to generated Neon Breakout stages without loading external assets or executable code.
- Add managed CRT bloom, barrel distortion, vignette, chromatic fallback, scanline controls, and half-resolution phosphor persistence.
- Add adaptive post-processing profiles that disable bloom at medium quality and all feedback passes at low quality or when CRT is disabled.
- Add a closed-schema declarative mod runtime for custom hazards, procedural skins, score scaling, audio triggers, and lifecycle hooks.
- Reject executable mod code, unknown fields, oversized JSON, unsafe strings, and values outside fixed engine bounds.
- Add a fixed-ring BIOS telemetry overlay with mean frame time, p95 frame time, dropped-frame rate, scene count, quality tier, and optional heap readings.
- Add open-source architecture research and a stage mod authoring guide.
- Add a shared local multiplayer engine with P1 WASD and Space, P2 arrows and Enter, two hot-plug gamepad slots, cooperative combo scoring, independent lives, and collision separation math.
- Add Solo, Co-op, and Versus selection to the cabinet lobby and pass the selected mode through every lazy game launch.
- Route both players through every replica with shared co-op control or timed versus relay turns when a bespoke dual-player ruleset is unavailable.
- Add two-ship co-op and versus defense to Neon Vector Asteroids with independent lives, shared shields, player-attributed scoring, and dual firing controls.
- Add two-runner Pixel Runner racing with player collision, versus winner resolution, dual keyboard and gamepad control, and mode-specific score ledgers.
- Add deterministic infinite stage generation with seeded hazards, logarithmic difficulty curves, five-stage boss cadence, low gravity, fast bullets, and inverted controls.
- Replace per-impact Phaser emitters with one 4,096-slot typed-array particle pool per active scene.
- Add chromatic impact response and adaptive particle, scanline, and filter budgets after sustained medium or low frame rates.
- Preserve the split build at a 2.88 kB initial entry while adding multiplayer, generator, and particle modules.
- Add a four-voice programmable tracker with pulse lead, chord arpeggiator, triangle bass, synthesized percussion, 25 ms lookahead scheduling, channel mixing, cross-fades, and focus suspension.
- Compose Arcade Plaza, Deep Space Recon, Cyber Sprint, and Hyper Vector as code-defined looping tracks with zero audio assets.
- Add a first-session BIOS POST, persistent coin credits, free play, animated attract previews, game records, and credit-gated launches to the arcade lobby.
- Add live fire-key capture, separate BGM volume controls, Amber phosphor styling, and gamepad Start pause support.
- Replace Astro Drift with Neon Vector Asteroids featuring three-tier fractures, mineral collection, predictive UFO fire, spread, laser, and EMP weapons, shields, stages, and vector particles.
- Defer Phaser bootstrap and load all 11 game scenes through dynamic imports.
- Split the initial JavaScript entry to 2.83 kB, the bootstrap to 26.07 kB, and game modules to 2.99-7.16 kB while isolating the cached Phaser runtime.
- Remove the Vite large-chunk warning with an explicit 1.5 MB ceiling for the known deferred Phaser runtime.
- Add deterministic sprite animation states with directional metadata, interpolated frame progress, per-state hitboxes, and action emission hooks.
- Expand Space Defenders with endless stage progression, combo multipliers, patrol, chase, and barrage fire, shield power-ups, and procedural effects.
- Replace the Pixel Runner rectangle with generated animated character frames and state-specific collision bodies.
- Expand Web Audio synthesis with scheduled laser, explosion, coin, power-up, and stage-clear effects plus a generated noise channel.
- Migrate best scores into a persistent top-ten ledger per game and difficulty while preserving v2 compatibility.
- Add validated persistent cabinet themes and remappable Player 1 control bindings.
- Add classic woodgrain and cyber cabinet themes to the neon default.
- Add shared progression and spatial-hash engines with unit and benchmark coverage.
- Update Vite and Vitest to advisory-fixed versions and clear the npm audit.
- Wrap the game viewport in a responsive arcade cabinet with a marquee, bezel, console rails, and live frame, input, and runtime indicators.
- Restore requestAnimationFrame scheduling and suspend the Phaser loop while the document is hidden.
- Apply CRT and reduced-motion preferences immediately from the settings overlay.
- Remove the external Google Fonts runtime dependency and use local system monospace fonts.

### Verified
- Pass 148 unit and integration tests across 55 files plus 21 Playwright Chromium tests.
- Generate 100 local INT4 dialogue tokens in 35.3797 ms mean, or 2,826.5 CPU tokens per second.
- Plan 1,000 four-level recursive portal frames in 26.4958 ms mean, or 0.02650 ms per frame plan.
- Trace 10,000 two-bounce CPU BVH GI rays in 60.9934 ms mean.
- Build 128 transformed modules with a 3.09 kB initial entry, a 22.11 kB Paradox chunk, and no Vite chunk warning.
- Confirm the current W3C WebGPU feature set has no standardized ray-tracing capability. Use compute BVH traversal and report `UNAVAILABLE` when headless Chromium returns no WebGPU adapter.
- Pass 135 unit and integration tests across 51 files plus 19 Playwright Chromium tests.
- Run 10,000 allocation-free temporal delta compressions and resimulations in 0.1468 ms mean. Run the complete 1,800-slot archival ring record and random-access decode workload across 10,000 states in 18.5306 ms mean.
- Integrate 10,000 CPU reference fog rays at 24 steps in 9.0975 ms mean.
- Build 117 transformed modules with a 3.09 kB initial entry, a 12.51 kB Chrono chunk, and no Vite chunk warning.
- Attempt the WebGPU compute pipeline in Chromium and report `UNAVAILABLE` when the headless adapter cannot be acquired instead of claiming shader execution.
- Pass 121 unit and integration tests across 47 files plus 17 Playwright Chromium tests.
- Generate one 32 cubed surface-net chunk in 12.97 ms mean, select a planetary LOD octree in 0.0031 ms mean, and trace 64 acoustic rays in 0.193 ms mean on the verification workstation.
- Build 110 transformed modules with a 3.09 kB initial entry, a 10.80 kB Odyssey chunk, and no Vite chunk warning.
- Pass 111 unit and integration tests across 43 files plus 15 Playwright Chromium tests.
- Resimulate 120 divergent frames in 0.195 ms mean, step 4,096 cloth nodes in 1.27 ms mean, and shatter 32 Voronoi cells in 0.082 ms mean on the verification workstation.
- Render one 128-sample WASM DSP block in 0.0009 ms mean. Calculate a 2.67 ms render quantum at 48 kHz without treating it as total hardware latency.
- Build 102 transformed modules with a 3.05 kB initial entry, a 10.85 kB Kombat chunk, and no Vite chunk warning.
- Pass 102 unit and integration tests across 38 files plus 13 Playwright Chromium regression tests.
- Update 100,000 projectiles in 2.94 ms mean and evaluate an adaptive director decision in 0.0023 ms mean on the verification workstation.
- Build 96 transformed modules with a 3.02 kB initial entry, an 8.55 kB Danmaku chunk, and no Vite chunk warning.
- Pass 95 unit and integration tests across 34 files plus 11 Playwright Chromium regression tests.
- Execute about 1.31 million 67-instruction NeonVM programs per second while recording native arithmetic as 17.91 times faster on the verification workstation.
- Sort 1,000 converged score claims in 0.136 ms mean and verify two signed browser claims within the 1,000 ms convergence gate.
- Solve 1,000 sixteen-joint IK chains in 9.29 ms mean and step 8,192 fluid cells in 0.025 ms mean.
- Build 91 transformed modules with a 2.99 kB initial entry, a 5.49 kB Labyrinth chunk, and no Vite chunk warning.
- Pass 86 unit and integration tests across 30 files plus 9 Playwright Chromium regression tests.
- Dispatch 10,000 RTS units through a shared flow field in 0.095 ms mean on the verification workstation.
- Compress a 36,000-tick one-byte mask stream from 36,000 raw bytes to 4,828 ledger bytes, a 7.46 to 1 ratio.
- Build 83 transformed modules with a 2.99 kB initial entry, a 5.48 kB Tactics chunk, a 6.06 kB Meta-Arcade chunk, and no Vite chunk warning.
- Pass 77 unit and integration tests across 26 files plus 6 Playwright Chromium regression tests.
- Process 100,000 packed AABB pairs in 1.09 ms mean and cast 100,000 DDA rays in 16.75 ms mean on the verification workstation.
- Run 10,000 local neural inferences in 6.98 ms mean on the verification workstation.
- Build 74 transformed modules with a 2.91 kB initial entry, a 0.39 kB compute Worker, an 8.17 kB Raycaster chunk, a 66.07 kB bootstrap, and no Vite chunk warning.
- Pass 64 unit and integration tests across 22 files plus 3 Playwright browser regression tests.
- Simulate 10,000 packets with 8 percent loss, 120 ms latency, and 35 ms jitter at 523.02 operations per second with a 1.91 ms mean.
- Update 10,000 pooled particles at 1,203.44 operations per second with a 0.83 ms mean.
- Record 100,000 telemetry frames at 1,193.05 operations per second with a 0.84 ms mean.
- Build 62 transformed modules with a 2.91 kB initial entry, a 4.66 kB Racer chunk, and no Vite chunk warning.
- Pass 52 unit and integration tests across 18 files.
- Update 10,000 simultaneous pooled particles at 448.61 operations per second with a 2.23 ms mean on the verification workstation.
- Record 100,000 telemetry frames at 767.43 operations per second with a 1.30 ms mean.
- Build 56 transformed modules with a 2.87 kB initial entry, a 9.08 kB Neon Breakout chunk, and no Vite chunk warning.
- Render the Mod Manager and Neon Breakout through isolated local headless Chrome sessions.
- Pass 41 unit and integration tests across 15 files.
- Record 100,000 telemetry frames and calculate a snapshot at 1,141.9 operations per second with a 0.88 ms mean.
- Build 50 transformed modules with a 2.87 kB initial entry and no Vite chunk warning.
- Render the cabinet through local headless Chrome with the production runtime active.
- Pass 32 unit and integration tests across 12 files.
- Update 10,000 simultaneous pooled particles at 1,219.1 operations per second with a 0.82 ms mean.
- Process 5,000 spatial bodies and 500 regional queries at 578.0 operations per second with a 1.73 ms mean.
- Build 45 transformed modules with no Vite chunk warning.
- Pass 22 unit and integration tests across 9 files.
- Build 40 transformed modules with a 2.83 kB initial entry and no Vite chunk warning.
- Process the spatial benchmark at 616.9 operations per second with a 1.62 ms mean.
- Pass 11 unit tests across 5 test files.
- Process 5,000 spatial bodies and 500 regional queries at 442.9 operations per second with a 2.26 ms mean on the development workstation.
- Pass npm audit with zero known vulnerabilities.
- Pass TypeScript compilation and the Vite production build.
- Confirm the generated production bundle contains 32 transformed modules with no build errors.

### Added
- Native HTML5 Gamepad API integration for Player 1 and Player 2 local co-op.
- In-game UI overlay for controller connection status.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0] - Planned

### Verified
- Live build and test verification completed.

### Added
- Core Engine Refactor: Frame-rate independent delta-time clock lock (60Hz/120Hz/144Hz support).
- Modular `InputManager` supporting Keyboard, Virtual Touch Controls, and Gamepad API.

## [v1.0.0] - Baseline

### Verified
- Live build and test verification completed.

### Added
- Completed implementation for all 11 premium game replicas.
- Added **Cyber Chasm**, a high-tech labyrinth runner with overclock power-ups and sentinel AI.
- Added **Pixel Runner**, an infinite runner with parallax backgrounds and ducking mechanics.
- Added **Brave Bird**, a precision flapper with velocity-based rotation.
- Added **Froggie Crosser**, a grid-based crosser with dynamic river/road obstacles.
- Added **Tetris: Pulse**, featuring ghost pieces, screen shake, and line-clear particles.
- Added **Minesweeper: Tactical**, a cyberpunk-themed version with recursive flood-fill logic.
- Expanded the main Launcher Lobby to seamlessly support all 11 games with back-to-menu functionality.

### Changed
- Update the package and Tauri product metadata.
- Upgraded the `README.md` to reflect the full 11-game suite with documentation.
- Removed all local, hardcoded absolute system paths to ensure professional cross-platform compilation.
- Replaced all em dashes with hyphens in `README.md` and `CREDITS.md` for cross-platform doc consistency.
