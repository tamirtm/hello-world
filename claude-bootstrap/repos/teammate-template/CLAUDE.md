# Teammate: <job-name>
One agent, one job. Clone this repo per job:
`gh repo create <job-name> --private --template tamirtm/teammate-template --clone` (run inside ~/projects)

## Job
- Input: <source>
- Output: outputs/YYYY-MM-DD.md (and ~/drive/outputs/<job-name>/ if it's for sharing)
- Done when: <checkable condition>
- Schedule: <manual | daily via `teammate-run ~/projects/<job-name> "Do your job"`>

## Rules
- Read ~/second-brain/CLAUDE.md first. Stay inside this repo, ~/second-brain/inbox, ~/drive/outputs.
- Never push, publish, email, or spend. Record "Needs human:" items at the end of the output.
- Keep a dated line per run in RUNLOG.md: what changed, cost if shown.
