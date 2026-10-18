---
name: life-log
description: Log daily life metrics (sleep, workout, deep work, mood, spend, notes) and rebuild the life dashboard. Use when the user says "log today", "slept 7h", "spent $40", "how's my week", or "dashboard".
---
# Life log
Data: `~/second-brain/dashboard/log.csv`, columns:
`date,sleep_h,workout_min,deep_work_h,mood_1_5,spend_cad,notes`

## log
Parse what the user said into those columns (blank if not given). If a row for today exists,
update only the fields mentioned; otherwise append. Use today's date unless told otherwise.
Then run `python3 ~/second-brain/dashboard/build.py` and reply with the one-line summary it prints.

## how's my week / dashboard
Run the build script, then give 3 observations (trend, streak, outlier) from the last 7 vs 30 days.
The HTML is at `~/second-brain/dashboard/dashboard.html`; to open it from WSL:
`explorer.exe "$(wslpath -w ~/second-brain/dashboard/dashboard.html)"`.
