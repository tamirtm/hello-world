# Decisions

Choices I made on my own while you were away, with the reasoning, so you can
overrule any of them. Each has a **Revisit if** line saying what would change my mind.

## Needs your call

These are the ones I could not or should not settle alone.

1. **This lives in `hello-world`, on branch `claude/adoring-bohr-sw4vot`, not a brand-new repo.**
   This session can only write to `tamirtm/hello-world`, so I could not create a separate
   repository. The project is self-contained, so moving it later is a copy. No pull request
   is open — say the word and I will open one, or move it to a new repo once access allows.
2. **The old README was replaced.** It held one placeholder line ("these are changes in the
   document see if this works"). It is still in git history.
3. **Not published anywhere.** The game is ready for GitHub Pages, but turning Pages on makes
   it public, so I left that to you (steps are in the README).

## Product

4. **What to build: an original puzzle game ("Glide").** You left the choice open. I picked
   something that is finished and fun on its own, playable on a phone, and whose correctness
   can be checked by a machine (a solver proves every level is solvable) rather than by taste.
   *Revisit if* you wanted a tool for your work instead — the engine/UI split here is small
   enough to set aside.
5. **Slide-until-blocked mechanic, plus "pads" that stop the puck.** Sliding is a classic
   genre mechanic; pads add a second decision type without new controls. No art, names or
   levels are taken from any existing game.
6. **Levels are generated, not hand-made.** A seed fully determines a level, so there is no
   level data to maintain and the game never runs out. The cost: generated levels are less
   crafted than hand-built ones. *Revisit if* early levels feel samey — a hand-made tutorial
   set for levels 1–5 would be the first thing I would add.
7. **Par is the provably shortest solution**, found by exhaustive search. Three stars at par,
   two within two moves, one otherwise.
8. **Hints are free and unlimited**, but a win that used one says "with hints". The shared
   daily result does not mention hints. *Revisit if* you want the daily to be competitive.
9. **Levels unlock in order**; you can go back to any cleared level but not skip ahead.
10. **Daily puzzle uses the device's local date**, so it rolls over at the player's midnight
    rather than at one global moment. People in different time zones briefly see different
    dailies.
11. **Progress is stored only in the browser** (localStorage). No accounts, no server, no
    analytics. Clearing site data resets progress.

## Technical

12. **No dependencies and no build step.** Plain HTML/CSS/ES modules; tests use Node's
    built-in runner. Nothing to install, nothing to go stale, and it deploys by copying files.
    *Revisit if* the UI grows past one screen.
13. **DOM + CSS for the board, not canvas.** Free animation, crisp at any size, and
    accessible focus/labels. Boards top out at 100 cells so performance is a non-issue.
14. **Game rules are pure functions shared by UI, solver and generator**, so the thing the
    tests verify is the exact code the player runs.
15. **Gems are never placed on pads** — found in my first review pass; the two symbols
    overlapped and were hard to read.
16. **Offline support via a network-first service worker.** Online visits always get the
    newest version; the cache is only used with no connection. The cached file list is
    hand-written, so a unit test fails if a source file is missing from it.
17. **Browser test is not in CI.** `npm run e2e` plays levels through the real UI (keyboard,
    swipe, daily mode, reload persistence, offline) and passes here, but it needs Playwright,
    which would be the project's only dependency. CI runs the unit tests only.
    *Revisit if* UI regressions start slipping through.
18. **Changing the generator changes every level.** Seeds map to levels through the generator
    code, so any tweak reshuffles levels and invalidates saved best scores. Fine before
    launch; after launch the generator should be versioned.

## Review log

- **Pass 1** (after first playable build): gems overlapping pads → fixed (15); removed a
  no-op event handler; added offline support and its guard test.
- **Pass 2** (checked dark mode, phone landscape and desktop in a real browser):
  - The board could be taller than the screen on a phone held sideways → it now shrinks to fit.
    In landscape the Undo/Restart/Hint buttons still sit below the fold (one short scroll);
    a side-by-side landscape layout is the proper fix and is not done.
  - A corrupted save could leave the current level locked → saves are now sanitised, with tests.
  - Dismissing the win dialog with Esc left no cue about what to do next → status line now says.

## Known gaps

- Screen-reader users get labelled controls and status messages, but the board itself is
  not described cell by cell.
- No sound, no level-select grid, no hand-made tutorial levels.
- Only checked in Chromium; Safari and Firefox are untested.
