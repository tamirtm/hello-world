// Display rounding for odds. Kept with the math so client and server print the same thing.

export function formatDecimal(decimal: number): string {
  return decimal.toFixed(2);
}

/** "+300", "-122". */
export function formatAmerican(american: number): string {
  const n = Math.round(american);
  return n > 0 ? `+${n}` : `${n}`;
}

export function formatPercent(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export function formatUnits(n: number): string {
  return n.toFixed(2);
}
