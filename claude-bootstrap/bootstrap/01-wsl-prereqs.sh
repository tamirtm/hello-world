#!/usr/bin/env bash
# Run inside WSL2 Ubuntu. Installs git/jq/sandbox deps, gh, Claude Code, rclone.
set -euo pipefail
sudo apt-get update
sudo apt-get install -y git jq curl ripgrep python3 bubblewrap socat unzip

# GitHub CLI (official apt repo)
if ! command -v gh >/dev/null; then
  sudo mkdir -p -m 755 /etc/apt/keyrings
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null
  sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update && sudo apt-get install -y gh
fi

# Ubuntu 24.04+: let bubblewrap create user namespaces (Claude Code sandbox)
if [ "$(sysctl -n kernel.apparmor_restrict_unprivileged_userns 2>/dev/null || echo 0)" = "1" ]; then
  sudo tee /etc/apparmor.d/bwrap >/dev/null <<'AA'
abi <abi/4.0>,
include <tunables/global>

profile bwrap /usr/bin/bwrap flags=(unconfined) {
  userns,
  include if exists <local/bwrap>
}
AA
  sudo systemctl reload apparmor
fi

# Claude Code (native installer) and rclone (official script; apt's is outdated)
command -v claude >/dev/null || curl -fsSL https://claude.ai/install.sh | bash
command -v rclone >/dev/null || (curl -fsSL https://rclone.org/install.sh | sudo bash)

echo "Next: gh auth login -p https -w && gh auth setup-git"
