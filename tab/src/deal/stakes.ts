// What's on the line. Stakes are text IOUs only: the app never holds or moves anything.
// Drink-type stakes are always "loser buys" - there is deliberately no "loser drinks" preset.

export const POINTS_POT = 100;

export type Stake =
  | { kind: 'points' }
  | { kind: 'unit'; id: string; label: string; one: string; many: string; loserBuys: boolean }
  | { kind: 'custom'; text: string };

export const STAKE_PRESETS: ReadonlyArray<Stake & { label: string }> = [
  { kind: 'unit', id: 'drink', label: 'A drink', one: 'drink', many: 'drinks', loserBuys: true },
  { kind: 'unit', id: 'round', label: 'Next round', one: 'round', many: 'rounds', loserBuys: true },
  { kind: 'unit', id: 'coffee', label: 'Coffee', one: 'coffee', many: 'coffees', loserBuys: true },
  { kind: 'unit', id: 'dishes', label: 'Dishes', one: 'night of dishes', many: 'nights of dishes', loserBuys: false },
  { kind: 'points', label: 'Points' },
];

export const POINTS_NOTE = "Points are for bragging rights only. They can't be bought, sent or cashed out.";

/** Stable id for a preset: "points" or the unit id. */
export function presetId(p: Stake): string {
  return p.kind === 'points' ? 'points' : p.kind === 'unit' ? p.id : 'custom';
}
