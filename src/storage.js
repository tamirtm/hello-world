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
    const base = defaultSave();
    return {
      level: Number.isInteger(data.level) && data.level >= 1 ? data.level : base.level,
      unlocked: Number.isInteger(data.unlocked) && data.unlocked >= 1 ? data.unlocked : base.unlocked,
      best: data.best && typeof data.best === 'object' ? data.best : {},
      daily: data.daily && typeof data.daily === 'object' ? data.daily : {},
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
