# AGENTS.md

Vanilla HTML5 Canvas Asteroids clone. No framework, no bundler, no dependencies, no build step.

## Running / verifying

- Open `index.html` directly, or `npx serve .` then visit the served URL. There is no test, lint, typecheck, or build command — verify changes by loading the page in a browser.
- `game.js` is loaded by `index.html` via a plain `<script src>` (not a module). Top-level `const`/`class` are global; keep the file self-contained and avoid ES module syntax.

## Architecture

- All game logic lives in the single file `game.js`; `index.html` only holds the canvas element and CSS. Editing gameplay means editing `game.js`.
- Fixed 800x600 world. `W`/`H` in `game.js:5-6` must stay in sync with the `<canvas width height>` in `index.html:23`.
- Space is toroidal: positions wrap via `wrap(v, max)` (`game.js:27`). Any new moving entity must wrap, not clamp.
- Main loop (`game.js:414`) clamps `dt` to 0.05s; all movement is `dt`-scaled — keep it that way.
- State machine `state` is one of `playing | dead | gameover`; `update()` branches per state before normal play.

## Conventions

- Input: `keys[code]` for held keys, `pressed(code)` for one-shot edges (`justPressed` is cleared on read). Use `pressed()` for fire/restart, `keys[]` for rotation/thrust.
- Asteroid size indices 1-3 index into `RADII`, `SPEEDS`, `POINTS` (`game.js:61-63`). Size 3 splits to 2, 2 splits to 1, 1 is destroyed.
- Entities are plain classes with `update(dt)` / `draw()` and a `dead` flag; the loop filters dead objects each frame. Follow this pattern for new entities.
- README, UI strings, and HUD text are in Spanish (`NIVEL`, `PUNTAJE`). Keep user-facing text Spanish.
