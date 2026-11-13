// Walks the whole Phase 0 flow in a phone-sized browser against the static web build.
// Run `npm run build:web` first. Needs Playwright available; not part of `npm test`.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const dist = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.ico': 'image/x-icon', '.json': 'application/json', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = resolve(join(dist, path === '/' ? 'index.html' : path));
    if (!file.startsWith(dist + sep)) throw new Error('outside dist');
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const shots = process.argv[2];
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const t = (id) => page.getByTestId(id);
  const snap = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png` });
  const setPct = async (target) => {
    // Drive the same -/+ buttons a thumb would use.
    for (;;) {
      const now = parseInt(await t('pct').textContent(), 10);
      if (now === target) return;
      const diff = target - now;
      const stepSize = Math.abs(diff) >= 10 ? 10 : 1;
      await t(`nudge${diff > 0 ? '' : '-'}${stepSize}`).tap();
    }
  };
  const run = async ({ pA, pB, stake, stakeText }) => {
    await t('tpl-overunder').tap();
    await t('bet-a').fill('Food arrives in');
    await t('bet-b').fill('15 minutes');
    assert.equal(await t('statement').textContent(), 'Food arrives in over 15 minutes');
    await t('name-a').fill('Ana');
    await t('name-b').fill('Ben');
    await t('next').tap();
    await setPct(pA);
    await t('next').tap();
    await t(`stake-${stake}`).tap();
    if (stakeText) await t('stake-text').fill(stakeText);
    await t('next').tap();
    assert.equal(await t('title').textContent(), 'Hand the phone to Ben');
    assert.equal(await page.getByText(`${pA}%`).count(), 0, "first player's number must stay hidden");
    await t('next').tap();
    assert.equal(await t('pct').textContent(), '50%', 'friend starts from a neutral 50%');
    await setPct(pB);
    await t('next').tap();
  };

  await page.goto(`http://localhost:${server.address().port}/`);

  // 18+ confirmation comes first, once.
  await t('age-yes').waitFor();
  await snap('0-age');
  await t('age-yes').tap();

  // Every tap target on the first screen is at least 44px tall.
  await t('next').waitFor();
  for (const el of await page.locator('[role=button], input').all()) {
    const box = await el.boundingBox();
    assert.ok(box.height >= 44, `tap target only ${box.height}px tall`);
  }
  assert.equal(await t('next').isDisabled(), true, 'cannot continue with an empty bet');
  await snap('1-bet-empty');

  // Spec example: points, 70% vs 40%.
  await run({ pA: 70, pB: 40, stake: 'points' });
  assert.match(await t('deal').textContent(), /Ana risks 55 points to win 45\.Ben risks 45 to win 55\./);
  await t('math-toggle').tap();
  const math = await t('math').textContent();
  assert.match(math, /55%/);
  assert.match(math, /1\.82\s+\(-122\)/);
  assert.match(math, /2\.22\s+\(\+122\)/);
  await snap('5-deal-points-math');
  await t('new-bet').tap();

  // Drinks snap to one each way.
  await run({ pA: 70, pB: 40, stake: 'drink' });
  assert.match(await t('deal').textContent(), /One drink each way\.Loser buys\./);
  await snap('5-deal-drink');
  await t('new-bet').tap();

  // 90% vs 60% -> q = 0.75 -> 3:1.
  await run({ pA: 90, pB: 60, stake: 'drink' });
  assert.match(await t('deal').textContent(), /Ana risks 3 drinks to win 1\.Ben risks 1 drink to win 3\./);
  await t('new-bet').tap();

  // Friend is more confident: no bet, offer to swap sides.
  await run({ pA: 70, pB: 80, stake: 'points' });
  assert.match(await t('no-bet').textContent(), /Ben thinks this is more likely \(80%\) than Ana does \(70%\)/);
  await snap('5-no-bet');
  await t('swap').tap();
  assert.match(await t('deal').textContent(), /Ben risks 75 points to win 25\.Ana risks 25 to win 75\./);
  await t('new-bet').tap();

  // Same number: nothing to bet on, no swap offered.
  await run({ pA: 60, pB: 60, stake: 'coffee' });
  assert.match(await t('no-bet').textContent(), /You both said 60%/);
  assert.equal(await t('swap').count(), 0);
  await t('new-bet').tap();

  // Hard rules on free-text stakes: money and forfeits are refused.
  await t('bet-a').fill('Food arrives in');
  await t('bet-b').fill('15 minutes');
  await t('next').tap();
  await t('next').tap();
  await t('stake-custom').tap();
  assert.equal(await t('next').isDisabled(), true);
  for (const [text, msg] of [['$20', /No money on Tab/], ['loser drinks', /No dares or physical forfeits/], ['a slap', /No dares or physical forfeits/]]) {
    await t('stake-text').fill(text);
    assert.match(await t('stake-text-error').textContent(), msg);
    assert.equal(await t('next').isDisabled(), true, `"${text}" must be blocked`);
  }
  await snap('3-stake-blocked');
  await t('stake-text').fill('picks the next film');
  assert.equal(await t('next').isDisabled(), false);

  // No horizontal scrolling at phone width, and the 18+ answer is remembered.
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.reload();
  await t('next').waitFor();
  assert.equal(await t('age-yes').count(), 0);

  assert.deepEqual(errors, []);
  console.log('e2e ok');
} finally {
  await browser.close();
  server.close();
}
