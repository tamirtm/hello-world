# Tab: decisions and open questions

## Phase 0: things I was unsure about (please rule on these)

1. **Where the project lives.** This session can only write to `tamirtm/hello-world`, so Tab
   is in the `tab/` folder on branch `claude/adoring-bohr-sw4vot`, next to the Glide game I
   built before your brief arrived. Both are self-contained. Tell me if you want Tab moved to
   its own repo (I need access to one) or Glide removed.
2. **Expo and Supabase docs could not be read.** The docs sites and Expo's version service are
   blocked by this environment's network rules. I used the official `create-expo-app`
   scaffolder (Expo SDK 58, `blank-typescript` template) and took web package versions from
   the compatibility table that ships inside the `expo` package, so versions are the current
   stable matched set, but I did not read the setup pages themselves. Supabase is not
   installed yet; I will need `supabase.com` docs reachable before Phase 1.
3. **Who backs YES.** The spec says A backs YES. So the person who sets up the bet backs YES by
   default. If the friend's number is higher, the app says there is no bet this way round and
   offers a "Swap sides" button. If both give the same number, it says they agree and offers
   no swap. Alternative: assign sides automatically to whoever is more confident.
4. **"Nearest" ratio is measured on the ratio itself** (q/(1-q)), ties going to the more even
   ratio. This matches both required cases. Measuring on probability instead would make
   q = 0.55 an exact tie between 1:1 and 3:2.
5. **Prices beyond 5:1 are capped at 5:1** for indivisible stakes (anything above about 85%).
   The long-shot side gets a slightly worse deal than fair there. Alternative: refuse
   indivisible stakes at extreme prices and suggest points.
6. **Points pot is fixed at 100**, rounded to whole points that always sum to 100. The spec
   example uses 100; there is no pot-size control yet.
7. **Free-text stakes use the same snapped ratios** ("Ana puts up 2 x ..., Ben puts up 1 x ...").
   That reads oddly for one-off favours like "washes the car". Alternative: free-text stakes
   only at even odds.
8. **Dishes** is counted in "nights of dishes" so that uneven ratios make sense.
9. **18+ confirmation.** The hard rule says "at sign-up", and Phase 0 has no accounts. Because
   drink stakes exist, I added a one-tap "I'm 18 or over" screen on first open, remembered in
   the browser. It is a self-declaration, not verification. Phase 1 needs the real one at sign-up.
10. **Report button and blocking are not in Phase 0.** With no accounts or backend there is
    nobody to report or block and nowhere to send a report: both people are holding the same
    phone. The word filter is in. Report and block arrive with accounts in Phase 1 (the
    `reports` table is already in your Phase 1 list).
11. **The word filter is basic.** It blocks a short list of abusive words (with simple
    disguises like "sh1t"), and on the stake field it blocks money terms, dares, physical
    forfeits and "loser drinks" phrasings. A determined person can get round a word list; it
    will also sometimes block innocent text ("pounds" in a stake, a surname that is also a
    swear word). In Phase 1 the same check must run server-side.
12. **Money words are only blocked in the stake field.** A bet like "Bitcoin closes above
    $100k" is allowed, because that is the thing being bet on, not what is owed.
13. **Names are optional** and default to "Player 1" and "Player 2".
14. **Pools are in the odds engine and tested but have no screen**, as Phase 0 is 1v1 only.
15. **Dark theme only**, chosen for bars. No light theme yet.

## Testing status

- `npm test`: 39 unit tests pass, including every required odds case.
- `npm run e2e`: passes in Chromium emulating an iPhone 13. It walks the full flow with touch
  input for points, drinks at 1:1 and 3:1, the swap-sides case, the agree case, and blocked
  money / forfeit stakes, and checks tap-target sizes and that the first number stays hidden.
- Not tested: a physical phone, Safari, Firefox, and the native iOS/Android builds.

## Housekeeping

- Removed the `LICENSE` file the Expo template dropped in: it was Expo's own MIT notice with
  their copyright, which would have wrongly presented Tab as MIT-licensed by Expo. Tab has no
  licence file; add one if you want it open source.
