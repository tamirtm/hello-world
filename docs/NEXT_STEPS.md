# Next steps

1. Read the TF3 wiki scripting section (it was blocked from the build sandbox) and confirm
   `game.interface.getPlayer/getEntity/getLines/getEntities/getGameTime` exist in TF3.
2. Confirm `print()` from a game script lands in the log, and find that file's path.
3. If it does not, check whether `io.open` is available to scripts and write a JSON file instead;
   `app/src/server.js` would then read that file.
4. Replace the guessed calls in `tfc_export.lua` with the real TF3 API and add per-line stats.
5. Add history charts to the dashboard from `/api/snapshots`.
