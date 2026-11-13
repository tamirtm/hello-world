# hello-world

Two separate projects live here for now:

- **[Tab](tab/)** — friend wager tracker (Expo + TypeScript). Phase 0, the odds calculator, is built and awaiting review.
- **Glide** — a small browser puzzle game, described below.

---

# Glide

A small puzzle game for the browser. Slide the puck — it keeps going until it
hits a wall or the edge. Glide over every gem to clear the board, and try to
match **par** (the provably shortest solution).

- **Endless levels** — procedurally generated, every one verified solvable by an exact solver, with a difficulty ramp from 6×6 / 2 gems up to 10×10 / 6 gems.
- **Daily puzzle** — the same board for everyone each day, with a streak counter and a shareable result.
- **Hints, undo, dead-end detection** — the solver runs live in the page.
- **Works offline** and installs to a phone home screen (service worker + manifest).
- **Zero dependencies**, no build step. Plain HTML, CSS and ES modules.

## Play

```sh
npm start        # http://localhost:5173
```

Swipe or use arrow keys / WASD. `Z` undo, `R` restart, `H` hint.

To publish it, enable GitHub Pages for the repo (Settings → Pages → deploy from
branch, root folder) — the app is fully static and uses only relative URLs.

## Develop

```sh
npm test         # unit tests (node:test, no install needed)
npm run e2e      # browser smoke test; needs Playwright installed
```

| Path | What it is |
| --- | --- |
| `src/engine.js` | Rules: sliding, pads, gem collection. Pure functions. |
| `src/solver.js` | Breadth-first exact solver (hints, par, dead-end checks). |
| `src/generator.js` | Seeded level generator; keeps candidates whose par fits the target range. |
| `src/levels.js` | Difficulty curve, daily puzzle, stars, streaks. |
| `src/ui.js` | DOM rendering, input, persistence wiring. |
| `sw.js` | Offline cache (network-first). |

Design choices and their reasons are logged in [DECISIONS.md](DECISIONS.md).
