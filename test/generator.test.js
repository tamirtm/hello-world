import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/generator.js';
import { levelFor, dailyLevel, optionsForLevel, starsFor, dailyStreak, dateKey } from '../src/levels.js';
import { applyMove, initialState, isWin, formatLevel } from '../src/engine.js';
import { solve } from '../src/solver.js';
import { hashString, mulberry32 } from '../src/rng.js';

function replayWins(level, solution) {
  let s = initialState(level);
  for (const d of solution) {
    const res = applyMove(level, s, d);
    assert.ok(res, 'solution contains a blocked move');
    s = res.state;
  }
  return isWin(level, s);
}

test('rng is deterministic and in range', () => {
  const a = mulberry32(hashString('x'));
  const b = mulberry32(hashString('x'));
  for (let i = 0; i < 100; i++) {
    const v = a();
    assert.equal(v, b());
    assert.ok(v >= 0 && v < 1);
  }
  assert.notEqual(hashString('a'), hashString('b'));
});

test('same seed generates the same level', () => {
  const a = generate('seed-1');
  const b = generate('seed-1');
  assert.equal(formatLevel(a.level), formatLevel(b.level));
  assert.notEqual(formatLevel(a.level), formatLevel(generate('seed-2').level));
});

test('levels 1-60 are solvable, optimal, and hit their par range', () => {
  let misses = 0;
  for (let n = 1; n <= 60; n++) {
    const o = optionsForLevel(n);
    const g = levelFor(n);
    assert.equal(g.level.w, o.w);
    assert.equal(g.level.gems.length, o.gems);
    assert.ok(replayWins(g.level, g.solution), `level ${n} solution does not win`);
    assert.equal(solve(g.level).length, g.par);
    if (!g.inRange) misses++;
  }
  assert.equal(misses, 0, `${misses} levels fell outside their par range`);
});

test('difficulty never decreases across the curve', () => {
  let prev = optionsForLevel(1);
  for (let n = 2; n <= 80; n++) {
    const o = optionsForLevel(n);
    assert.ok(o.w >= prev.w && o.gems >= prev.gems && o.minPar >= prev.minPar);
    prev = o;
  }
});

test('daily puzzles are stable per date and differ between dates', () => {
  const a = dailyLevel('2026-11-13');
  assert.equal(formatLevel(a.level), formatLevel(dailyLevel('2026-11-13').level));
  assert.notEqual(formatLevel(a.level), formatLevel(dailyLevel('2026-11-14').level));
  for (let d = 1; d <= 28; d++) {
    const g = dailyLevel(`2027-02-${String(d).padStart(2, '0')}`);
    assert.ok(g.inRange, `daily ${d} out of par range (par ${g.par})`);
    assert.ok(replayWins(g.level, g.solution));
  }
});

test('stars', () => {
  assert.equal(starsFor(5, 5), 3);
  assert.equal(starsFor(7, 5), 2);
  assert.equal(starsFor(8, 5), 1);
});

test('daily streak counts back from today or yesterday', () => {
  const today = new Date(2026, 10, 13);
  const day = (offset) => dateKey(new Date(2026, 10, 13 + offset));
  assert.equal(dailyStreak({}, today), 0);
  assert.equal(dailyStreak({ [day(0)]: 1, [day(-1)]: 1 }, today), 2);
  assert.equal(dailyStreak({ [day(-1)]: 1, [day(-2)]: 1, [day(-4)]: 1 }, today), 2);
  assert.equal(dailyStreak({ [day(-2)]: 1 }, today), 0);
});
