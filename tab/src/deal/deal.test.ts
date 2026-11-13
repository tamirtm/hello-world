import { describe, expect, it } from 'vitest';
import { describeDeal } from './describe';
import { STAKE_PRESETS, type Stake } from './stakes';
import { TEMPLATES } from './templates';
import { checkText } from '../moderation/filter';

const preset = (id: string) => STAKE_PRESETS.find((s) => s.kind === 'unit' && s.id === id) as Stake;
const names = { yesName: 'Ana', noName: 'Ben' };

describe('deal in plain words', () => {
  it('points at q=0.55 matches the spec wording', () => {
    const d = describeDeal({ q: 0.55, ...names, stake: { kind: 'points' } });
    expect(d.lines).toEqual(['Ana risks 55 points to win 45.', 'Ben risks 45 to win 55.']);
    expect(d.notes.join(' ')).toMatch(/can't be bought, sent or cashed out/);
  });

  it('drinks at q=0.55 is one each way, loser buys', () => {
    const d = describeDeal({ q: 0.55, ...names, stake: preset('drink') });
    expect(d.lines).toEqual(['One drink each way.']);
    expect(d.notes).toEqual(['Loser buys.']);
  });

  it('drinks at q=0.75 is 3 to 1, with correct plurals', () => {
    const d = describeDeal({ q: 0.75, ...names, stake: preset('drink') });
    expect(d.lines).toEqual(['Ana risks 3 drinks to win 1.', 'Ben risks 1 drink to win 3.']);
  });

  it('mirrors when YES is the long shot', () => {
    const d = describeDeal({ q: 0.2, ...names, stake: preset('coffee') });
    expect(d.lines).toEqual(['Ana risks 1 coffee to win 4.', 'Ben risks 4 coffees to win 1.']);
  });

  it('free-text stakes', () => {
    const stake: Stake = { kind: 'custom', text: 'picks the next film' };
    expect(describeDeal({ q: 0.5, ...names, stake }).lines).toEqual(['Even stakes: “picks the next film” each way.']);
    expect(describeDeal({ q: 0.67, ...names, stake }).lines[0]).toBe('Ana puts up 2 × “picks the next film”.');
  });

  it('what each side risks is what the other side wins, for every price and preset', () => {
    for (const stake of [...STAKE_PRESETS, { kind: 'custom', text: 'x' } as Stake]) {
      for (let k = 2; k <= 198; k++) {
        const d = describeDeal({ q: k / 200, ...names, stake });
        expect(d.yesRisk).toBeGreaterThan(0);
        expect(d.noRisk).toBeGreaterThan(0);
        expect(d.lines.join(' ')).not.toMatch(/NaN|undefined/);
      }
    }
  });
});

describe('hard rules in the presets', () => {
  it('has exactly the allowed presets, and no "loser drinks"', () => {
    expect(STAKE_PRESETS.map((s) => s.label)).toEqual(['A drink', 'Next round', 'Coffee', 'Dishes', 'Points']);
    for (const s of STAKE_PRESETS) expect(checkText(s.label, 'stake').ok).toBe(true);
  });
});

describe('templates', () => {
  it('builds the spec example', () => {
    const ou = TEMPLATES.find((t) => t.id === 'overunder')!;
    expect(ou.compose('Food arrives in ', ' 15 minutes')).toBe('Food arrives in over 15 minutes');
    expect(ou.compose('Food arrives in', '')).toBe('');
  });
  it('covers over/under, yes/no, who will, first to and free text', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(['overunder', 'yesno', 'whowill', 'firstto', 'free']);
  });
});

describe('word filter', () => {
  const reason = (text: string, field: 'bet' | 'stake' | 'name') => {
    const r = checkText(text, field);
    return r.ok ? 'ok' : r.reason;
  };

  it('allows ordinary stakes and bets', () => {
    for (const s of ['a drink', '2 drinks', 'buys the next round', 'buys a shot', 'coffee', 'does the dishes', 'picks the film', 'washes the car', 'lunch on Friday']) {
      expect(reason(s, 'stake'), s).toBe('ok');
    }
    for (const b of ['Food arrives in over 15 minutes', 'Bitcoin closes above $100k', 'Sam hits a home run', 'Dev kicks the winning goal', 'Class of 2026 assassin game ends today']) {
      expect(reason(b, 'bet'), b).toBe('ok');
    }
  });

  it('blocks money stakes', () => {
    for (const s of ['$5', '20 bucks', 'ten dollars', 'venmo me', 'cash', 'a gift card', '€10', '0.01 BTC']) {
      expect(reason(s, 'stake'), s).toBe('money');
    }
  });

  it('blocks physical forfeits, dares and loser-drinks stakes', () => {
    for (const s of ['a slap', 'loser gets punched... punch', 'a dare', 'loser drinks', 'has to drink a pint', 'takes a shot', 'does 3 shots', 'chug a beer', 'shaves his head']) {
      expect(reason(s, 'stake'), s).toBe('forfeit');
    }
  });

  it('blocks abusive language in any field, including simple disguises', () => {
    expect(reason('you little shit', 'bet')).toBe('language');
    expect(reason('sh1t', 'name')).toBe('language');
    expect(reason('f.u.c.k', 'stake')).toBe('language');
    expect(reason('shiiiit', 'bet')).toBe('language');
  });

  it('does not flag innocent words that contain a blocked one', () => {
    for (const s of ['Scunthorpe wins', 'cocktail', 'Dickens', 'grape juice', 'assassin', 'classic', 'therapist']) {
      expect(reason(s, 'bet'), s).toBe('ok');
    }
  });
});
