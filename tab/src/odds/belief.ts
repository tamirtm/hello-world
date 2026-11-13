// Belief -> odds conversions. Pure math, no UI or network imports:
// this module is reused server-side in Phase 1.

export const MIN_P = 0.01;
export const MAX_P = 0.99;

/** Throws unless p is a probability in [0.01, 0.99]. */
export function assertProbability(p: number, name = 'p'): void {
  if (!Number.isFinite(p) || p < MIN_P || p > MAX_P) {
    throw new RangeError(`${name} must be between ${MIN_P} and ${MAX_P}, got ${p}`);
  }
}

/** Decimal odds: total returned per 1 unit staked, stake included. */
export function decimalOdds(p: number): number {
  assertProbability(p);
  return 1 / p;
}

/**
 * American odds. Negative for favourites (p > 0.5): the amount to risk to win 100.
 * Positive otherwise: the amount won on a 100 risk. p = 0.5 is +100.
 */
export function americanOdds(p: number): number {
  assertProbability(p);
  return p > 0.5 ? (-100 * p) / (1 - p) : (100 * (1 - p)) / p;
}

/** Fair amount to risk in order to win 1 unit. */
export function fairRisk(p: number): number {
  assertProbability(p);
  return p / (1 - p);
}

export interface OddsView {
  p: number;
  decimal: number;
  american: number;
  risk: number;
}

export function oddsFor(p: number): OddsView {
  return { p, decimal: decimalOdds(p), american: americanOdds(p), risk: fairRisk(p) };
}
