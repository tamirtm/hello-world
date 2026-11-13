// Remembers the 18+ confirmation on this device. On web that is localStorage;
// elsewhere (and when storage is blocked) it lasts for the session only.
const KEY = 'tab:adult-confirmed';
let memory = false;

export function isAdultConfirmed(): boolean {
  if (memory) return true;
  try {
    return globalThis.localStorage?.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function confirmAdult(): void {
  memory = true;
  try {
    globalThis.localStorage?.setItem(KEY, '1');
  } catch {
    // Session-only.
  }
}
