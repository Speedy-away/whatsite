# Site downloads and local archive

## Upstream links and large files

For new games, apps and homebrew, keep the original GitHub release asset or
publisher download link on the website and save the ready-to-use copy locally
in the archive. Do not add another large binary mirror to the website repo.
Game mods may remain mirrored where their existing download workflow needs it.
Use version-specific links and preserve all firmware/game compatibility pins;
never silently redirect an older build to a newer release or a `latest` URL.

The current cleanup starts at 10 MiB for games/apps/homebrew. Its verified
delivery mapping is `docs/download-source-links.json`; use
`scripts/source-link-cleanup.cjs` to verify archive bytes and upstream links.
Removing a verified mirror from Git's current tree must keep the working file,
every F: archive version and its source/version/size/SHA-256 inventory. Never
rewrite repository history or delete the originals as part of this cleanup.

When adding a downloadable mod menu, script, payload or console tool to the site,
also save its relevant ready-to-use file locally in
`F:\whatsite-backup-downloads-etc`. Keep its source URL, version, size and SHA-256
in the download inventory. Do not execute downloaded payloads.

Keep every existing download and older version. Organizing files may move or
rename them within the backup, but must not delete files, replace a different
file at a destination, or discard duplicate versions. Keep source code separate
from ready-to-use builds and desktop/mobile helpers. Use
`scripts/download-archive-layout.cjs` for the platform/game folder layout.

For new GitHub entries, download relevant release assets, rather than cloning
the entire repository or every OS variant. Download a source-code archive only
when that is the requested item. Bstlar downloads remain skipped unless the
user explicitly asks to include them. Record inaccessible links truthfully.

An on-demand request such as **"check and download the latest local console
updates"** should use `scripts/update-local-downloads.cjs --download`, then
refresh the organized archive index. A check-only request uses `--check`.
Do not create a scheduled monitor unless the user asks for one. Preserve pinned
game/firmware compatibility on website links; a new upstream version is not
permission to silently change an existing compatibility-specific entry.

Follow normal sandbox/permission tooling for F: writes. The user has explicitly
requested this local-saving workflow; do not repeatedly ask whether to keep
routine new downloads in the archive.

# Multi-game Call of Duty resources and PS3 variants

MultiCOD means a resource supports more than one Call of Duty game. This applies
across PS3, PS4, PS5, Xbox 360 and other platforms. Give every source-confirmed
supported game its own page and cross-list the resource there; a MultiCOD index
may group those entries but is not a game. Do not infer game, region, update or
platform compatibility from the MultiCOD label alone.

DEX and HEN download variants apply to PS3 only. When the source supplies both,
keep both downloads visible and separately labelled, including Jimbo's DEX and
HEN builds. Preserve each original file, version and compatibility requirement.

# Resume ongoing console expansion

Read `docs/console-expansion-handoff.json` before resuming the current console
expansion. It records completed work, exact final helper versions, archive
verification, remaining checks and the latest user clarifications. Update it
after finishing work so a later session can continue without replacing shared
changes or losing older downloads.

# Independent PS4 / PS5 host site

The user moved host development and publishing to
`C:/Users/whatw/Documents/GitHub/WWB-HOST`, published at
`https://speedy-away.github.io/wwb-host/`. Make future host changes there.
This main repository keeps navigation links and compatibility redirects;
its historical native files and downloads remain preserved. Do not regenerate
an active host site here or overwrite its migration redirects. Reconcile any
host edits already in progress with the new repository before publishing them.
