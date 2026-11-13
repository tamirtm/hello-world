// Pari-mutuel pool: everyone's stake goes in one pot, winners share it
// in proportion to what they staked.

export const MAX_POOL_PEOPLE = 10;

export interface PoolEntry {
  person: string;
  outcome: string;
  stake: number;
}

export interface PoolOutcome {
  outcome: string;
  total: number;
  /** Implied probability: this outcome's share of the pool. */
  implied: number;
  /** Returned per unit staked on this outcome if it wins (stake included). */
  payoutPerUnit: number;
}

export type PoolResult =
  | { kind: 'void'; reason: 'all stakes on one outcome' | 'no stakes' }
  | { kind: 'open'; total: number; outcomes: PoolOutcome[] };

/** Outcomes are returned in the order they first appear in `entries`. */
export function poolOdds(entries: ReadonlyArray<PoolEntry>): PoolResult {
  const people = new Set<string>();
  const totals = new Map<string, number>();
  for (const e of entries) {
    if (!Number.isFinite(e.stake) || e.stake <= 0) {
      throw new RangeError(`stake must be positive, got ${e.stake}`);
    }
    people.add(e.person);
    totals.set(e.outcome, (totals.get(e.outcome) ?? 0) + e.stake);
  }
  if (people.size > MAX_POOL_PEOPLE) {
    throw new RangeError(`a pool can have at most ${MAX_POOL_PEOPLE} people, got ${people.size}`);
  }
  if (totals.size === 0) return { kind: 'void', reason: 'no stakes' };
  if (totals.size === 1) return { kind: 'void', reason: 'all stakes on one outcome' };

  let total = 0;
  for (const t of totals.values()) total += t;
  const outcomes = [...totals].map(([outcome, t]) => ({
    outcome,
    total: t,
    implied: t / total,
    payoutPerUnit: total / t,
  }));
  return { kind: 'open', total, outcomes };
}
