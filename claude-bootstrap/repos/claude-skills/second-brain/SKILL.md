---
name: second-brain
description: Recall from and file into the user's second brain (~/second-brain, plus ~/drive/context). Use when the user asks "what do I know about", "find my notes on", "remember that", or when a task needs their past decisions, preferences, or project history.
---
# Second brain
Source of truth: `~/second-brain` (git). Read-only mirror of Drive: `~/drive/context`.

## recall "<topic>"
1. `grep -ril "<topic and synonyms>" ~/second-brain ~/drive/context` (rg if available).
2. Read the top hits (most recent first). Quote file path + line for every claim.
3. Answer, then list gaps: "Not in your notes: …".

## remember "<fact>"
- Durable preference/decision about the user → append to `~/second-brain/CLAUDE.md` under the right heading.
- Anything else → new note in `~/second-brain/inbox/` (jarvis review files it later).
- Never rewrite existing notes without asking; append with a dated line instead.

## Commit
After writing, run `git -C ~/second-brain add -A && git -C ~/second-brain commit -m "brain: <summary>"`.
Pushing is the human's call (`git push` asks for approval).
