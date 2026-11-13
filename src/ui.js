import { DIRS, WALL, PAD, applyMove, initialState, isWin } from './engine.js';
import { solve } from './solver.js';
import { levelFor, dailyLevel, dateKey, starsFor, dailyStreak } from './levels.js';
import { loadSave, storeSave } from './storage.js';

const STEP_MS = 45; // slide time per cell
const ARROWS = ['↑', '→', '↓', '←'];
const $ = (id) => document.getElementById(id);

const el = {
  board: $('board'), title: $('title'), moves: $('moves'), par: $('par'), gems: $('gems'),
  best: $('best'), bestWrap: $('best-wrap'), status: $('status'),
  prev: $('prev'), next: $('next'), undo: $('undo'), restart: $('restart'), hint: $('hint'),
  tabLevels: $('tab-levels'), tabDaily: $('tab-daily'),
  win: $('win'), winTitle: $('win-title'), winStars: $('win-stars'), winText: $('win-text'),
  winShare: $('win-share'), winRetry: $('win-retry'), winNext: $('win-next'),
};

const save = loadSave();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const game = {
  mode: 'levels', // 'levels' | 'daily'
  dayKey: null,
  gen: null, // { level, par, solution }
  state: null,
  history: [], // previous states, for undo
  usedHint: false,
  busy: false,
  queued: null,
  won: false,
  timers: [],
};
let puckEl = null;
let gemEls = [];
let cellEls = [];

// ---------- loading ----------

function loadLevel(n) {
  game.mode = 'levels';
  save.level = n;
  storeSave(save);
  start(levelFor(n));
}

function loadDaily() {
  game.mode = 'daily';
  game.dayKey = dateKey();
  start(dailyLevel(game.dayKey));
}

function start(gen) {
  game.gen = gen;
  resetRun();
  buildBoard();
  render();
}

function resetRun() {
  clearTimers();
  game.state = initialState(game.gen.level);
  game.history = [];
  game.usedHint = false;
  game.busy = false;
  game.queued = null;
  game.won = false;
  setStatus('');
}

function clearTimers() {
  game.timers.forEach(clearTimeout);
  game.timers = [];
}

// ---------- rendering ----------

function place(node, cell) {
  const { w } = game.gen.level;
  node.style.setProperty('--x', cell % w);
  node.style.setProperty('--y', Math.floor(cell / w));
}

function buildBoard() {
  const { level } = game.gen;
  el.board.replaceChildren();
  el.board.style.setProperty('--w', level.w);
  el.board.style.setProperty('--h', level.h);
  cellEls = [];
  for (let i = 0; i < level.cells.length; i++) {
    const c = document.createElement('div');
    c.className = 'cell' + (level.cells[i] === WALL ? ' wall' : level.cells[i] === PAD ? ' pad' : '');
    place(c, i);
    el.board.append(c);
    cellEls.push(c);
  }
  gemEls = level.gems.map((cell) => {
    const g = document.createElement('div');
    g.className = 'gem';
    place(g, cell);
    el.board.append(g);
    return g;
  });
  puckEl = document.createElement('div');
  puckEl.className = 'puck';
  puckEl.style.transitionDuration = '0ms';
  place(puckEl, level.start);
  el.board.append(puckEl);
}

function render() {
  const { level, par } = game.gen;
  const collected = countBits(game.state.mask);
  el.moves.textContent = game.history.length;
  el.par.textContent = par;
  el.gems.textContent = `${collected}/${level.gems.length}`;
  gemEls.forEach((g, i) => g.classList.toggle('got', Boolean(game.state.mask & (1 << i))));

  const daily = game.mode === 'daily';
  el.tabLevels.setAttribute('aria-selected', String(!daily));
  el.tabDaily.setAttribute('aria-selected', String(daily));
  el.prev.hidden = el.next.hidden = daily;
  if (daily) {
    const streak = dailyStreak(save.daily);
    el.title.textContent = `Daily · ${game.dayKey}` + (streak > 1 ? ` · ${streak}🔥` : '');
  } else {
    el.title.textContent = `Level ${save.level}`;
    el.prev.disabled = save.level <= 1;
    el.next.disabled = save.level >= save.unlocked;
  }
  const best = daily ? save.daily[game.dayKey]?.moves : save.best[save.level];
  el.bestWrap.hidden = best == null;
  if (best != null) el.best.textContent = best;
  el.undo.disabled = game.history.length === 0;
  el.restart.disabled = game.history.length === 0;
  el.hint.disabled = game.won;
}

function countBits(n) {
  let c = 0;
  for (; n; n &= n - 1) c++;
  return c;
}

function setStatus(text, warn = false) {
  el.status.textContent = text;
  el.status.classList.toggle('warn', warn);
}

function clearHint() {
  cellEls.forEach((c) => c.classList.remove('hint'));
  puckEl?.replaceChildren();
}

// ---------- moves ----------

function move(dir) {
  if (game.won || el.win.open) return;
  if (game.busy) {
    game.queued = dir;
    return;
  }
  const { level } = game.gen;
  const res = applyMove(level, game.state, dir);
  clearHint();
  if (!res) {
    puckEl.classList.remove('bump');
    void puckEl.offsetWidth; // restart the animation
    puckEl.classList.add('bump');
    return;
  }

  game.history.push(game.state);
  game.state = res.state;
  game.busy = true;
  setStatus('');

  const step = reducedMotion ? 0 : STEP_MS;
  const total = res.path.length * step;
  puckEl.style.transitionDuration = `${total}ms`;
  place(puckEl, res.state.pos);

  // Gems pop as the puck reaches them, not all at once.
  res.path.forEach((cell, i) => {
    const g = level.gemAt[cell];
    if (g !== -1) game.timers.push(setTimeout(() => gemEls[g].classList.add('got'), (i + 0.5) * step));
  });
  game.timers.push(setTimeout(() => finishMove(), total + 10));
  el.moves.textContent = game.history.length;
}

function finishMove() {
  game.busy = false;
  game.timers = [];
  render();
  if (isWin(game.gen.level, game.state)) {
    game.queued = null;
    onWin();
    return;
  }
  if (solve(game.gen.level, game.state) === null) {
    setStatus('Stuck — no way to finish from here. Undo or restart.', true);
  }
  if (game.queued !== null) {
    const d = game.queued;
    game.queued = null;
    move(d);
  }
}

function snapTo(state) {
  clearTimers();
  game.busy = false;
  game.queued = null;
  game.state = state;
  clearHint();
  puckEl.style.transitionDuration = '0ms';
  place(puckEl, state.pos);
  setStatus('');
  render();
}

function undo() {
  if (game.history.length === 0 || el.win.open) return;
  game.won = false;
  snapTo(game.history.pop());
}

function restart() {
  if (el.win.open) el.win.close();
  resetRun();
  snapTo(game.state);
}

function hint() {
  if (game.won || game.busy) return;
  const sol = solve(game.gen.level, game.state);
  clearHint();
  if (sol === null) {
    setStatus('Stuck — no way to finish from here. Undo or restart.', true);
    return;
  }
  game.usedHint = true;
  const dir = sol[0];
  const res = applyMove(game.gen.level, game.state, dir);
  res.path.forEach((c) => cellEls[c].classList.add('hint'));
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.textContent = ARROWS[dir];
  puckEl.replaceChildren(arrow);
  setStatus(`Hint: go ${DIRS[dir].name} — ${sol.length} move${sol.length === 1 ? '' : 's'} from here.`);
}

// ---------- winning ----------

function onWin() {
  game.won = true;
  const moves = game.history.length;
  const { par } = game.gen;
  const stars = starsFor(moves, par);
  const daily = game.mode === 'daily';

  if (daily) {
    const prev = save.daily[game.dayKey];
    if (!prev || moves < prev.moves) save.daily[game.dayKey] = { moves, par };
  } else {
    const prev = save.best[save.level];
    if (prev == null || moves < prev) save.best[save.level] = moves;
    save.unlocked = Math.max(save.unlocked, save.level + 1);
  }
  storeSave(save);
  render();

  el.winTitle.textContent = moves <= par ? 'Perfect!' : 'Cleared!';
  el.winStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  el.winText.textContent =
    `${moves} move${moves === 1 ? '' : 's'} · par ${par}` +
    (game.usedHint ? ' · with hints' : '') +
    (daily ? ` · streak ${dailyStreak(save.daily)}` : '');
  el.winShare.hidden = !daily;
  el.winShare.textContent = 'Share';
  el.winNext.textContent = daily ? 'Play levels' : 'Next level';
  el.win.showModal();
  el.winNext.focus();
}

function shareText() {
  const moves = save.daily[game.dayKey]?.moves ?? game.history.length;
  const { par } = game.gen;
  const stars = starsFor(moves, par);
  return `Glide daily ${game.dayKey}\n${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} ${moves} moves (par ${par})`;
}

async function share() {
  const text = shareText();
  try {
    if (navigator.share) await navigator.share({ text });
    else {
      await navigator.clipboard.writeText(text);
      el.winShare.textContent = 'Copied!';
    }
  } catch {
    // Share sheet dismissed or clipboard unavailable — nothing to do.
  }
}

// ---------- input ----------

const KEY_DIRS = {
  ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3,
  w: 0, d: 1, s: 2, a: 3, W: 0, D: 1, S: 2, A: 3,
};

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || el.win.open) return;
  if (e.key in KEY_DIRS) {
    e.preventDefault();
    move(KEY_DIRS[e.key]);
  } else if (e.key === 'z' || e.key === 'Z' || e.key === 'u' || e.key === 'Backspace') {
    e.preventDefault();
    undo();
  } else if (e.key === 'r' || e.key === 'R') restart();
  else if (e.key === 'h' || e.key === 'H') hint();
});

let swipe = null;
el.board.addEventListener('pointerdown', (e) => {
  swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
  el.board.setPointerCapture(e.pointerId);
});
el.board.addEventListener('pointerup', (e) => {
  if (!swipe || swipe.id !== e.pointerId) return;
  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  swipe = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : 3);
  else move(dy > 0 ? 2 : 0);
});
el.board.addEventListener('pointercancel', () => { swipe = null; });

el.undo.addEventListener('click', undo);
el.restart.addEventListener('click', restart);
el.hint.addEventListener('click', hint);
el.prev.addEventListener('click', () => save.level > 1 && loadLevel(save.level - 1));
el.next.addEventListener('click', () => save.level < save.unlocked && loadLevel(save.level + 1));
el.tabLevels.addEventListener('click', () => game.mode !== 'levels' && loadLevel(save.level));
el.tabDaily.addEventListener('click', () => game.mode !== 'daily' && loadDaily());
el.winShare.addEventListener('click', share);
el.winRetry.addEventListener('click', restart);
el.winNext.addEventListener('click', () => {
  el.win.close();
  loadLevel(game.mode === 'daily' ? save.level : save.level + 1);
});

// Roll the daily over if the tab is left open past midnight.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && game.mode === 'daily' && game.dayKey !== dateKey()) loadDaily();
});

// Test hook used by scripts/e2e.mjs.
window.__glide = {
  get state() {
    return { mode: game.mode, level: save.level, moves: game.history.length, won: game.won, par: game.gen.par };
  },
  solution: () => (solve(game.gen.level, game.state) ?? []).map((d) => DIRS[d].name),
};

// Offline play: sw.js caches the app shell (network-first, so updates still land).
if (location.protocol === 'https:' || location.hostname === 'localhost') {
  navigator.serviceWorker?.register('sw.js').catch(() => {});
}

if (new URLSearchParams(location.search).get('mode') === 'daily') loadDaily();
else loadLevel(save.level);
