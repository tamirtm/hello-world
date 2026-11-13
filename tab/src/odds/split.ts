import { assertProbability } from './belief';

export interface SplitBet {
  kind: 'bet';
  /** Agreed price: the probability of YES both sides are betting at. */
  q: number;
  yesStake: number;
  noStake: number;
}

export interface NoBet {
  kind: 'no-bet';
  /** The spec's single outcome when the NO backer is at least as bullish as the YES backer. */
  reason: 'swap sides or no bet';
  /** True when swapping sides would produce a bet (beliefs differ). False when they agree. */
  canSwap: boolean;
}

export type SplitResult = SplitBet | NoBet;

/**
 * Split the difference, 1v1. A backs YES with belief pA, B backs NO with belief pB.
 * Both beliefs are probabilities that YES happens.
 */
export function splitTheDifference(pA: number, pB: number, pot = 1): SplitResult {
  assertProbability(pA, 'pA');
  assertProbability(pB, 'pB');
  if (!Number.isFinite(pot) || pot <= 0) throw new RangeError(`pot must be positive, got ${pot}`);

  if (pB >= pA) return { kind: 'no-bet', reason: 'swap sides or no bet', canSwap: pB > pA };

  const q = (pA + pB) / 2;
  return { kind: 'bet', q, yesStake: q * pot, noStake: (1 - q) * pot };
}

/**
 * Whole-number stakes for a points pot. They always sum to exactly `pot`,
 * and neither side is rounded down to zero.
 */
export function wholeStakes(q: number, pot: number): { yesStake: number; noStake: number } {
  assertProbability(q, 'q');
  if (!Number.isInteger(pot) || pot < 2) throw new RangeError(`pot must be an integer >= 2, got ${pot}`);
  // Round on a cleaned value so 0.555 * 100 = 55.50000000000001 style noise cannot flip a result.
  const exact = Number((q * pot).toFixed(6));
  const yesStake = Math.min(pot - 1, Math.max(1, Math.round(exact)));
  return { yesStake, noStake: pot - yesStake };
}
