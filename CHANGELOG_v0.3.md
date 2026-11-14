# IRON RIFT v0.3 / FOUNDRY ASCENDANT

## Added
- New detailed procedural industrial modules: wall-mounted readouts, inset vents, conduit tracks, painted titanium trim, metallic piping, suspended display screens, ceiling trusses and overhead fan housings.
- 16 custom-created procedural atlas materials (4×4, 1024×1024 PNG). New material choices include titanium, ventilation grilles, circuitry, ceramics, copper pipes, illuminated displays and gold accents.
- Center reactor assembly with concentric glowing rings and light tubes over the existing collision block.
- New original RIFT-03 sci-fi energy blaster view-model with concentric coils, emissive accent bands, modular casing and animated pulse.
- Updated fragment shader with brighter ambient lighting, local teal/amber practical lights, stronger material highlights and more legible fog.
- Updated menu, HUD and in-game weapon label.
- Geometry smoke test for static mesh integrity, quality presets and rendering call path; test covers finite vertex data and all 16 material indices.

## Preserved
- Backend and networking architecture from v0.2 unchanged.
- 6-character private room codes, 8-player maximum, authoritative movement, simple scoring and WebSocket events.
- Existing server collision footprints (decorative geometry remains mostly visual).
- Desktop keyboard/mouse and mobile touch controls. Quality settings AUTO/LOW/BALANCED/HIGH remain available.

## Known limits
- This is a custom WebGL 1.0 stylized game with enhanced procedural detail, not imported AAA character models or physically based engine rendering.
- Geometry/render functions were verified in a mocked GL environment. A real headless GPU/browser test was attempted but WebGL is unavailable in the test environment. Please verify on a real Windows browser and mobile Safari/Chrome.
- The local Cloudflare quick-tunnel setup is temporary and needs a running host PC; the public URL changes after restart.
- Mobile graphics and FPS may vary. Set the visual profile to LOW when necessary.
- Extra details above walls/ceilings may not have collision because shared multiplayer collision footprints were intentionally unchanged.
