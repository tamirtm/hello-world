// Turns a price into the deal in plain words. Pure: no UI imports, unit-tested.

import { snapStakes, wholeStakes } from '../odds';
import { POINTS_NOTE, POINTS_POT, type Stake } from './stakes';

export interface DealInput {
  /** Agreed price: probability of YES. */
  q: number;
  yesName: string;
  noName: string;
  stake: Stake;
}

export interface DealText {
  /** One or two short sentences: the whole deal. */
  lines: string[];
  /** Small print under the deal. */
  notes: string[];
  /** Units each side risks, as shown. */
  yesRisk: number;
  noRisk: number;
  /** True when the shown stakes were rounded away from the exact fair split. */
  snapped: boolean;
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function describeDeal({ q, yesName, noName, stake }: DealInput): DealText {
  if (stake.kind === 'points') {
    const { yesStake, noStake } = wholeStakes(q, POINTS_POT);
    return {
      lines: [
        `${yesName} risks ${count(yesStake, 'point', 'points')} to win ${noStake}.`,
        `${noName} risks ${noStake} to win ${yesStake}.`,
      ],
      notes: [POINTS_NOTE],
      yesRisk: yesStake,
      noRisk: noStake,
      snapped: false,
    };
  }

  const { yes, no } = snapStakes(q);
  const base = { yesRisk: yes, noRisk: no, snapped: true };

  if (stake.kind === 'unit') {
    const notes = stake.loserBuys ? ['Loser buys.'] : [];
    if (yes === no) {
      return { ...base, lines: [`One ${stake.one} each way.`], notes };
    }
    return {
      ...base,
      lines: [
        `${yesName} risks ${count(yes, stake.one, stake.many)} to win ${no}.`,
        `${noName} risks ${count(no, stake.one, stake.many)} to win ${yes}.`,
      ],
      notes,
    };
  }

  const what = `“${stake.text}”`;
  if (yes === no) {
    return { ...base, lines: [`Even stakes: ${what} each way.`], notes: [] };
  }
  return {
    ...base,
    lines: [`${yesName} puts up ${yes} × ${what}.`, `${noName} puts up ${no} × ${what}.`],
    notes: ['Winner collects what the other side put up.'],
  };
}
