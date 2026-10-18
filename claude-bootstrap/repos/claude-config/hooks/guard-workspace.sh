#!/usr/bin/env bash
# PreToolUse guard: file tools may only write inside the agent workspace.
# Exit 2 = block (stderr is shown to Claude). Exit 0 = normal permission flow.
set -u
ALLOWED=("$HOME/projects" "$HOME/second-brain" "$HOME/drive/outputs")
path=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -z "$path" ] && exit 0
real=$(realpath -m -- "$path")
case "$real" in
  */.git/*|*/.claude/settings*.json|*/.claude/hooks/*)
    echo "Blocked: agents may not edit git internals or their own permissions ($real)" >&2; exit 2 ;;
esac
for root in "${ALLOWED[@]}"; do
  [[ "$real" == "$root" || "$real" == "$root"/* ]] && exit 0
done
echo "Blocked: $real is outside the workspace (${ALLOWED[*]})" >&2
exit 2
