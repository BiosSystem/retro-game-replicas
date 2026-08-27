# Declarative Stage Modding

Press `M` or `O` to open the cabinet Mod Manager. Drop a JSON file, select a local file, paste a manifest, or import one from a credential-free HTTPS URL. Validate and inspect the Canvas preview before activation. Validated manifests persist in local storage and hydrate on the next launch.

Register a mod directly after the arcade boots when developing in the console:

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
- `BOSS_ENTRY`
- `POWER_UP`

Use these instructions:

- `SCALE_SCORE` with a factor from 0.5 through 3.
- `SPAWN_HAZARD` with a lane from 0 through 7 and a `SPIKE`, `DRONE`, or `WALL` kind.
- `PLAY_EFFECT` with an existing procedural audio effect name.
- `PLAY_PATCH` with the identifier of a sound patch saved in the cabinet patch lab.

Keep identifiers lowercase and use semantic versions. Keep each JSON document below 64 KiB. Register no more than 32 mods. Supply only declared fields. Reject executable JavaScript, HTML, unknown properties, invalid colors, and values outside documented limits.

List active mods with `window.arcadeMods.list()`. Remove one with `window.arcadeMods.unregister("neon-trials")`.

Use the Sound Patch panel to select square, sawtooth, triangle, sine, pulse, or noise generation. Bound start and end frequency, duration, attack, decay, pulse duty, filter cutoff, and gain through the editor. Preview the synthesized result, save it under a lowercase identifier, then assign it to laser, explosion, coin, power-up, or stage-clear playback.

Do not import JavaScript, remote modules, data URLs, credential-bearing URLs, redirected documents, or JSON larger than 64 KiB. Treat local storage as convenience persistence, not a trust boundary. Revalidate every stored document during hydration.

## Signed repository packages

Wrap a declarative manifest in this closed envelope:

```json
{
  "version": 1,
  "manifest": {},
  "sha256": "64 lowercase hexadecimal characters",
  "publicKey": "base64 encoded 32-byte Ed25519 public key",
  "signature": "base64 encoded 64-byte Ed25519 signature"
}
```

Canonicalize the inner manifest by sorting every object key and retaining array order. Calculate SHA-256 over the canonical UTF-8 bytes. Sign the same bytes with Ed25519. Serve the envelope through credential-free HTTPS below 96 KiB.

Use `VERIFY + IMPORT` in the Mod Manager. Reject unsigned envelopes, hash mismatches, invalid signatures, unknown fields, redirects, oversized responses, and invalid inner schemas. Treat a valid signature as proof that the package holder controls the included key, not as automatic publisher identity. Pin and compare the public-key fingerprint through a trusted external channel before trusting a publisher name. Keep all imported behavior inside the declarative instruction set. Never execute signed JavaScript.

## Visual Mod Studio

Press `V` or use `VISUAL STUDIO` in the Mod Manager. Add event, hazard, score, effect, and stage-patch nodes. Drag nodes to arrange the graph. Select two nodes to create a directed edge. Compile only acyclic graphs that are reachable from an event node.

Compile the graph into the existing API version 1 manifest schema. Validate every generated field through the same closed-schema parser used for imported files. Sign the canonical manifest bytes with an in-memory Ed25519 session key and copy the declarative JSON envelope from the output panel. Treat that session key as an authoring convenience, not a persistent publisher identity. Pin a separately managed public-key fingerprint before distributing trusted releases.

Keep the graph below 64 nodes and 128 edges. Never embed scripts, functions, HTML, URLs, binary blobs, or executable expressions in a node.
