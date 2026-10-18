# Run in PowerShell (Admin) on Windows. Reboot if asked, then open "Ubuntu" from Start.
wsl --install -d Ubuntu-24.04
wsl --set-default-version 2
wsl -l -v   # expect: Ubuntu-24.04  ... VERSION 2
