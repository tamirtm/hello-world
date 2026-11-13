// Browser smoke test: plays real levels through the UI with the keyboard and touch.
// Needs Playwright available (`npm i -D playwright` locally); not part of `npm test`.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { createStaticServer } from './serve.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const shot = process.argv[2]; // optional screenshot directory

const server = createStaticServer().listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const KEYS = { up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft' };

try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(base);
  await page.waitForSelector('.puck');
  const state = () => page.evaluate(() => window.__glide.state);
  const solveByKeys = async () => {
    for (const dir of await page.evaluate(() => window.__glide.solution())) {
      const before = (await state()).moves;
      await page.keyboard.press(KEYS[dir]);
      await page.waitForFunction((n) => window.__glide.state.moves === n + 1, before);
    }
    await page.waitForSelector('dialog[open]');
  };

  // Level 1: hint, a wrong-ish move, undo, restart, then solve at par.
  assert.equal(await page.textContent('#title'), 'Level 1');
  if (shot) await page.screenshot({ path: `${shot}/level1.png` });
  await page.click('#hint');
  assert.match(await page.textContent('#status'), /^Hint: go /);
  if (shot) await page.screenshot({ path: `${shot}/hint.png` });
  const first = (await page.evaluate(() => window.__glide.solution()))[0];
  await page.keyboard.press(KEYS[first]);
  await page.waitForFunction(() => window.__glide.state.moves === 1);
  await page.waitForFunction(() => !document.querySelector('#undo').disabled);
  await page.click('#undo');
  assert.equal((await state()).moves, 0);
  await page.keyboard.press(KEYS[first]);
  await page.waitForFunction(() => !document.querySelector('#restart').disabled);
  await page.click('#restart');
  assert.equal((await state()).moves, 0);

  await solveByKeys();
  let s = await state();
  assert.equal(s.moves, s.par);
  assert.equal(await page.textContent('#win-stars'), '★★★');
  if (shot) await page.screenshot({ path: `${shot}/win.png` });
  await page.click('#win-next');
  assert.equal(await page.textContent('#title'), 'Level 2');

  // Progress persists across reloads.
  await page.reload();
  await page.waitForSelector('.puck');
  assert.equal(await page.textContent('#title'), 'Level 2');
  await page.click('#prev');
  assert.equal(await page.textContent('#best'), String(s.par));

  // Swipe input: first solution move via a touch-style drag on the board.
  const dir = (await page.evaluate(() => window.__glide.solution()))[0];
  const box = await page.locator('#board').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const d = { up: [0, -80], right: [80, 0], down: [0, 80], left: [-80, 0] }[dir];
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + d[0], cy + d[1], { steps: 4 });
  await page.mouse.up();
  await page.waitForFunction(() => window.__glide.state.moves === 1);

  // Daily mode.
  await page.click('#tab-daily');
  assert.match(await page.textContent('#title'), /^Daily · \d{4}-\d{2}-\d{2}/);
  await solveByKeys();
  assert.equal(await page.isVisible('#win-share'), true);
  if (shot) await page.screenshot({ path: `${shot}/daily-win.png` });
  await page.click('#win-next');
  await page.click('#tab-daily');
  assert.notEqual(await page.isHidden('#best-wrap'), true);
  if (shot) await page.screenshot({ path: `${shot}/daily.png` });

  // A late level renders and solves too.
  await page.evaluate(() => {
    localStorage.setItem('glide:v1', JSON.stringify({ level: 40, unlocked: 40, best: {}, daily: {} }));
  });
  await page.goto(base);
  await page.waitForSelector('.puck');
  assert.equal(await page.textContent('#title'), 'Level 40');
  if (shot) await page.screenshot({ path: `${shot}/level40.png` });
  await solveByKeys();

  // Offline: once the service worker controls the page, a reload works with no network.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.reload(); // make sure every asset passed through the worker's cache
  await page.waitForSelector('.puck');
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.puck');
  assert.equal(await page.textContent('#title'), 'Level 40');
  await ctx.setOffline(false);

  assert.deepEqual(errors, []);
  console.log('e2e ok');
} finally {
  await browser.close();
  server.close();
}
