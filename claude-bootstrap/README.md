# Claude Code bootstrap: WSL2 + GitHub + Google Drive

Everything here is real config, with nothing stubbed out. `bootstrap/02-create-repos.sh` turns `repos/*` into your own private GitHub repos.

## 0. Layout decisions
| Piece | Lives in | Why |
|---|---|---|
| Notes / second brain | **GitHub `second-brain`** (local clone `~/second-brain`) | Git shows exactly what an agent changed, it works offline when the laptop wakes, and agents can grep it locally with no network |
| Bulk files, datasets, shareables | **Google Drive `My Drive/ClaudeCode/`** | Cheap storage for big binaries, and you can open them from your phone |
| Config, skills | GitHub `claude-config`, `claude-skills` | Versioned and portable to a future home server |
| Builds | `~/projects/<repo>` (one GitHub repo each, cloned from `teammate-template`) | One job per repo means one blast radius |
Notes and Drive are **not mirrored**, because two-way sync between them just produces conflicts. Drive `context/` is pulled one way into a read-only cache.

Drive folders, already created in your Drive: `ClaudeCode/{context,outputs,inbox,datasets,archive}`.

## 1. Install (in order)
```powershell
# Windows PowerShell (Admin)
wsl --install -d Ubuntu-24.04
```
```bash
# Inside Ubuntu (keep everything under ~, never /mnt/c, because it's ~10x faster)
git clone -b claude/quirky-archimedes-hvdrqq https://github.com/tamirtm/hello-world ~/kit
bash ~/kit/claude-bootstrap/bootstrap/01-wsl-prereqs.sh
gh auth login -p https -w && gh auth setup-git
bash ~/kit/claude-bootstrap/bootstrap/02-create-repos.sh   # creates 4 private repos + installs
exec bash                                                   # pick up ~/bin on PATH
bash ~/kit/claude-bootstrap/bootstrap/03-rclone-drive.sh    # Drive auth (browser)
claude                                                      # log in with your Claude subscription
```
Then inside `claude`:
```
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
/plugin install document-skills@anthropic-agent-skills
/plugin install superpowers@claude-plugins-official
```

## 2. Skills
| Skill | Status | Notes |
|---|---|---|
| **founder** | ⚠️ Starter rebuild | The @Opus Jake "FOUNDER" skill is comment-gated and I found no public copy. I built it from the description: 11 seats in `claude-skills/founder` |
| **jarvis** | ⚠️ Approximation | Chase AI's setup is comment-gated too. Brief, capture and weekly review are in `claude-skills/jarvis` |
| **second-brain** | ✅ Built | Mark's system (a). Recall and file notes in `~/second-brain` and `~/drive/context` |
| **teammate** | ✅ Built | Mark's system (b). Subagent template `~/.claude/agents/teammate.md` plus the `teammate-template` repo |
| **life-log** | ✅ Built | Mark's system (c). `log.csv` feeds `build.py`, which writes `dashboard.html` (tested) |
| superpowers (obra) | Public | Brainstorm, plan, TDD and review discipline for your coding work. ~300k★ |
| example-skills (Anthropic) | Public | `skill-creator` to grow your own skills, `mcp-builder` for automations, `frontend-design` and `webapp-testing` |
| document-skills (Anthropic) | Public | pptx/docx/xlsx/pdf for content deliverables |

## 3. Google Drive: rclone (not Drive for Desktop)
- **Why rclone:** it runs natively in WSL, needs no daemon, and survives sleep, because each command is a fresh API call. Drive for Desktop is a Windows streaming drive reached through `/mnt/g`, which is slow over 9P and goes stale after sleep.
- The remote `gdrive:` is **rooted at the ClaudeCode folder** (`root_folder_id`), so agents can't see the rest of your Drive.
- How agents use it (the `drive` script runs outside the sandbox, but it lives in `~/bin`, which agents can't edit):
```bash
drive pull     # Drive context/  -> ~/drive/context   (agents read here)
drive inbox    # Drive inbox/    -> ~/drive/inbox
drive push     # ~/drive/outputs -> Drive outputs/    (agents write locally, you push)
drive ls outputs
```
- Agent pattern: read `~/drive/context/**` and write `~/drive/outputs/<project>/...`, then you run `drive push`. `rclone *` is set to "ask", so an agent can't run raw rclone without approval.

## 4. Agents, permissions, cost
**Permissions** (`claude-config/settings.json` plus the `guard-workspace.sh` hook):
- `acceptEdits` mode means no prompt for file edits. The **hook blocks any Edit or Write outside** `~/projects`, `~/second-brain` and `~/drive/outputs`. It also blocks edits to `.git/`, `.claude/settings*.json` and hooks, so agents can't loosen their own rules. Tested: `/etc/passwd`, `../.bashrc` and `~/projects-evil` are all blocked.
- **Sandbox** on (bubblewrap): Bash runs without prompts, but it can only write the working dir plus `~/drive/outputs` and `~/second-brain`. Network is limited to GitHub, npm and PyPI, and any other domain prompts you. `allowUnsandboxedCommands: false` means no escape hatch.
- Deny rules: reading `~/.ssh`, `~/.aws`, `~/.config/rclone`, `.env*`, plus `sudo` and force-push. `git push` asks. Use gh HTTPS auth, because `~/.ssh` is blocked.

**Teammate per job:**
```bash
cd ~/projects && gh repo create my-job --private --template $(gh api user -q .login)/teammate-template --clone
# edit my-job/CLAUDE.md "Job" section, then:
teammate-run ~/projects/my-job "Do your job"        # headless, budgeted
# or as a subagent: cp ~/.claude/agents/teammate.md ~/.claude/agents/my-job.md and edit it
```

**Cost guardrails:**
| Layer | Setting |
|---|---|
| Plan | Use a **subscription** (Pro ≈ C$28/mo, Max 5x ≈ C$139, Max 20x ≈ C$278 at ~1.39 CAD/USD, before GST/RST). That's a flat fee. The only surprise-bill path is **usage credits**, so leave them OFF or set a monthly limit at claude.ai/settings/usage (`/usage-credits` opens it) |
| Per run | `teammate-run` passes `--max-budget-usd` (default $1) and `--max-turns 40` |
| Per day | `teammate-run` refuses to start once `~/.claude/spend.log` reaches `DAILY_CAP_USD` (default $5) for today |
| Live view | Status line shows the session cost in USD and ≈CAD. `/usage` shows plan bars and attribution (skills, subagents, loops) |
| If you use an API key | Set a workspace spend limit on the "Claude Code" workspace at platform.claude.com and check Usage there. That's the authoritative bill |
| Model | Default `sonnet`. Switch with `/model` for hard tasks |

## 5. Verification checklist
| # | Run | Expect |
|---|---|---|
| 1 | `wsl -l -v` (PowerShell) | Ubuntu-24.04, VERSION 2 |
| 2 | `claude --version && gh auth status && rclone version` | Three versions and "Logged in to github.com" |
| 3 | `gh repo list --limit 10` | claude-config, claude-skills, second-brain, teammate-template (private) |
| 4 | `ls -l ~/.claude/settings.json ~/.claude/skills` | Symlinks into ~/claude-config and ~/claude-skills |
| 5 | In claude: `/sandbox` | Enabled, no missing dependencies |
| 6 | Ask Claude: `run: touch ~/sandbox-probe` | Fails with `Read-only file system`. Decline any retry outside the sandbox |
| 7 | Ask Claude: "write hello to ~/outside.txt" | Blocked with the message "outside the workspace" |
| 8 | In claude: `/hooks` | PreToolUse → guard-workspace.sh |
| 9 | `/plugin` → Installed | superpowers, example-skills, document-skills |
| 10 | Say "founder: should I raise my price 20%?" | Board answer with a CFO margin table |
| 11 | Say "jarvis capture test idea", then `ls ~/second-brain/inbox` | New dated .md file |
| 12 | Say "log today: slept 7h, mood 4" | Row in log.csv, plus a 7d summary line |
| 13 | `rclone lsf gdrive:` | archive/ context/ datasets/ inbox/ outputs/ |
| 14 | `echo hi > ~/drive/outputs/test.txt && drive push` | test.txt appears in Drive ClaudeCode/outputs |
| 15 | `DAILY_CAP_USD=0 teammate-run ~/projects/my-job "hi"` | "Daily cap reached… Not running." (exit 3) |
| 16 | Status line | `Sonnet \| $0.00 USD (≈C$0.00) \| <dir>` |

Startups program: see [STARTUPS.md](STARTUPS.md).
