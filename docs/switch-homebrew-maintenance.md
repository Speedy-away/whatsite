# Nintendo Switch homebrew catalogue

The Switch hub remains at `/console/nintendo-switch.html`, including the
`#cfw`, `#homebrew` and `#firmware-downloads` anchors. The curated apps page is
`/console/nintendo-switch/apps.html`.

Run `node scripts/build-switch-homebrew.cjs` to rebuild only these Switch
changes. It uses `build-console-guides.cjs` for the shared page shell, adds
managed blocks to the existing hub, and adds the canonical apps URL to the
current sitemap without replacing other entries. It does not rebuild other
console pages or change language files.

`docs/switch-homebrew-catalog.json` holds the selected store builds and install
requirements. Source and image evidence is in the other `switch-homebrew-*`
JSON files. Missing upstream icons use original generic network artwork; their
404 responses are recorded in the image provenance.

The acquisition command is `node scripts/archive-switch-homebrew.cjs --download`.
It writes to the authorized F: archive, so run it with normal sandbox approval.
`--check` validates the jobs without downloads or writes. Builds are inspected
as bytes and are never executed. Captured store MD5, ZIP CRC and paths, NRO
headers and local SHA-256 hashes are checked. Relevant pinned GitHub NRO release
assets are downloaded separately where the project supports a standalone NRO.

Original store ZIPs, extracted builds and official assets are preserved using
`scripts/download-archive-layout.cjs`; different files never replace an existing
archive destination. Inventories are reread before merging, and pre-run inventory
snapshots are retained under `archive-history/`. The Switch public mirror has a
384 MiB collection budget and files below 95 MiB. This scope preserves the older
public download collections, which already exceed the earlier global budget.
No source-code or PC/mobile helper archive is part of this collection.

The apps page accepts a shareable `?category=Emulators#apps` or
`?category=Homebrew%20games#apps` URL. The category control updates that URL while
keeping the original canonical page. Emulator setup is at `#emulator-setup`.
Game-specific mods and their requirements live at
`/console/nintendo-switch/mods.html`; their separate importer preserves the
game/version archive folders. Wii U has its own Retro page and importer, with
WUHB/RPX/WPS formats kept separate from Switch NROs.

Optional official GitHub console release ZIP/7z assets are preserved in F:
alongside the store packages. The store NRO or complete SD bundle stays the
primary public download. This avoids publishing duplicate containers while
keeping the original official build available locally.

After downloads, run `node scripts/refresh-local-download-index.cjs --write`
with archive write permission, rebuild the Switch page, then run
`node scripts/verify-switch-homebrew.cjs` and `node scripts/audit-site.cjs`.
The first check verifies only Switch files; the whole-site audit can include
unfinished changes from other console tasks. Browser QA should cover app/tag
search, categories, empty results, file details and narrow viewports.

Store builds stay pinned to their checked metadata. For example, the selected
90DNS tester is 1.0.4 while its linked upstream release is 1.1.0. A newer upstream
version does not silently change an existing compatibility-specific entry.
