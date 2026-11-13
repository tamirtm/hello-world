import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

// The service worker precaches a hand-written file list. Adding a module under
// src/ without listing it would silently break offline play, so guard it here.
test('service worker shell lists every app file, and every listed file exists', () => {
  const root = new URL('..', import.meta.url);
  const sw = readFileSync(new URL('sw.js', root), 'utf8');
  const shell = [...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const f of readdirSync(new URL('src/', root))) assert.ok(shell.includes(`src/${f}`), `src/${f} missing from SHELL`);
  for (const f of ['index.html', 'style.css', 'icon.svg', 'manifest.webmanifest']) assert.ok(shell.includes(f));
  for (const f of shell) if (f !== './') assert.ok(existsSync(new URL(f, root)), `${f} listed but missing`);
});
