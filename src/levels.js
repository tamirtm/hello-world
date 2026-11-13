// Difficulty curve for the endless level sequence, plus the daily puzzle.

import { generate } from './generator.js';

/** Generator options for level number n (1-based). Ramps size, gems and par. */
export function optionsForLevel(n) {
  const t = Math.max(0, n - 1);
  const size = Math.min(6 + Math.floor(t / 6), 10);
  const gems = Math.min(2 + Math.floor(t / 4), 6);
  const minPar = Math.min(3 + Math.floor(t / 3), 12);
  return {
    w: size,
    h: size,
    gems,
    pads: Math.min(1 + Math.floor(t / 5), 4),
    wallDensity: 0.13 + Math.min(t, 20) * 0.002,
    minPar,
    maxPar: minPar + 2,
  };
}

export function levelFor(n) {
  return generate(`glide-level-${n}`, optionsForLevel(n));
}

/** YYYY-MM-DD in the player's local time zone. */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DAILY_OPTIONS = { w: 8, h: 8, gems: 5, pads: 3, wallDensity: 0.15, minPar: 8, maxPar: 11 };

export function dailyLevel(key = dateKey()) {
  return generate(`glide-daily-${key}`, DAILY_OPTIONS);
}

/** 3 stars at par, 2 within two moves of par, otherwise 1. */
export function starsFor(moves, par) {
  if (moves <= par) return 3;
  if (moves <= par + 2) return 2;
  return 1;
}

/** Consecutive daily wins ending today or yesterday. `days` maps dateKey -> record. */
export function dailyStreak(days, today = new Date()) {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days[dateKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
