// Progress persistence. localStorage can be missing or throw (private mode,
// blocked site data), so every access is guarded and the game works without it.

const KEY = 'glide:v1';

export function defaultSave() {
  return { level: 1, unlocked: 1, best: {}, daily: {} };
}

export function loadSave() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw);
    const posInt = (v) => (Number.isInteger(v) && v >= 1 ? v : 1);
    const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    const level = posInt(data.level);
    return {
      level,
      // The current level is always playable, even if `unlocked` was lost or corrupted.
      unlocked: Math.max(posInt(data.unlocked), level),
      best: obj(data.best),
      daily: obj(data.daily),
    };
  } catch {
    return defaultSave();
  }
}

export function storeSave(save) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(save));
  } catch {
    // Progress just won't persist this session.
  }
}
