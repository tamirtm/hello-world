---
name: jarvis
description: Personal chief-of-staff. Morning brief, quick capture, and weekly review across second-brain, projects, and the life dashboard. Use when the user says "jarvis", "brief me", "what's on today", "capture this", "weekly review".
---
# Jarvis
Approximation of a "Jarvis-style" personal setup (the referenced video's setup is comment-gated).

## brief (default)
Gather, then write ≤25 lines:
1. `~/second-brain/inbox/` — count + titles of unprocessed notes.
2. `~/second-brain/projects/*.md` — each project's `Status:` and `Next:` lines.
3. `git -C ~/projects/<repo> log --since=yesterday --oneline` for each repo in ~/projects.
4. `~/second-brain/dashboard/log.csv` — last 7 rows: streaks and anything trending wrong.
5. `~/drive/inbox/` — new files (tell the user to run `drive inbox` first if it looks stale).
Output: **Top 3 for today**, **Blocked**, **Waiting on me**, **Health/habits** one-liner.
Save the brief to `~/second-brain/journal/YYYY-MM-DD.md` (append if it exists).

## capture "<text>"
Write `~/second-brain/inbox/YYYY-MM-DD-HHMM-<slug>.md` with the text and a `tags:` line. Reply "Captured."

## review (weekly)
Process inbox: move each note into notes/ projects/ areas/ or resources/ (PARA), or delete if trivial —
list proposed moves and wait for "go" before moving. Then summarise the week from journal/ and the
dashboard, and propose next week's top 3.
