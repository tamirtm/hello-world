// Word filter for free-text fields. Pure and unit-tested.
//
// Two jobs:
//  1. Language: block abusive words in any free text.
//  2. Hard rules, on the stake field only: no money, no physical forfeits or
//     dares, and no "loser drinks" - drink stakes are always "loser buys".
//
// This is a first line of defence, not a complete one: word lists are easy to
// dodge. Phase 1 adds the report button and blocking that back it up.

export type FieldKind = 'bet' | 'stake' | 'name';
export type FilterResult = { ok: true } | { ok: false; reason: 'language' | 'money' | 'forfeit'; message: string };

const LANGUAGE = [
  'fuck', 'fucker', 'fucking', 'motherfucker', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'bastard', 'wanker', 'twat', 'rape', 'rapist', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'retarded', 'tranny', 'kike', 'spic', 'chink', 'paki', 'kys',
];

const MONEY =
  /[$€£¥₹]|\b(usd|eur|gbp|cad|dollars?|bucks?|cash|money|cents?|euros?|pounds?|quid|venmo|paypal|zelle|cash\s?app|e-?transfer|bitcoin|btc|crypto|gift\s?cards?|paycheck|wages?)\b/;

const FORFEIT =
  /\b(slaps?|punch(es)?|kicks?|hits?|spank(s|ing)?|wax(es|ing)?|dares?|tattoos?|shaves?|naked|nude|strips?|streaks?|kiss(es)?)\b|\b(loser|loosers?)\s+(drinks?|chugs?|downs?|does|takes?|sculls?|skulls?)\b|\b(has|have|must|got|gotta|need|needs)\s+(to\s+)?(drink|chug|down|scull|skull|finish)\b|\b(chugs?|shotguns?|sculls?|skulls?)\b|\b(takes?|does?|do|drinks?|downs?)\s+(a|an|the|\d+|two|three|four|five)\s+(shots?|pints?|beers?|drinks?)\b/;

const MESSAGES = {
  language: "Let's keep it friendly. Try different words.",
  money: 'No money on Tab. Stakes are IOUs like a drink, a coffee or points.',
  forfeit: 'No dares or physical forfeits, and drink stakes are always “loser buys”.',
} as const;

/** Lower-case, undo common letter swaps, and collapse stretched letters ("shiiit"). */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[@4]/g, 'a')
    .replace(/[!1|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/(.)\1{2,}/g, '$1');
}

const fail = (reason: keyof typeof MESSAGES): FilterResult => ({ ok: false, reason, message: MESSAGES[reason] });

export function checkText(text: string, field: FieldKind): FilterResult {
  const lower = text.toLowerCase();
  const words = normalise(text).split(/[^a-z]+/).filter(Boolean);
  // Also catch a word spelled out with separators: "f.u.c.k", "s h i t".
  const squeezed = normalise(text).replace(/[^a-z]+/g, '');
  const spelledOut = /^(?:[a-z0-9@!|$][^a-z0-9@!|$]+){2,}[a-z0-9@!|$]$/i.test(text.trim());
  if (words.some((w) => LANGUAGE.includes(w)) || (spelledOut && LANGUAGE.includes(squeezed))) return fail('language');

  if (field === 'stake') {
    // Money and forfeits are matched on the text as typed: digits matter here ("$5", "3 shots").
    if (MONEY.test(lower)) return fail('money');
    if (FORFEIT.test(lower)) return fail('forfeit');
  }
  return { ok: true };
}
