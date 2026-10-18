#!/usr/bin/env bash
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd); mkdir -p ~/.claude/skills
for d in "$here"/*/; do n=$(basename "$d"); ln -sfn "$here/$n" ~/.claude/skills/"$n"; echo "linked $n"; done
