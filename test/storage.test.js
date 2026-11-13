import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSave, storeSave, defaultSave } from '../src/storage.js';

function withStorage(impl, fn) {
  const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: impl, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    if (had) Object.defineProperty(globalThis, 'localStorage', had);
    else delete globalThis.localStorage;
  }
}
const mem = (initial) => {
  const m = new Map(initial ? [['glide:v1', initial]] : []);
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
};

test('round-trips a save', () => {
  withStorage(mem(), () => {
    const s = { level: 4, unlocked: 6, best: { 1: 4 }, daily: { '2026-11-13': { moves: 9, par: 9 } } };
    storeSave(s);
    assert.deepEqual(loadSave(), s);
  });
});

test('falls back to defaults on missing, corrupt or hostile data', () => {
  withStorage(mem(), () => assert.deepEqual(loadSave(), defaultSave()));
  withStorage(mem('{not json'), () => assert.deepEqual(loadSave(), defaultSave()));
  withStorage(mem('null'), () => assert.deepEqual(loadSave(), defaultSave()));
  withStorage(mem('{"level":-3,"unlocked":"x","best":[1],"daily":7}'), () => assert.deepEqual(loadSave(), defaultSave()));
});

test('current level is always unlocked', () => {
  withStorage(mem('{"level":9,"unlocked":2}'), () => assert.equal(loadSave().unlocked, 9));
});

test('survives storage that throws', () => {
  const boom = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  withStorage(boom, () => {
    assert.deepEqual(loadSave(), defaultSave());
    assert.doesNotThrow(() => storeSave(defaultSave()));
  });
});
