# IRON RIFT v0.3 — FOUNDRY ASCENDANT

A free, independent **3D sci-fi browser multiplayer game prototype** for Windows, macOS, Linux, Android and iOS browsers with WebGL and WebSocket support. Designed for **4–8 players per room**. It is not an AAA Call of Duty/PUBG-equivalent game.

## Graphics changes

- Foundry Ascendant map: 16 original procedurally generated material tiles, detailed reactor assembly, industrial pipes, overhead trusses, animated emissive lighting, industrial ventilator facades, futuristic readout panels and brighter ambient shading.
- **RIFT-03 fictional energy blaster:** layered 3D view model, circular emitter coils, cyan/amber accents and brief firing animation.
- Higher contrast/legibility than v0.2 with softly illuminated teal and amber factory areas.
- The original game loop and networking remain unchanged. Decorations do not add new collision geometry.
- Graphics profiles: AUTO, LOW, BALANCED, HIGH. LOW limits canvas resolution and shader detail (not mesh count).

## Windows 11: Start the game

1. Extract this ZIP to a folder such as `C:\Games\IRON_RIFT_v0.3`.
2. Install [Node.js](https://nodejs.org/) 20 or newer if not installed.
3. Double-click `start_windows.bat` inside `iron-rift-multiplayer`, or open CMD there and run `npm start`.
4. Open `http://localhost:3000` on the host PC.
5. Enter your callsign, choose a graphics profile, and click **CREATE PRIVATE MATCH**.
6. To join, open the same game server URL on a second browser/device, enter the 6-character code, and click JOIN.

### PC and mobile on different internet connections (temporary test)

Keep the Node.js server running. In a separate CMD window, from the directory containing your own cloudflared.exe, run:

```bat
cloudflared.exe tunnel --url http://localhost:3000
```

Use the new **HTTPS trycloudflare.com URL** on both devices (not localhost on your phone). The first player creates a match; the other joins with the code. Keep the PC and tunnel windows open during the match. Quick Tunnel URLs are temporary and unsuitable for permanent public hosting.

### Controls

| Action | Desktop | Touch device |
|---|---|---|
| Move | WASD | Left virtual joystick |
| Aim/look | Move mouse after clicking game | Drag right side of screen |
| Fire fictional energy blast | Left click | FIRE button |
| Run | Shift | RUN button |
| Jump | Space | JUMP button |
| Scoreboard | Tab | SCOREBOARD button |

Use landscape mode on phones. On lower-powered devices choose LOW visuals to reduce render resolution; don't expect AAA graphics on all browsers.

## Files

- `public/graphics.js`: procedural arena, CPU mesh generation, shader and blaster view model.
- `public/assets/foundry-materials.png`: 1024×1024 original 16-material atlas.
- `tools/generate_atlas.py`: optional atlas regeneration (requires Pillow + NumPy).
- `server.mjs`: unchanged real-time multiplayer backend, HTTP server, in-memory rooms and authoritative state.
- `shared/world.mjs`: unchanged map collision shapes and spawn coordinates.
- `public/app.js`: client networking, input and HUD.
- `public/index.html`, `public/style.css`: updated UI.
- `tests/graphics.test.mjs`: smoke checks on geometry and mock rendering, **not** a GPU test.
- `tests/network.test.mjs`: HTTP and two WebSocket clients, room joining, movement, scoring and disconnect.

## Verify

For permanent server requirements and Docker commands, see [HOSTING.md](HOSTING.md).

From the game project directory:

```bat
npm run check
npm test
```

These pass in development tests and confirm correct JavaScript syntax, finite geometry and WebSocket networking logic. They do **not** prove the game renders in your hardware, or that mobile browser performance and public hosting are reliable. Real browser GPU/screenshot testing could not be completed in this execution environment.

## Safety and scope

This is a stylized sci-fi arcade prototype. There are no gore graphics or real-world weapon models. Never share private API keys, credentials or personal details when posting game source code publicly. Before a public launch, add production-grade WebSocket transport, rate limits and auth, HTTPS/WSS hosting and performance profiling across devices.
