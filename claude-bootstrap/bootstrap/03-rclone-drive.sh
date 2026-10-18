#!/usr/bin/env bash
# Configure rclone remote "gdrive:" rooted at My Drive/ClaudeCode (agents can't see the rest of Drive).
# A browser link appears; open it in Windows (WSL forwards localhost:53682), approve, return here.
set -euo pipefail
CLAUDECODE_FOLDER_ID=11rfDv30eFH-Nqm176WnwbXUDGWbfy2YN
rclone config create gdrive drive scope=drive root_folder_id="$CLAUDECODE_FOLDER_ID"
chmod 600 ~/.config/rclone/rclone.conf
rclone lsf gdrive:     # expect: archive/ context/ datasets/ inbox/ outputs/
drive pull && echo "Drive OK"
