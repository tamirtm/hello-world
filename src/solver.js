// Breadth-first solver over (position, collected-gems) states.
// The state space is tiny (cells * 2^gems), so this is exact and fast enough
// to run in the browser for hints and inside the generator for every candidate.

import { DIRS, applyMove, fullMask, initialState } from './engine.js';

/**
 * Shortest solution from `from` (defaults to the level start).
 * Returns an array of direction indices, [] if already solved, or null if unsolvable.
 */
export function solve(level, from = initialState(level)) {
  const g = level.gems.length;
  const goal = fullMask(level);
  if (from.mask === goal) return [];

  const size = (level.w * level.h) << g;
  const prev = new Int32Array(size).fill(-1);
  const prevDir = new Int8Array(size);
  const key = (s) => (s.pos << g) | s.mask;

  const startKey = key(from);
  prev[startKey] = startKey;
  let frontier = [from];

  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      const k = key(s);
      for (let d = 0; d < DIRS.length; d++) {
        const res = applyMove(level, s, d);
        if (!res) continue;
        const nk = key(res.state);
        if (prev[nk] !== -1) continue;
        prev[nk] = k;
        prevDir[nk] = d;
        if (res.state.mask === goal) {
          const moves = [];
          for (let c = nk; c !== startKey; c = prev[c]) moves.push(prevDir[c]);
          return moves.reverse();
        }
        next.push(res.state);
      }
    }
    frontier = next;
  }
  return null;
}

/** All cells the puck can ever enter from the start (ignores gems). */
export function reachableCells(level) {
  const seenStop = new Uint8Array(level.w * level.h);
  const entered = new Set();
  const stack = [level.start];
  seenStop[level.start] = 1;
  const probe = { pos: 0, mask: 0 };
  while (stack.length) {
    probe.pos = stack.pop();
    for (let d = 0; d < DIRS.length; d++) {
      const res = applyMove(level, probe, d);
      if (!res) continue;
      for (const c of res.path) entered.add(c);
      const end = res.state.pos;
      if (!seenStop[end]) {
        seenStop[end] = 1;
        stack.push(end);
      }
    }
  }
  return entered;
}
