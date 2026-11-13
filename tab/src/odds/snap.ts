import { assertProbability } from './belief';

/** Allowed ratios for stakes that cannot be divided (drinks, rounds, coffees). */
export const SNAP_RATIOS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [3, 2],
  [2, 1],
  [3, 1],
  [4, 1],
  [5, 1],
];

export interface SnappedStakes {
  /** Units the YES backer risks. */
  yes: number;
  /** Units the NO backer risks. */
  no: number;
}

/**
 * Snap the stake ratio q : (1 - q) to the nearest allowed ratio.
 * Distance is measured on the ratio itself; ties go to the more even ratio.
 * Below q = 0.5 the mirror ratios are used, so snapping is symmetric.
 * Prices beyond 5:1 are capped at 5:1.
 */
export function snapStakes(q: number): SnappedStakes {
  assertProbability(q, 'q');
  const hi = Math.max(q, 1 - q);
  const ratio = hi / (1 - hi);

  let best = SNAP_RATIOS[0];
  let bestDist = Infinity;
  for (const cand of SNAP_RATIOS) {
    const dist = Math.abs(ratio - cand[0] / cand[1]);
    if (dist < bestDist - 1e-9) {
      best = cand;
      bestDist = dist;
    }
  }
  return q >= 0.5 ? { yes: best[0], no: best[1] } : { yes: best[1], no: best[0] };
}
