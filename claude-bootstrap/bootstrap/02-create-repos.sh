#!/usr/bin/env bash
# Creates private repos from this kit, clones them into ~, and installs config + skills.
# Usage: bash 02-create-repos.sh   (run from inside claude-bootstrap/bootstrap)
set -euo pipefail
KIT=$(cd "$(dirname "$0")/.." && pwd); OWNER=$(gh api user -q .login)
for name in claude-config claude-skills second-brain teammate-template; do
  dest="$HOME/$name"
  if [ -d "$dest/.git" ]; then echo "skip $name (exists)"; continue; fi
  cp -r "$KIT/repos/$name" "$dest"
  git -C "$dest" init -q -b main && git -C "$dest" add -A && git -C "$dest" commit -qm "init $name"
  (cd "$dest" && gh repo create "$OWNER/$name" --private --source . --push)
done
gh repo edit "$OWNER/teammate-template" --template
mkdir -p ~/projects
bash ~/claude-config/install.sh
bash ~/claude-skills/install.sh
echo "Done. Open a new shell (PATH), then: bash $KIT/bootstrap/03-rclone-drive.sh"
