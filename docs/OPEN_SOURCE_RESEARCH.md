# Open Source Retro Browser Architecture Research

## Scope and method

Inspect primary project repositories and official browser documentation. Extract architecture patterns without copying source. Preserve upstream license boundaries. In particular, treat the GPL-licensed Pac-Man tribute as design research only and introduce no upstream code or assets.

## Source findings

### Accurate arcade simulation

[Shaun LeBron's Pac-Man tribute](https://github.com/shaunlebron/pacman) separates readable source modules from its production bundle, keeps an arcade-compatible update rate, scales a resolution-independent Canvas presentation, models distinct ghost behavior, and includes a procedural map experiment. Preserve this separation between deterministic rules, render presentation, and generator data. Avoid coupling game rules to CSS pixels or display refresh rate.

[Kontra GameLoop](https://straker.github.io/kontra/api/gameLoop) guarantees fixed 1/60 second updates and separates update from render callbacks. Retain Phaser Arcade Physics at 60 Hz. Clamp long stalls and keep telemetry outside simulation state so diagnostics cannot alter deterministic outcomes.

### Components and plugins

[Kaboom](https://kaboomjs.com/) composes objects from small behavior components and exposes plugins as functions over an explicit engine context. Adopt the narrow-context principle, but do not hand untrusted mods the browser, Phaser scene, DOM, storage, or network objects. Express mod behavior as validated instruction records and dispatch immutable lifecycle events.

### Phaser 4 rendering

[Phaser 4's shader guide](https://github.com/phaserjs/phaser/blob/master/docs/Phaser%204%20Shader%20Guide/Phaser%204%20Shader%20Guide.md) requires renderer-owned wrappers for buffers, textures, programs, and framebuffers. Never mutate the raw WebGL context behind Phaser. Install camera filters through managed filter lists and let Phaser restore resources after context loss.

[Phaser's filter guidance](https://github.com/phaserjs/phaser/blob/master/skills/filters-and-postfx/SKILL.md) describes sequential full-screen passes, managed framebuffer composition, internal and external filter cost, and bloom as threshold plus blur plus additive blending. Keep barrel distortion and vignette to one camera chain. Disable bloom before disabling inexpensive framing effects.

### High-DPI and pixel scaling

[MDN devicePixelRatio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) distinguishes CSS display size from backing-store size. Preserve the logical 640x480 coordinate system and scale the cabinet independently. Use integer-friendly pixel-art presentation rules.

[MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) warns that blindly multiplying by fractional device pixel ratios can create moire artifacts. It recommends a per-pixel VRAM budget and a smaller back buffer as a valid quality tradeoff. Run phosphor history at half resolution and disable the feedback surface entirely on the low tier.

### Audio timing

[MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) recommends scheduling time-sensitive values through AudioParam methods. Keep all voices inside one AudioContext graph and schedule gain and oscillator changes against `currentTime`. Continue the existing 25 ms scheduler with a 100 ms lookahead instead of timing notes from rendered frames.

### Mod validation

[JSON Schema object guidance](https://json-schema.org/understanding-json-schema/reference/object) documents explicit property allow-lists and rejection of unevaluated properties. Apply the same closed-schema rule manually to avoid a runtime dependency. Reject unknown fields, executable strings, invalid identifiers, oversized JSON, excessive hooks, excessive actions, unsafe colors, and numeric values outside engine bounds.

## Implemented architecture

### CRT processing

Define the programmable shader contract in `src/graphics/shaders/crtShaders.ts`. Combine barrel distortion, RGB sampling offsets, scanline modulation, vignette attenuation, and previous-frame persistence in one fragment contract.

Use Phaser-managed external filters for production bloom, barrel distortion, and vignette. Use a half-resolution two-canvas feedback pair for phosphor history. Swap read and write surfaces without per-frame element allocation. Disable bloom at medium quality. Disable all persistence and filter passes at low quality. Disable persistence under reduced motion.

### Mod runtime

Accept at most 64 KiB of JSON per registration. Register at most 32 mods. Allow at most 64 custom hazards, 16 hooks, and 16 actions per hook. Support stage hazard records, two-color procedural skins, score scaling, bounded hazard spawns, and existing procedural audio effect triggers.

Expose `window.arcadeMods.register(json)`, `window.arcadeMods.unregister(id)`, and `window.arcadeMods.list()`. Expose no evaluator, dynamic import, Function constructor, DOM handle, storage handle, fetch handle, or scene reference. Treat instruction lists as the lightweight scripting layer.

### Community tools and Breakout expansion

Place the user-facing import controller at the cabinet layer and keep the runtime API unchanged. Reuse the closed schema for local files, drops, pasted text, HTTPS responses, and stored documents so no ingestion path gains extra authority. Show a Canvas preview derived only from validated records.

Generate Neon Breakout bricks, palettes, power-up drops, walls, and boss formations from deterministic stage data. Preserve simulation speed after paddle contact by normalizing the reflection vector. Use active declarative hazards and skin colors as bounded generator inputs rather than scene scripts.

### Telemetry

Store 240 frame durations in one fixed Float32Array ring. Calculate mean frame time, p95 frame time, estimated FPS, and the percentage of frames slower than the 55 FPS budget. Show active quality, active scene count, sample count, and heap data when the browser exposes it. Toggle the overlay by typing `B-I-O-S`.

## Rejected patterns

- Reject raw WebGL calls because they can desynchronize Phaser 4 state and break context recovery.
- Reject `eval`, Function constructors, remote scripts, and arbitrary JavaScript mods.
- Reject full-resolution historical frame buffers on low-power devices.
- Reject frame-rate-dependent audio or simulation timing.
- Reject copied sprite, audio, shader, or level assets from researched projects.
