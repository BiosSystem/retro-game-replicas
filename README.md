<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Share+Tech+Mono&weight=bold&size=34&duration=3000&pause=1000&color=00FF72&center=true&vCenter=true&width=600&lines=Universal+Retro+Arcade;26+Games+and+Meta+Hall;Tauri+v2+Multi-Platform;BiosSystem+Kernel" alt="Retro Arcade Typing Title" />
</p>

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=rust,ts,vite,html" alt="Tech Stack" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/BiosSystem/retro-game-replicas?color=00ff72&style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Tauri-v2-blue?style=flat-square" alt="Tauri">
  <img src="https://img.shields.io/badge/Phaser-4.1-orange?style=flat-square" alt="Phaser">
  <img src="https://img.shields.io/github/license/BiosSystem/retro-game-replicas?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/stars/BiosSystem/retro-game-replicas?style=flat-square&color=00ff72" alt="Stars">
</p>

<p align="center">
  <strong>🌐 Part of the <a href="https://bios-system.net">BiosSystem Suite</a></strong>
</p>

## 🚀 Elevator Pitch

**Universal Retro Arcade** is a premium, open-source collection of 26 classic, 2000s-era, and experimental game worlds plus a generated Meta-Arcade hall. Built from scratch using modern web technologies (Phaser 4, TypeScript, Vite) and packaged natively for all platforms via Tauri v2.

Enjoy pixel-perfect gameplay with full gamepad support, hardware-accelerated GLSL CRT shaders, and local persistence - without needing external emulators or illegal ROMs.

## ✨ Features

- **26 Built-In Games plus Meta-Arcade Hall** - Snake, Pong, Asteroids, Breakout, Frogger, Space Invaders, Tetris, Minesweeper, Runner, Flappy Bird, Cyber Chasm, Neon Retro Racer, Neon Cyber-Caster, Neon Tactics, Neon Labyrinth, Neon Danmaku, Neon Kombat, Neon Odyssey, Neon Chrono, Neon Paradox, Neon Nexus, Neon Genesis, Neon OS, The Singularity, Neon Event Horizon, and Neon Epoch.
- **Complete Offline Arcade** - Install one content-versioned service worker after the first online load, cache the full app shell and every lazy game chunk, and continue launching unvisited games without a network connection.
- **Modular WebGL CRT Pipeline** - Select Clean Pixel, Arcade CRT 1980s, Trinitron 1990s, or Bypass while one shader pass controls scanlines, bloom, curvature, chromatic aberration, phosphor mask, and vignette effects with source-canvas fallback.
- **Integer Display Frames** - Center the 640x480 playfield at a strict integer scale inside selectable 4:3 or 16:9 frames, retain letterbox or pillar space, and use bounded fit scaling only on displays smaller than one native pixel scale.
- **High-Refresh Frame Safety** - Guard the active Phaser callback for every scene and physics step, preserve real 120 Hz, 144 Hz, and VRR deltas, cap invalid or long frame gaps at 50 ms, and bound standalone fixed-step catch-up work.
- **Animation-Frame Controller Sampling** - Poll connected controllers once per runtime frame, normalize standard PlayStation and Xbox layouts into compact bitmasks, expose press and release edges, and apply radial dual-stick deadzones without duplicate scene polling.
- **IndexedDB Wasm Save States** - Persist bounded physics memory, player transforms, and Neon Epoch seeds through scheduled copies and asynchronous SHA-256 integrity checks, then retain a volatile isolated-memory fallback when browser storage is unavailable.
- **Generated Save Gallery** - Open the cabinet memory bank to inspect one autosave and three manual Neon Epoch slots, capture procedural previews, and restore or delete local states without image assets.
- **Procedural Gaussian Worlds** - Generate up to 100,000 anisotropic terrain and flora splats, project them through the deterministic CPU path, and compile an instanced WebGPU transparency pipeline when supported.
- **Wasm SIMD Physics** - Process four collision distance pairs per 128-bit instruction, reuse linear memory, batch gravity distance terms and relativistic time factors, and retain scalar Wasm and TypeScript references.
- **Asynchronous Spatial Audio** - Stream generated samples through an AudioWorklet with a lock-free SharedArrayBuffer ring under cross-origin isolation and use transferred message blocks everywhere else.
- **Neon Epoch** - Traverse a generated volumetric ecosystem with changing rain, wind, temperature, and mass-conserving cellular water without image, model, level, or audio assets.
- **One-Time Hash State Attestations** - Sign one finalized state root with a bounded Lamport SHA-256 key, erase used secrets, reject reuse, and preserve Ed25519 quorum compatibility.
- **Spatial Peer Shards** - Assign replicated procedural chunk regions through deterministic weighted rendezvous hashing and route bounded state envelopes over established WebTransport or WebRTC sessions.
- **Neural Texture Detail** - Upscale generated surfaces through a deterministic fixed-weight edge network, reuse caller-owned output buffers, modulate path-traced materials, and compile an 8x8 WebGPU compute contract when supported.
- **Relativistic Physics** - Calculate Lorentz factors, contraction, longitudinal Doppler shifts, Schwarzschild time factors, weak-field deflection, and bounded normalized combat dynamics.
- **Neon Event Horizon** - Dogfight around a generated accretion field with time-dilated ship state, lensing, neural hull plates, replicated shard ownership, and one-time hash-authenticated diagnostics.
- **Fixed-Point Neural Terrain** - Generate deterministic elevation, erosion, mineral, and five-class biome fields from coordinates and seeds through matched CPU and 64-thread WebGPU integer networks.
- **Recursive Path Lighting** - Trace generated scenes with rough reflection, dielectric refraction, emissive surfaces, bounded bounce depth, and spatial-temporal filtering through a universal CPU reference and capability-gated WebGPU compute contract.
- **Authenticated Quorum Ledger** - Finalize bounded voxel, safe-mod, and broadcast-segment records after Ed25519 supermajority votes, chain each record into a SHA-256 state root, and reject tampered payloads or stale forks.
- **The Singularity** - Explore generated worlds that synthesize seventeen engine architectures, open Neon OS, request supported WebXR sessions, inspect local society policy, and verify distributed world roots without external assets or model downloads.
- **Capability-Gated Broadcast Core** - Probe AV1 then H.264 WebCodecs support, capture Canvas frames, expose a Web Audio graph tap, frame encoded chunks for application transport, and reduce bitrate or drop capture work before gameplay stalls.
- **Self-Healing Compute Grid** - Distribute bounded numeric genetic and gradient shards over application-established peers, retry work after peer churn, and retain deterministic local recovery without claiming automatic internet discovery.
- **Raw WebAssembly DSL Compiler** - Parse a small stack language, validate instruction count and stack effects, and emit import-free WebAssembly v1 modules without eval, memory, host calls, or downloaded code.
- **Neon OS** - Program a generated retro terminal, arrange procedural windows, compile safe arithmetic processes, submit grid reductions, and inspect WebCodecs or WebGPU capabilities.
- **Quantum Game-State Solver** - Evolve normalized complex amplitudes across bounded categorical branches, collapse only after in-range camera observation, correlate entangled branch indices, and publish deterministic collapse records through the existing world CRDT.
- **Worker-Evolved Ecosystems** - Cross, mutate, select, and score up to 4,096 eight-trait genomes against temperature, moisture, fluid, and elevation gradients through transferable Worker buffers with a CPU fallback.
- **Local INT4 Society** - Run up to 32 seeded local transformer agents with bounded statements, wealth, trust, influence, trade, migration, faction, hierarchy, and consensus state without downloads or API calls.
- **Neon Genesis** - Shape procedural planetary habitats, guide evolving life, observe correlated resources, follow local civilization policy, and explore cabinets inherited from fifteen engine milestones.
- **Capability-Gated WebXR Core** - Request immersive VR or AR only after support checks and user gestures, consume device-provided stereo views, select the nearest supported 90 or 120 Hz target, adapt render budgets, and map controllers or hand joints into IK poses.
- **Signed World CRDT** - Merge voxel, body, portal, and arcade edits through deterministic logical clocks, Ed25519 signatures, bounded actor quotas, and the existing WebTransport or WebRTC transport path.
- **Generated Motion Matching** - Search 4,096 seeded locomotion vectors through a compact matrix projection, score velocity, terrain slope, intent, turn, and gait phase, then blend twelve-joint poses without model assets.
- **Neon Nexus** - Explore a persistent generated arcade world, deform local terrain, animate through motion matching and soft bodies, opt into XR and spatial voice, synchronize signed edits over an attached peer transport, and enter thirteen procedurally placed flagship cabinets.
- **Non-Euclidean Portal Core** - Transform positions, momentum, projectiles, and gravity between oriented portal frames while planning stencil mask, recursive view, and depth restoration passes through four levels.
- **Compute BVH Global Illumination** - Trace reflective boxes, two-bounce lighting, soft visibility, and temporal denoising through code-owned CPU and WebGPU compute paths without claiming unavailable standardized hardware ray tracing.
- **Local INT4 Transformer** - Generate a 10,240-byte quantized language model from a deterministic seed, infer bounded NPC dialogue locally, and compile a 64-thread WebGPU projection shader when an adapter is available.
- **Neon Paradox** - Infiltrate generated impossible corridors, throw linked portal anchors, exploit true BVH shadow values, evade adaptive guards, collect procedural heist objectives, and receive context-conditioned local dialogue.
- **Temporal Rewind Core** - Retain 1,800 fixed-width world frames, delta-compress sparse changes, rebase rolling history, branch past inputs into eight bounded clones, and resolve cross-timeline contacts deterministically.
- **Volumetric Scattering** - Raymarch generated fog through Rayleigh and Henyey-Greenstein Mie models with adaptive 8-72 step budgets and a capability-gated WebGPU compute pipeline.
- **Unified QUIC Transport** - Multiplex 120 Hz telemetry over WebTransport datagrams and replay or mod data over reliable streams when an application supplies an HTTPS HTTP/3 endpoint, then fall back to established WebRTC DataChannels.
- **Neon Chrono** - Rewind fixed-point world state, cooperate with recorded time clones, cross generated switch gates, laser grids, time-slow fields, and gravity zones, and time-warp the procedural tracker during temporal effects.
- **Voxel Planet Engine** - Generate indexed surface-net geometry from deterministic spherical fields, morph bounded LOD octrees, and retain procedural crater edits.
- **Binaural Acoustic Tracing** - Trace sound through signed-distance geometry and derive occlusion, diffraction, impulse taps, and headphone spatialization without measured HRTF assets.
- **Persistent Avatar DNA** - Sign canonical cross-game statistics with Ed25519 and derive reproducible avatars, decals, particles, and cosmetic economy tiers from SHA-256 bytes.
- **Neon Odyssey** - Fly through six degrees of freedom, retain Newtonian drift, cross continuous atmosphere bands, carve voxel planets, trade deterministic markets, and survive adaptive encounters.
- **Competitive Rollback Core** - Predict remote inputs, preserve 240 deterministic states, rewind divergent frames, and recover dropped inputs through bounded redundant bundles.
- **WASM Worklet Synthesis** - Generate square, triangle, and noise signals in 128-sample AudioWorklet quanta with a runtime-created WebAssembly phase core and no audio assets.
- **Soft-Body Destruction** - Deform procedural cloth through Verlet constraints and shatter arena elements into deterministic clipped Voronoi cells.
- **Neon Kombat** - Fight at a fixed 60 Hz with explicit startup, active, recovery, hit-stun, block-stun, combo scaling, IK poses, rollback checksums, and deformable arenas.
- **100K Projectile ECS** - Update fixed structure-of-arrays projectile storage without per-frame allocations, using SharedArrayBuffer only under cross-origin isolation and WebGPU only when available.
- **Neural AI Director** - Adjust wave pressure, projectile speed, pattern choice, and power-up relief from bounded local gameplay telemetry.
- **Spatial WebRTC Voice** - Opt into one microphone track per peer and position remote speech through HRTF panning, distance filtering, and generated reverb without bundled audio.
- **Neon Danmaku** - Dodge generated Fibonacci, polygon, mixed, and homing curtains while NeonVM phases drive procedural eight-limb IK bosses.
- **NeonVM Sandbox** - Compile validated visual graphs into gas-metered 16-bit bytecode with bounded registers, programs, jumps, and events.
- **Connected Score Swarm** - Exchange Ed25519 signed score and replay claims across manually connected ARC1 peers and retain verified claims in IndexedDB.
- **Procedural Kinematics** - Animate generated multi-joint bosses with FABRIK and simulate mass-conserving cellular lava without sprite or fluid assets.
- **Neon Labyrinth** - Traverse cached procedural rooms, unlock dash, wall cling, and double jump, and fight reactive IK bosses across fluid hazards.
- **Procedural Meta-Arcade** - Walk through a generated DDA-rendered arcade hall, hear cabinets spatially, and enter six physical flagship machines.
- **Peer Presence Mesh** - Negotiate up to eight direct WebRTC links and render validated remote avatars without a central discovery service.
- **Deterministic Replay Timeline** - Record fixed-tick input changes, verify SHA-256 replay hashes, and scrub or replay sessions from compact local ledgers with `R`.
- **Procedural Spatial DSP** - Pan, attenuate, muffle, and reverberate cabinet tones through generated Web Audio graphs without audio assets.
- **Neon Tactics** - Command typed-array swarms through flow fields and A-star paths with selection, harvesting, construction, fog of war, and learning enemy decisions.
- **Adaptive Compute Pipeline** - Dispatch packed AABB workloads through WebGPU when available, then fall back through a transferable Worker, WebAssembly capability tier, and synchronous CPU kernel.
- **Local Learning Ghosts** - Train bounded neural Q-networks entirely on-device in Racer and the opt-in Breakout ghost mode without network calls or model assets.
- **Visual Mod Studio** - Drag safe event and action nodes into an acyclic graph, compile validated declarative JSON, and sign the package with a session Ed25519 key.
- **Neon Cyber-Caster** - Explore infinite deterministic BSP dungeons rendered through grid DDA ray casting, generated textures, sprites, and procedural combat.
- **Hardware Gamepad Support** - Plug-and-play support for Xbox and PlayStation controllers via the HTML5 Gamepad API.
- **Hardware-Accelerated Post-FX** - Toggle GLSL CRT scanlines, chromatic aberration, and barrel distortion (`Ctrl+Shift+C`).
- **Arcade Cabinet Interface** - Scale the 640x480 playfield inside a responsive marquee, bezel, and live runtime console.
- **Power-Aware Runtime** - Suspend rendering in hidden tabs and resume without advancing game simulation.
- **Accessible Motion Controls** - Disable cabinet animation from Settings or the operating system reduced-motion preference.
- **Animated Character Engine** - Drive generated pixel characters through deterministic run, jump, duck, and action states with tailored hitboxes.
- **Procedural Chiptune Audio** - Synthesize laser, explosion, coin, power-up, stage-clear, and music signals with the Web Audio API.
- **Four-Voice Tracker** - Sequence pulse lead, chord arpeggio, triangle bass, and noise percussion across four code-defined soundtracks.
- **Coin-Op Attract Mode** - Run a BIOS self-test, accept persistent credits, enable free play, and cycle animated game previews after 30 seconds idle.
- **Local Multiplayer Core** - Split P1 across WASD plus Space and P2 across arrows plus Enter, or hot-plug two gamepads at any time.
- **Co-op and Versus Flagships** - Defend together in two-ship Neon Vector Asteroids, race two runners in Pixel Runner, or play head-to-head Neon Pong.
- **Universal Multiplayer Routing** - Share controls in co-op or alternate 15-second versus relay turns in every single-avatar replica.
- **Infinite Procedural Stages** - Generate deterministic hazards, bosses, speed curves, low gravity, fast bullets, and inverted-control rounds without level assets.
- **Pooled Particle Rendering** - Reuse typed-array particle slots for explosions and sparks without per-burst emitter allocation.
- **Adaptive CRT Persistence** - Blend half-resolution phosphor history with managed bloom, barrel, vignette, scanline, and chromatic passes that shed work as frame rate falls.
- **Declarative Stage Mods** - Register bounded JSON stage hazards, procedural skins, score rules, and lifecycle instructions without executable plugin code.
- **Community Mod Manager** - Drop, paste, select, or fetch bounded JSON manifests over credential-free HTTPS, inspect a live stage preview, and retain validated mods locally.
- **Signed Mod Repository** - Verify canonical SHA-256 content hashes and Ed25519 signatures before caching or registering declarative community stages.
- **Direct P2P Netplay** - Exchange bounded room codes, connect through WebRTC DataChannels, and supply optional STUN or TURN configuration outside the application bundle.
- **Visual Sound Patch Lab** - Shape oscillator or noise effects, preview the result, save patches, and assign them to cabinet effect slots without audio files.
- **Neon Breakout** - Clear deterministic brick fields with paddle spin, boss formations, tiered armor, lasers, multiball, sticky catches, and slow-ball power-ups.
- **Neon Retro Racer** - Drive a generated pseudo-3D highway with curved scanline projection, traffic, five gears, nitro, roadside depth scaling, and synthwave audio.
- **BIOS Telemetry Overlay** - Type `B-I-O-S` to inspect mean and p95 frame time, dropped-frame percentage, quality tier, active scenes, and available heap telemetry.
- **Neon Vector Asteroids** - Fracture procedural rocks, collect minerals, intercept scout UFOs, upgrade weapons, and carry shields through endless stages.
- **Multi-Stage Combat** - Clear endless Space Defenders waves with combo multipliers, adaptive enemy fire, and shield drops.
- **Persistent Arcade Ledger** - Keep the top ten scores for every game and difficulty with safe v2 migration.
- **Cabinet Customization** - Switch among neon, classic woodgrain, cyber, and Amber phosphor themes and remap Player 1 fire control.
- **Fast Initial Entry** - Load a 3.17 kB JavaScript entry, defer the Phaser runtime, and fetch each game scene only when selected.
- **Cross-Platform Native** - Less than 15MB binary size for desktop (macOS, Windows), with native Android APK support.
- **Self-Contained Architecture** - Load zero external ROMs or web fonts and persist high scores locally.

## ⚡ Quick Start

**1. Install Prerequisites:**
- [Node.js 20+](https://nodejs.org/)
- [Rust toolchain](https://rustup.rs/)
- Tauri CLI: `npm install -g @tauri-apps/cli`

**2. Setup & Run:**
```bash
git clone https://github.com/BiosSystem/retro-game-replicas.git
cd retro-game-replicas
npm install
npm run tauri dev
```

## 📖 Deep Technical Details

For comprehensive details on architecture (IPC bridge, capability scoping), deployment, security mechanisms, and the complete feature matrix, please visit the Developer Wiki:

**👉 [View the Developer Wiki](docs/WIKI.md)**

Read the [deep arcade engine architecture](docs/ENGINE_OVERHAUL.md) for rendering, physics, audio, progression, persistence, test, and benchmark decisions.

Read the [open-source architecture synthesis](docs/OPEN_SOURCE_RESEARCH.md) and [declarative modding guide](docs/MODDING.md) before extending renderer or stage systems.

Press `M` or `O` from the cabinet to open the Mod Manager. Import only declarative JSON documents below 64 KiB. Use the same drawer to design and assign procedural sound patches.

---

*Copyright © 2026 BiosSystem | Powered by BiosSystem Kernel*
