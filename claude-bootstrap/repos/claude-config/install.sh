#!/usr/bin/env bash
# Symlink this repo into ~/.claude and ~/bin. Safe to re-run; backs up real files once.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
mkdir -p ~/.claude ~/bin ~/projects ~/drive/{context,inbox,outputs}
link() { [ -e "$2" ] && [ ! -L "$2" ] && mv "$2" "$2.bak.$(date +%s)"; ln -sfn "$1" "$2"; }
link "$here/settings.json" ~/.claude/settings.json
link "$here/CLAUDE.md"     ~/.claude/CLAUDE.md
link "$here/hooks"         ~/.claude/hooks
link "$here/agents"        ~/.claude/agents
link "$here/statusline.sh" ~/.claude/statusline.sh
for f in "$here"/bin/*; do link "$f" ~/bin/"$(basename "$f")"; done
chmod +x "$here"/hooks/*.sh "$here"/statusline.sh "$here"/bin/*
grep -q 'HOME/bin' ~/.bashrc || echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
echo "claude-config installed."
