import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLevel, formatLevel, slidePath, applyMove, initialState, isWin, makeLevel } from '../src/engine.js';
import { solve, reachableCells } from '../src/solver.js';

const UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;

test('parse/format round-trips', () => {
  const text = ['@..#', '.o*.', '...*'].join('\n');
  assert.equal(formatLevel(parseLevel(text)), text);
});

test('slides until the edge', () => {
  const lvl = parseLevel('@....');
  assert.deepEqual(slidePath(lvl, 0, RIGHT), [1, 2, 3, 4]);
  assert.deepEqual(slidePath(lvl, 0, LEFT), []);
  assert.deepEqual(slidePath(lvl, 0, UP), []);
});

test('stops before a wall and on a pad', () => {
  assert.deepEqual(slidePath(parseLevel('@..#.'), 0, RIGHT), [1, 2]);
  assert.deepEqual(slidePath(parseLevel('@.o..'), 0, RIGHT), [1, 2]);
});

test('collects gems passed over without stopping', () => {
  const lvl = parseLevel('@*.*.');
  const res = applyMove(lvl, initialState(lvl), RIGHT);
  assert.equal(res.state.pos, 4);
  assert.equal(res.state.mask, 0b11);
  assert.ok(isWin(lvl, res.state));
});

test('blocked move returns null and state is not mutated', () => {
  const lvl = parseLevel('@*');
  const s = initialState(lvl);
  assert.equal(applyMove(lvl, s, DOWN), null);
  applyMove(lvl, s, RIGHT);
  assert.deepEqual(s, { pos: 0, mask: 0 });
});

test('makeLevel rejects invalid levels', () => {
  assert.throws(() => makeLevel({ w: 2, h: 1, cells: [1, 0], start: 0, gems: [] }));
  assert.throws(() => makeLevel({ w: 2, h: 1, cells: [0, 1], start: 0, gems: [1] }));
  assert.throws(() => makeLevel({ w: 2, h: 1, cells: [0, 0], start: 0, gems: [0] }));
  assert.throws(() => parseLevel('..*'));
});

test('solver finds the shortest solution', () => {
  const lvl = parseLevel(['@...', '....', '...*'].join('\n'));
  assert.deepEqual(solve(lvl), [RIGHT, DOWN]);
});

test('solver returns null when unsolvable and [] when solved', () => {
  // The gem sits mid-row but is walled off from every sliding lane.
  const lvl = parseLevel(['@.#..', '..#*.', '..#..'].join('\n'));
  assert.equal(solve(lvl), null);
  const done = parseLevel('@*');
  assert.deepEqual(solve(done, { pos: 1, mask: 1 }), []);
});

test('solver solutions actually win when replayed', () => {
  const lvl = parseLevel(['@..#....', '..o...*.', '#.....#.', '.*...o..', '....#..*', '.#......'].join('\n'));
  const sol = solve(lvl);
  assert.ok(sol);
  let s = initialState(lvl);
  for (const d of sol) s = applyMove(lvl, s, d).state;
  assert.ok(isWin(lvl, s));
});

test('reachableCells covers slid-through cells', () => {
  const lvl = parseLevel(['@..', '###'].join('\n'));
  assert.deepEqual([...reachableCells(lvl)].sort(), [0, 1, 2]);
});
