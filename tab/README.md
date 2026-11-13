# Tab (working name)

Friends make casual wagers for non-cash stakes: a drink, the next round, the
dishes. Tab does the odds math and, from Phase 1, keeps a tab of who owes what.

**Status: Phase 0 (odds calculator) is built and waiting for review. Phases 1 and 2 are not started.**

## Hard rules

- No money. The app never holds, moves or takes a cut of money. No payment links, deposits or prizes.
- Points are minted by the app only. They cannot be bought, transferred or cashed out.
- Stakes are text IOUs. No physical forfeits, no dares, and drink stakes are always "loser buys".
- At most 10 people in a group bet.
- 18+ only. Free text gets a word filter, a report button and blocking.

## Run it

```sh
npm install
npm run web          # dev server, opens in the browser
npm test             # unit tests (Vitest)
npm run typecheck
npm run build:web    # static build in dist/
npm run e2e          # phone-sized browser walk-through of dist/ (needs Playwright)
```

## Folder structure

```
tab/
  App.tsx                 app shell
  src/
    odds/                 ALL the math. Pure TypeScript, no UI or network imports.
      belief.ts             probability -> decimal / american odds, fair risk
      split.ts              split the difference (1v1), whole-number point stakes
      snap.ts               snap to 1:1, 3:2, 2:1, 3:1, 4:1, 5:1 for indivisible stakes
      pool.ts               pari-mutuel pools, void rule, 10-person cap
      format.ts             display rounding
      odds.test.ts          the required cases plus property checks
    deal/                 pure wording and content, no UI imports
      stakes.ts             stake presets
      templates.ts          bet templates
      describe.ts           price -> the deal in plain words
      deal.test.ts
    moderation/
      filter.ts             word filter and hard-rule checks for free text
    ui/                   React Native screens and controls
      Calculator.tsx        the single Phase 0 screen
      controls.tsx, theme.ts, ageGate.ts
  scripts/e2e.mjs         browser test of the whole flow
```

Decisions and open questions are in [DECISIONS.md](DECISIONS.md).
