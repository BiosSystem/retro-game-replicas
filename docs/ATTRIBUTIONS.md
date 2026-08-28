# Attribution and License Register

## Incorporated runtime software

| Component | Use | License | Source |
|---|---|---|---|
| Phaser | Existing game runtime and built-in Nine Slice game object | MIT | https://github.com/phaserjs/phaser |

Generate the 12 by 12 panel texture at runtime. Bundle no third-party UI sprites, icons, fonts, or avatar images in this milestone.

## Evaluated permissive options

| Project | License | Decision |
|---|---|---|
| DiceBear core | MIT | Do not add the dependency. Keep deterministic player avatars local, procedural, and below the bundle budget. |
| DiceBear Pixel Art style | CC0 1.0 | Keep as a validated future option only. Incorporate no style data or artwork now. |
| Kenney assets | CC0 1.0 | Keep as a future optional asset-pack source only. Incorporate no raster pack now. |
| Press Start 2P | SIL Open Font License 1.1 | Keep as a future opt-in font. Preserve the zero-download system monospace stack now. |

Verify licenses from these project sources before changing versions or incorporating content:

- https://www.dicebear.com/licenses/
- https://github.com/dicebear/dicebear
- https://kenney.nl/assets
- https://github.com/google/fonts/tree/main/ofl/pressstart2p

## Project-generated content

Generate avatars, panel textures, HUD frames, game sprites, levels, music, and effects from repository code. Attribute these implementations to BiosSystem under the repository MIT license.
