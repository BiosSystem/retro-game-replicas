# Declarative Stage Modding

Register a mod after the arcade boots:

```js
window.arcadeMods.register(JSON.stringify({
  apiVersion: 1,
  id: "neon-trials",
  name: "Neon Trials",
  version: "1.0.0",
  stage: {
    hazards: [{ lane: 2, offset: 0.5, speed: 1.4, kind: "DRONE" }],
    skin: { primary: "#00ffcc", secondary: "#ff2255" }
  },
  hooks: [
    { event: "SCORE_UPDATE", actions: [{ type: "SCALE_SCORE", factor: 1.25 }] },
    { event: "STAGE_CLEAR", actions: [{ type: "PLAY_EFFECT", effect: "POWER_UP" }] }
  ]
}));
```

Use these event names:

- `SPAWN`
- `COLLISION`
- `SCORE_UPDATE`
- `STAGE_CLEAR`

Use these instructions:

- `SCALE_SCORE` with a factor from 0.5 through 3.
- `SPAWN_HAZARD` with a lane from 0 through 7 and a `SPIKE`, `DRONE`, or `WALL` kind.
- `PLAY_EFFECT` with an existing procedural audio effect name.

Keep identifiers lowercase and use semantic versions. Keep each JSON document below 64 KiB. Register no more than 32 mods. Supply only declared fields. Reject executable JavaScript, HTML, unknown properties, invalid colors, and values outside documented limits.

List active mods with `window.arcadeMods.list()`. Remove one with `window.arcadeMods.unregister("neon-trials")`.
