# Hosting IRON RIFT

The repository already contains the browser client, 3D assets and Node
WebSocket server. Host the **whole project**, not only `public/`.
The game requires a running Node process; a static host cannot run rooms.

## Local server

Install Node.js 22 or 24 and run `npm start`. Open http://localhost:3000.
`PORT` defaults to 3000. `GET /health` returns JSON process/room health.

## Docker

```powershell
docker build -t iron-rift .
docker run --rm -p 127.0.0.1:3000:3000 iron-rift
```

The existing image uses Node.js 22 and includes the client and material atlas.
There are no npm dependencies to install. Docker build verification still
needs Docker on the selected host.

## Public host requirements

Use a Docker- or Node-capable host with:

- One running instance, with HTTP and WebSocket upgrade forwarding to `PORT`.
- HTTPS and WSS at the same origin; the client selects WSS on HTTPS pages.
- A health check on `/health` and adequate connection/CPU limits.
- `ALLOWED_ORIGIN` set to the exact browser origin, for example
  `https://game.your-domain.example`, with no trailing slash.

Rooms and scores live in process memory. A restart clears matches, and
multiple instances do not share rooms. Do not enable horizontal autoscaling
without distributed room coordination or a room-routing service.
Idle/sleeping hosts can interrupt matches. A local tunnel is temporary and
requires the host PC to stay online; it is not permanent hosting.

The app is a private-room prototype with no account system, persistent
leaderboard, matchmaking service or anti-cheat platform. Its message
size/rate bounds and room limits do not replace a public-launch capacity test.

No provider subscription or running backend is created by these files.
Verify the actual deployment and a two-device match before claiming a live
multiplayer URL.

## Verify source

```powershell
npm run check
npm test
```

Existing tests cover graphics data and two-client WebSocket networking.
