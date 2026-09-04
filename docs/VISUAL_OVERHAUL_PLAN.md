# Visual Overhaul Plan

## Outcome

Transform BiosSystem Neon Arcade from a mechanics-first procedural collection into a coherent premium retro arcade experience. The target is not photorealism: it is authored, readable, animated 2D game art that looks good with the CRT pass disabled and becomes more distinctive when the cabinet presentation is enabled.

This plan preserves original gameplay, fixed-step rules, accessibility, offline play, and the 640 by 480 cabinet surface. It replaces placeholder-like wireframes, empty grids, and text-heavy first frames with a reusable visual production system.

## Current audit

| Area | Current state | Required change |
|---|---|---|
| Environment | Many scenes use a solid background plus a grid or lines. | Give every game three visual depth planes: environment, playfield, and foreground atmosphere. |
| Characters and objects | Players, enemies, bullets, and pickups are mostly primitive Phaser shapes. | Introduce compact original sprite sheets, silhouette rules, idle and action animation, and clear hit feedback. |
| Effects | CRT, pooled particles, and hit feedback exist, but are not a complete art direction. | Add reusable trails, impact bursts, debris, spawn effects, weather, and screen feedback. |
| UI | HUD text competes with gameplay, especially during startup. | Reserve the central playfield for action, use a compact HUD, and make information reveal itself only when it matters. |
| Catalog | Visual quality varies widely across 32 entries. | Upgrade in tiers, starting with flagships that establish reusable systems. |

## Non-negotiable constraints

- Use only original art. Do not copy ROM, arcade cabinet, character, sprite, or logo art.
- Maintain a raw 640 by 480 Phaser render surface, 60 FPS target, fixed-step simulation, keyboard and controller input, and browser-safe fallbacks.
- Treat CRT as optional presentation. A raw framebuffer capture must meet the art bar.
- Keep the entire built output at or below 1,950,000 bytes.
- Preserve lazy scene loading. A scene may only load its art when selected.
- Preserve color-contrast, reduced-motion, and low-quality fallbacks.

## Bundle recovery gate

The pre-overhaul production baseline was 1,948,775 bytes, leaving 1,225 bytes. Replacing the unused full Phaser distribution with its Arcade Physics-only distribution recovered 106,214 bytes. The current measured production output is 1,854,517 bytes, leaving 95,483 bytes beneath the release ceiling after three scene-local original background plates.

The 250 KB recovery target remains the preferred headroom for the catalog-wide sprite rollout; it is not yet met. Until then, every visual PR must remain beneath the 1.95 MB ceiling and report:

1. total production bytes;
2. bytes added by its scene-local assets;
3. 60 FPS desktop and low-quality fallback results; and
4. a raw framebuffer capture, without CRT, proving that the art does not depend on post-processing.

## Art bible

### Shared language

- Native authored scale: 320 by 240 for background plates and 16, 24, or 32 pixel sprite cells, displayed with integer scaling.
- Each game receives an 8 to 16 color palette, one gameplay accent color, one danger color, and a dark non-black background ramp.
- Gameplay-critical shapes must read at a glance: player, threat, projectile, pickup, and collision space all use distinct silhouette, value, and motion.
- Backgrounds use low-contrast detail; bullets, objectives, and player actions use high-contrast detail.
- Every flagship requires idle, movement, attack, hit, and destruction states for its main actor classes.

### Scene composition

Every revised scene must include:

1. a background layer with a location-specific silhouette or horizon;
2. a middle layer that establishes playfield geometry;
3. a foreground layer for framing, weather, fog, cables, foliage, machinery, or debris;
4. persistent ambient motion that does not affect gameplay readability; and
5. a clear central action zone occupying at least 70 percent of the screen.

## Shared implementation workstream

Create these reusable modules before upgrading the catalog broadly:

| Module | Responsibility |
|---|---|
| `ArcadeVisualTheme` | Palette tokens, scene grades, HUD skin, contrast modes, and reduced-motion settings. |
| `LayeredBackdrop` | Three-plane backgrounds, parallax, palette cycling, weather, horizon fog, and safe playfield masks. |
| `ArcadeSpriteBank` | Scene-local atlas loading, animation registration, texture-key ownership, and compact asset metadata. |
| `CombatVfx` | Pooled trails, impact bursts, sparks, debris, spawn portals, charge effects, and damage flashes. |
| `ArcadeCameraFeedback` | Bounded hit-stop, shake, flash, zoom punch, and accessibility-safe reduced-motion variants. |
| `VisualRegression` | Browser captures at title, early action, and high-action states with a reviewable image baseline. |

Each module must use pooling or bounded collections. No new effect may allocate unbounded particles or perform expensive full-frame canvas uploads.

## Catalog delivery order

### Tier 1: flagship benchmark scenes

| Game | Visual direction | Delivery status |
|---|---|---|
| Neon Relay | Rainy cyberpunk rooftop defense, animated city depth, turret/ship sprites, drones, weather, projectile trails, impact lighting. | Original rooftop environment implemented; actor and VFX pass remains. |
| Neon Vector | Premium vector combat with bold ships, meteor materials, dense combat readability, layered star fields, and responsive weapon effects. | Original deep-space environment and HUD spacing implemented; actor/material pass remains. |
| Neon Epoch | A procedural neon ecosystem with authored terrain motifs, water, foliage, weather, creatures, and readable world-state feedback. | Original wetland environment and restrained bioluminescent simulation layer implemented; world-state art pass remains. |

Tier 1 establishes the visual benchmark. It is complete only when each game has a strong raw-frame screenshot during active play, not only a title or wave-zero screen.

### Tier 2: action and perspective cabinets

| Game | Required art treatment |
|---|---|
| Neon Breaker | Brick materials, animated power-ups, impact shards, energetic arena backdrop. |
| Cyber-Racer | Hand-authored road-side props, skyline variants, vehicle sprites, weather, exhaust, boost trail. |
| Neon Cyber-Caster | Textured dungeon modules, enemy silhouettes, pickups, muzzle flash, distance fog. |
| Neon Danmaku | Boss sprites, patterned bullet families, spell-card backgrounds, readable danger gradients. |
| Neon Labyrinth | Tileset, room themes, character states, pickups, environmental animation. |
| Neon Kombat | Distinct fighters, arenas, hit frames, cloth/cape visual integration, dramatic round transitions. |
| Prism Spiral | Orbital arena materials, enemy forms, radial effects, shield impacts, evolving wave spectacle. |

### Tier 3: classic cabinet refresh

Upgrade Snake Evolution, Neon Pong, Froggie Crosser, Space Defenders, Tetris Pulse, Minesweeper, Pixel Runner, Brave Bird, and Cyber Chasm with compact tile/sprite kits, motion states, themed backgrounds, and a quiet common HUD. Neon Vector is delivered in Tier 1.

### Tier 4: procedural worlds

Upgrade Neon Odyssey, Neon Chrono, Neon Paradox, Neon Nexus, Neon Genesis, Neon OS, The Singularity, and Event Horizon with authored material libraries and atmospheric layers. Preserve procedural generation, but use it to arrange designed building blocks rather than draw only abstract geometry. Neon Epoch is delivered in Tier 1.

### Tier 5: hubs, studios, and runtime experiences

Refresh Meta-Arcade Hall, Tracker Studio, Decal Workshop, and the Cartridge Player. These surfaces need strong layout, cabinet art, previews, and clear hierarchy, but must never be marketed as flagship gameplay screenshots.

## Milestones

### V0 — visual platform and budget recovery

- Recover the remaining 143,786 bytes toward the 250 KB headroom target while retaining the 1.95 MB release ceiling. (106,214 bytes recovered.)
- Add `ArcadeVisualTheme`, `LayeredBackdrop`, `CombatVfx`, and visual regression capture support.
- Publish the art bible, scene palette registry, and asset-size manifest.
- Verify standard, low-quality, and reduced-motion modes.

### V1 — Neon Relay completion

- Keep the newly implemented original rooftop background.
- Add player, drone, projectile, and objective sprite states.
- Add rain, puddle reflections, hologram flicker, trail, and impact passes.
- Capture a gameplay screenshot after action begins; remove all zero-action marketing captures.

### V2 — Neon Vector and Neon Epoch

- Convert both flagships to the shared visual system.
- Add compact atlases and scene-specific effect packs.
- Establish visual-performance benchmarks for sparse and high-action states.

### V3 — action cabinet batch

- Deliver Tier 2 in small independently testable PRs.
- Reuse the flagships' rendering modules; prohibit bespoke, unpooled effect code.

### V4 — classic and world batches

- Deliver Tiers 3 and 4 by reusable genre kit: grid, platform, racer, raycast, orbital, and world kits.
- Keep procedural systems deterministic while replacing placeholder shapes with designed art blocks.

### V5 — presentation and launch readiness

- Refresh hub/studio experiences.
- Rebuild the README gallery from active-game captures only.
- Add a visual QA checklist to release validation.

## Definition of done for every game

- Raw, non-CRT frame has a readable setting, a distinct palette, and active gameplay within the first three seconds.
- Player, enemy, projectile, pickup, and hazard are distinguishable by silhouette and value, not color alone.
- At least three depth layers and two forms of ambient motion are present without obscuring the playfield.
- Main actors have movement, action, hit, and destruction feedback.
- HUD occupies no more than the top and bottom safe bands during normal play.
- Unit, browser, and visual-regression tests pass.
- Bundle baseline remains at or below 1,950,000 bytes, with asset bytes recorded.
- The capture used for documentation is an active gameplay frame and accurately represents the shipped scene.

## Current status

The local `feat/v2.6-relay-visual-foundation` branch now contains three scene-local original environment benchmarks: Neon Relay's rainy rooftop, Neon Vector's deep-space combat frame, and Neon Epoch's bioluminescent wetland. The Arcade Physics-only Phaser runtime recovery provides 95,483 bytes of current release headroom. TypeScript lint, 360 Vitest tests, the cartridge runtime Playwright test, and the production baseline all pass. This is an implemented visual foundation, not a completed catalog overhaul: shared art systems, actor sprites, action VFX, accessibility-mode visual validation, and every remaining cabinet are still planned work.
