// Procedural level generator. Deterministic for a given (seed, options).
//
// Strategy: scatter walls and pads, pick a start, drop gems only on cells the
// puck can actually enter, then run the exact solver. Keep the first candidate
// whose optimal solution length ("par") lands in the wanted range; otherwise
// fall back to the closest solvable candidate seen.

import { EMPTY, WALL, PAD, makeLevel } from './engine.js';
import { rngFromString, randInt, shuffle } from './rng.js';
import { solve, reachableCells } from './solver.js';

export const DEFAULT_OPTIONS = {
  w: 7,
  h: 7,
  gems: 3,
  wallDensity: 0.14,
  pads: 2,
  minPar: 4,
  maxPar: 8,
  maxAttempts: 300,
};

function candidate(rng, o) {
  const n = o.w * o.h;
  const cells = new Array(n).fill(EMPTY);
  for (let i = 0; i < n; i++) if (rng() < o.wallDensity) cells[i] = WALL;

  const open = [];
  for (let i = 0; i < n; i++) if (cells[i] === EMPTY) open.push(i);
  if (open.length < o.gems + o.pads + 1) return null;
  shuffle(rng, open);

  const start = open.pop();
  for (let p = 0; p < o.pads; p++) cells[open.pop()] = PAD;

  const bare = makeLevel({ w: o.w, h: o.h, cells, start, gems: [] });
  // Gems never sit on pads: the two glyphs overlap and read badly.
  const spots = [...reachableCells(bare)]
    .filter((c) => c !== start && cells[c] !== PAD)
    .sort((a, b) => a - b);
  if (spots.length < o.gems) return null;
  shuffle(rng, spots);
  const gems = spots.slice(0, o.gems).sort((a, b) => a - b);

  return makeLevel({ w: o.w, h: o.h, cells, start, gems });
}

/**
 * Generate a solvable level. Returns { level, par, solution, seed, attempts, inRange }.
 * Throws only if no solvable candidate was found at all (practically never with sane options).
 */
export function generate(seed, options = {}) {
  const o = { ...DEFAULT_OPTIONS, ...options };
  let best = null;
  let bestDist = Infinity;

  for (let attempt = 0; attempt < o.maxAttempts; attempt++) {
    const rng = rngFromString(`${seed}#${attempt}`);
    const level = candidate(rng, o);
    if (!level) continue;
    const solution = solve(level);
    if (!solution) continue;
    const par = solution.length;
    const dist = par < o.minPar ? o.minPar - par : par > o.maxPar ? par - o.maxPar : 0;
    if (dist < bestDist) {
      bestDist = dist;
      best = { level, par, solution, seed, attempts: attempt + 1, inRange: dist === 0 };
      if (dist === 0) break;
    }
  }
  if (!best) throw new Error(`could not generate a solvable level for seed "${seed}"`);
  return best;
}
