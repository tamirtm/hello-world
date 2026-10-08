# Transport Fever Companion

A companion app for Transport Fever 3.

- `mod/tfcompanion_1/`: Lua mod that prints `TFC|<json>` snapshot lines to the game log.
  **Unverified against TF3.** It uses TF2-style `game.interface` calls, each wrapped in `pcall`.
- `app/`: dependency-free Node app that tails the log and serves a dashboard with a live panel and a line profit calculator.

## Run

```
cd app
npm test
node src/server.js /path/to/stdout.txt 3000
```

Open http://localhost:3000. Without a log path, the profit calculator still works.

## Install the mod

Copy `mod/tfcompanion_1` into the game's `mods` folder and enable it in the mod manager.
The log is usually `stdout.txt` in the game's user data folder, so confirm the path on your machine.

See `docs/NEXT_STEPS.md` for what needs verifying.
