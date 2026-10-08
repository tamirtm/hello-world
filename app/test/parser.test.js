import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLine, parseChunk } from '../src/parser.js';

test('parses a TFC line with log prefix', () => {
  assert.deepEqual(parseLine('[12:00] TFC|{"money":5,"lines":2}'), { money: 5, lines: 2 });
});

test('ignores non-TFC and malformed lines', () => {
  assert.equal(parseLine('hello'), null);
  assert.equal(parseLine('TFC|{bad'), null);
});

test('parseChunk handles CRLF and mixed lines', () => {
  const out = parseChunk('noise\r\nTFC|{"a":1}\r\nTFC|{"a":2}\n');
  assert.deepEqual(out, [{ a: 1 }, { a: 2 }]);
});
