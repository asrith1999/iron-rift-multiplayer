# IRON RIFT v0.2 / Foundry Reforged — changes

## Graphics
- Replaced simple cube-only world renderer with a textured, baked static-mesh WebGL scene.
- Added 1,030 procedural industrial scene objects and an original 8-material texture atlas.
- Added industrial floor panels, lighting fixtures, wall detail, utility pipes, elevated gantries, more detailed blockers, central reactor and factory skyline.
- Added directional lighting, glow accents, atmospheric distance fog and updated color mapping.
- Redesigned the player and first-person blaster from box meshes.
- Added AUTO, LOW, BALANCED and HIGH visual presets.

## Interface
- Updated menu branding to FOUNDRY REFORGED / v0.2.
- Improved neon-accented menu, room panel, HUD, scoreboard and crosshair.

## Multiplayer
- Preserved WebSocket room and simulation architecture.
- Preserved authoritative obstacle collision footprints in shared/world.mjs.
- Excluded the 55 MB separately downloaded cloudflared executable from the ZIP.

## Verification performed
- `npm run check` : PASS
- `npm test` : PASS (HTTP app + texture asset, WebSocket create/join, movement, scoring, disconnect)
- Renderer logic smoke : PASS (1,030 geometry objects, 38,808 static vertices, no render logic exceptions with a mocked WebGL context)
- Actual GPU screenshot test in this environment: NOT VERIFIED (headless graphics environment unavailable)
- Physical mobile/Safari FPS and graphics tests: NOT VERIFIED

## Known limitations
- Hand-built stylized WebGL geometry, NOT film-quality AAA graphics.
- Some newly added decoration is visual-only and not part of server collision, so minor clipping is possible.
- Rooms exist only while server runs and player(s) remain connected.
