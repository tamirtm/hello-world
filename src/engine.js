// Core rules. Pure functions, no DOM — shared by the UI, the solver and the generator.
//
// The puck slides in a direction until it hits a wall or the board edge.
// A "pad" tile stops the puck when it lands on it. Gems are collected by
// passing over them. Collect every gem to win.

export const EMPTY = 0;
export const WALL = 1;
export const PAD = 2;

export const DIRS = [
  { name: 'up', dx: 0, dy: -1 },
  { name: 'right', dx: 1, dy: 0 },
  { name: 'down', dx: 0, dy: 1 },
  { name: 'left', dx: -1, dy: 0 },
];

export const MAX_GEMS = 12;

/** Build a level object. `cells` is a flat row-major array of EMPTY/WALL/PAD. */
export function makeLevel({ w, h, cells, start, gems }) {
  if (cells.length !== w * h) throw new Error('cells length does not match w*h');
  if (gems.length > MAX_GEMS) throw new Error(`at most ${MAX_GEMS} gems`);
  if (start < 0 || start >= w * h || cells[start] === WALL) throw new Error('bad start');
  const gemAt = new Int8Array(w * h).fill(-1);
  gems.forEach((cell, i) => {
    if (cells[cell] === WALL) throw new Error('gem inside a wall');
    if (cell === start) throw new Error('gem on the start cell');
    if (gemAt[cell] !== -1) throw new Error('duplicate gem');
    gemAt[cell] = i;
  });
  return { w, h, cells: Uint8Array.from(cells), start, gems: [...gems], gemAt };
}

/**
 * Parse an ASCII level. '#' wall, 'o' pad, '*' gem, '@' start, '.' empty.
 * Rows must be the same length.
 */
export function parseLevel(text) {
  const rows = text.trim().split('\n').map((r) => r.trim());
  const h = rows.length;
  const w = rows[0].length;
  const cells = new Array(w * h).fill(EMPTY);
  const gems = [];
  let start = -1;
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error('ragged level rows');
    [...row].forEach((ch, x) => {
      const i = y * w + x;
      if (ch === '#') cells[i] = WALL;
      else if (ch === 'o') cells[i] = PAD;
      else if (ch === '*') gems.push(i);
      else if (ch === '@') start = i;
      else if (ch !== '.') throw new Error(`unknown level char "${ch}"`);
    });
  });
  if (start === -1) throw new Error('level has no start');
  return makeLevel({ w, h, cells, start, gems });
}

export function formatLevel(level) {
  const out = [];
  for (let y = 0; y < level.h; y++) {
    let row = '';
    for (let x = 0; x < level.w; x++) {
      const i = y * level.w + x;
      if (level.cells[i] === WALL) row += '#';
      else if (level.cells[i] === PAD) row += 'o';
      else if (i === level.start) row += '@';
      else if (level.gemAt[i] !== -1) row += '*';
      else row += '.';
    }
    out.push(row);
  }
  return out.join('\n');
}

/**
 * Slide from `pos` in direction `dir` (index into DIRS).
 * Returns the cells entered, in order (empty array if the move is blocked).
 */
export function slidePath(level, pos, dir) {
  const { w, h, cells } = level;
  const { dx, dy } = DIRS[dir];
  let x = pos % w;
  let y = (pos - x) / w;
  const path = [];
  for (;;) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) break;
    const ni = ny * w + nx;
    if (cells[ni] === WALL) break;
    x = nx;
    y = ny;
    path.push(ni);
    if (cells[ni] === PAD) break;
  }
  return path;
}

export function initialState(level) {
  return { pos: level.start, mask: 0 };
}

export function fullMask(level) {
  return (1 << level.gems.length) - 1;
}

export function isWin(level, state) {
  return state.mask === fullMask(level);
}

/**
 * Apply a move. Returns { state, path } or null if the puck cannot move that way.
 * Does not mutate the input state.
 */
export function applyMove(level, state, dir) {
  const path = slidePath(level, state.pos, dir);
  if (path.length === 0) return null;
  let mask = state.mask;
  for (const cell of path) {
    const g = level.gemAt[cell];
    if (g !== -1) mask |= 1 << g;
  }
  return { state: { pos: path[path.length - 1], mask }, path };
}
