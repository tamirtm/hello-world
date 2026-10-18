#!/usr/bin/env bash
# Status line: model | session cost USD (≈CAD). CAD_RATE defaults to 1.39.
in=$(cat)
model=$(jq -r '.model.display_name // "?"' <<<"$in")
usd=$(jq -r '.cost.total_cost_usd // 0' <<<"$in")
cad=$(awk -v u="$usd" -v r="${CAD_RATE:-1.39}" 'BEGIN{printf "%.2f", u*r}')
printf '%s | $%.2f USD (≈C$%s) | %s' "$model" "$usd" "$cad" "$(basename "$(jq -r '.workspace.current_dir // "."' <<<"$in")")"
