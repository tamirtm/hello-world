import { describe, expect, it } from 'vitest';
import {
  americanOdds, decimalOdds, fairRisk, oddsFor, formatAmerican, formatDecimal, formatPercent, formatUnits,
  splitTheDifference, wholeStakes, snapStakes, poolOdds, SNAP_RATIOS, type PoolEntry,
} from './index';

describe('belief to odds (required cases)', () => {
  it.each([
    [0.25, '4.00', '+300', '0.33'],
    [0.3, '3.33', '+233', '0.43'],
    [0.5, '2.00', '+100', '1.00'],
    [0.55, '1.82', '-122', '1.22'],
    [0.7, '1.43', '-233', '2.33'],
  ])('p=%s -> decimal %s, american %s, risk %s', (p, dec, amer, risk) => {
    expect(formatDecimal(decimalOdds(p))).toBe(dec);
    expect(formatAmerican(americanOdds(p))).toBe(amer);
    expect(formatUnits(fairRisk(p))).toBe(risk);
  });

  it('accepts the 0.01 and 0.99 limits and rejects anything outside', () => {
    expect(decimalOdds(0.01)).toBeCloseTo(100);
    expect(formatAmerican(americanOdds(0.99))).toBe('-9900');
    for (const bad of [0, 0.009, 0.991, 1, -0.2, NaN, Infinity]) {
      expect(() => decimalOdds(bad)).toThrow(RangeError);
      expect(() => americanOdds(bad)).toThrow(RangeError);
      expect(() => fairRisk(bad)).toThrow(RangeError);
    }
  });

  it('risk and decimal odds agree: decimal = 1 + 1/risk', () => {
    for (let pct = 1; pct <= 99; pct++) {
      const o = oddsFor(pct / 100);
      expect(o.decimal).toBeCloseTo(1 + 1 / o.risk, 9);
    }
  });

  it('american odds are mirror images either side of 50%', () => {
    for (let pct = 1; pct < 50; pct++) {
      expect(americanOdds(pct / 100)).toBeCloseTo(-americanOdds(1 - pct / 100), 6);
    }
  });
});

describe('split the difference (required cases)', () => {
  it('pA=0.70, pB=0.40, pot=100 -> q=0.55, YES 55, NO 45', () => {
    const r = splitTheDifference(0.7, 0.4, 100);
    expect(r.kind).toBe('bet');
    if (r.kind !== 'bet') return;
    expect(r.q).toBeCloseTo(0.55, 10);
    expect(r.yesStake).toBeCloseTo(55, 10);
    expect(r.noStake).toBeCloseTo(45, 10);
  });

  it('pA=0.30, pB=0.10 -> q=0.20', () => {
    const r = splitTheDifference(0.3, 0.1);
    expect(r.kind === 'bet' && r.q).toBeCloseTo(0.2, 10);
  });

  it('pA=0.70, pB=0.80 -> no bet / swap sides', () => {
    expect(splitTheDifference(0.7, 0.8, 100)).toEqual({ kind: 'no-bet', reason: 'swap sides or no bet', canSwap: true });
  });

  it('equal beliefs -> no bet, and swapping would not help', () => {
    expect(splitTheDifference(0.6, 0.6)).toEqual({ kind: 'no-bet', reason: 'swap sides or no bet', canSwap: false });
  });

  it('stakes always add up to the pot, and each side likes the price', () => {
    for (let a = 2; a <= 99; a++) {
      for (let b = 1; b < a; b++) {
        const r = splitTheDifference(a / 100, b / 100, 100);
        if (r.kind !== 'bet') throw new Error('expected a bet');
        expect(r.yesStake + r.noStake).toBeCloseTo(100, 9);
        expect(r.q).toBeLessThan(a / 100); // YES backer pays less than they think it is worth
        expect(r.q).toBeGreaterThan(b / 100); // and so does the NO backer
      }
    }
  });

  it('rejects bad input', () => {
    expect(() => splitTheDifference(1.2, 0.4)).toThrow(RangeError);
    expect(() => splitTheDifference(0.7, 0)).toThrow(RangeError);
    expect(() => splitTheDifference(0.7, 0.4, 0)).toThrow(RangeError);
  });

  it('whole-number point stakes sum to the pot and never hit zero', () => {
    expect(wholeStakes(0.55, 100)).toEqual({ yesStake: 55, noStake: 45 });
    expect(wholeStakes(0.555, 100)).toEqual({ yesStake: 56, noStake: 44 });
    expect(wholeStakes(0.015, 10)).toEqual({ yesStake: 1, noStake: 9 });
    expect(wholeStakes(0.985, 10)).toEqual({ yesStake: 9, noStake: 1 });
    for (let k = 3; k <= 197; k++) {
      const { yesStake, noStake } = wholeStakes(k / 200, 100);
      expect(yesStake + noStake).toBe(100);
      expect(Number.isInteger(yesStake) && yesStake >= 1 && noStake >= 1).toBe(true);
    }
  });
});

describe('snap indivisible stakes (required cases)', () => {
  it('q=0.55 snaps to 1:1', () => expect(snapStakes(0.55)).toEqual({ yes: 1, no: 1 }));
  it('q=0.75 snaps to 3:1', () => expect(snapStakes(0.75)).toEqual({ yes: 3, no: 1 }));

  it('exact ratios snap to themselves', () => {
    for (const [a, b] of SNAP_RATIOS) expect(snapStakes(a / (a + b))).toEqual({ yes: a, no: b });
  });

  it('mirrors below 50%', () => {
    expect(snapStakes(0.25)).toEqual({ yes: 1, no: 3 });
    expect(snapStakes(0.2)).toEqual({ yes: 1, no: 4 });
    for (let pct = 1; pct <= 99; pct++) {
      const s = snapStakes(pct / 100);
      const m = snapStakes(1 - pct / 100);
      expect([s.yes, s.no]).toEqual([m.no, m.yes]);
    }
  });

  it('caps at 5:1 and gets steeper as q rises', () => {
    expect(snapStakes(0.99)).toEqual({ yes: 5, no: 1 });
    expect(snapStakes(0.01)).toEqual({ yes: 1, no: 5 });
    let prev = 0;
    for (let pct = 50; pct <= 99; pct++) {
      const s = snapStakes(pct / 100);
      expect(s.yes / s.no).toBeGreaterThanOrEqual(prev);
      prev = s.yes / s.no;
    }
  });
});

describe('pool (required cases)', () => {
  const people = (n: number, outcome: string, offset = 0): PoolEntry[] =>
    Array.from({ length: n }, (_, i) => ({ person: `p${offset + i}`, outcome, stake: 1 }));

  it('4 x 1 on UNDER, 3 x 1 on OVER', () => {
    const r = poolOdds([...people(4, 'UNDER'), ...people(3, 'OVER', 4)]);
    if (r.kind !== 'open') throw new Error('expected an open pool');
    const [under, over] = r.outcomes;
    expect(r.total).toBe(7);
    expect([under.outcome, formatPercent(under.implied)]).toEqual(['UNDER', '57%']);
    expect([over.outcome, formatPercent(over.implied)]).toEqual(['OVER', '43%']);
    expect(formatUnits(over.payoutPerUnit)).toBe('2.33');
    expect(formatUnits(under.payoutPerUnit)).toBe('1.75');
  });

  it('everyone on one side -> void', () => {
    expect(poolOdds(people(5, 'OVER'))).toEqual({ kind: 'void', reason: 'all stakes on one outcome' });
    expect(poolOdds([])).toEqual({ kind: 'void', reason: 'no stakes' });
  });

  it('pays out exactly the pool, whichever outcome wins, with 3+ outcomes and uneven stakes', () => {
    const r = poolOdds([
      { person: 'a', outcome: 'X', stake: 2 },
      { person: 'b', outcome: 'Y', stake: 5 },
      { person: 'c', outcome: 'Z', stake: 1 },
      { person: 'd', outcome: 'X', stake: 4 },
    ]);
    if (r.kind !== 'open') throw new Error('expected an open pool');
    expect(r.outcomes.reduce((s, o) => s + o.implied, 0)).toBeCloseTo(1, 12);
    for (const o of r.outcomes) expect(o.total * o.payoutPerUnit).toBeCloseTo(r.total, 12);
  });

  it('allows 10 people and rejects 11', () => {
    expect(poolOdds([...people(5, 'A'), ...people(5, 'B', 5)]).kind).toBe('open');
    expect(() => poolOdds([...people(6, 'A'), ...people(5, 'B', 6)])).toThrow(RangeError);
  });

  it('rejects zero or negative stakes', () => {
    expect(() => poolOdds([{ person: 'a', outcome: 'A', stake: 0 }])).toThrow(RangeError);
    expect(() => poolOdds([{ person: 'a', outcome: 'A', stake: -1 }])).toThrow(RangeError);
  });
});
