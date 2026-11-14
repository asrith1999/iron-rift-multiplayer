# Manus source-export status

The uploaded `Iron Rift FPS.zip` was inspected before this independent prototype was built. It contained **29 top-level files**, including `main.ts`, `ui.ts`, `main.css`, `smoke.mjs`, `leaderboard.js`, SQL config fragments, documentation, and Manus task metadata.

The following original source folders/files referenced in the provided scripts were **not provided**:
- `src/engine/*`
- `src/game/*`
- `src/ui/sparks.ts`
- `src/i18n/*`
- `public/assets/*` and `public/fonts/*`
- `package.json`, Vite configuration, and package lock file.

As a result, the uploaded content could not be reliably assembled or built as the original production game. This implementation is a self-contained prototype using an original browser WebGL renderer and custom server rather than an altered build of the original Manus code.

**For a faithful merge later:** export the original full workspace recursively, including `src/`, `public/`, `package.json`, `vite.config.ts`, and all game asset files, while excluding secrets and generated dependencies. Then port the network room protocol/server authority from this project into the proper original game engine, replacing the minimal transport with a maintained library before public deployment.
