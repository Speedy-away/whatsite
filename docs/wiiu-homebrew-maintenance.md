# Wii U homebrew collection

`node scripts/build-wiiu-homebrew.cjs` rebuilds only
`/console/retro/wiiu.html`. Its exported entry point is `buildWiiUHomebrew`.
It reads the original 16-app catalogue and the additive
`docs/wiiu-homebrew-extra-catalog.json` / `extra-downloads.json` pair. Original
versions, IDs and download files stay intact. Duplicate app IDs stop the build.
`node scripts/build-wiiu-more.cjs` rebuilds this page and the separate
`/console/retro/wiiu-themes.html` page without running any broad console builder.
`node scripts/build-retro-page.cjs` includes the Wii U card beside the existing
Retro platforms. The root orchestration owns additive sitemap entries.

The catalogue pins 15 checked Homebrew App Store packages and one official
FTPiiU Plugin release. Original store metadata and project evidence remain in
the scoped Wii U JSON files. Store versions stay pinned even where the linked
upstream release is newer. No whole repository or other OS variant is acquired.

`node scripts/archive-wiiu-homebrew.cjs --check` validates jobs without writes.
`--prepare` downloads to the workspace, verifies captured MD5/SHA-256, inspects
ZIP paths/CRC and Wii U headers, creates ready public builds, and marks records
`prepared`. It does not write the F: archive or shared inventory.

`--download` reuses those verified staged bytes, preserves original containers
and builds in `F:/whatsite-backup-downloads-etc`, and merges the latest
inventories. Use normal sandbox approval. The importer uses the established
archive layout, explicit Wii U platform and categories, and hash-qualified names
when different bytes already occupy a destination. Previous versions and
inventory snapshots remain intact. No downloaded build is executed.

The original Wii U public collection budget is 220 MiB with files below 95 MiB. WUHB,
PowerPC RPX, WPS and WMS formats are checked as data. Self-contained WUHB or WPS
builds can be extracted when no runtime companions are required. Inkay retains
both its WPS and WMS; RetroArch retains the complete four-core/data bundle.
FAKE-08's documented standalone RPX uses a legacy launch route and user-provided
cartridges. The official FTPiiU release ZIP is flat: copy its WPS into the Aroma
plugins folder rather than simply extracting it at the SD root.

After archiving, run `node scripts/refresh-local-download-index.cjs --write`,
rebuild the Wii U page, then run `node scripts/verify-wiiu-homebrew.cjs` and the
normal `node scripts/audit-site.cjs`. The scoped check reads every archived and
public file back and verifies size, SHA-256, build headers, local links and
preserved Retro navigation. Physical-console installation was not tested.

Additional apps and themes use scoped sidecars with the cooperating
`scripts/console-expansion-archive.cjs` intake helper. Its CLI merges these into
the latest inventories; never replace a shared inventory with a stale snapshot.
Run the helper with `--inventory=docs/<scope>-private-inventory.json --verify`
using normal F: permissions. The parent coordination chat owns the final shared
archive index and sitemap refresh. New public downloads use distinct
`/downloads/wiiu-more/` and `/downloads/wiiu-themes/` folders.

The theme catalogue is `docs/themezer-wiiu-catalog.json`; its source/build entry
point is `scripts/build-wiiu-themes.cjs`. Treat Wii U Menu and vWii themes as
different targets. Use only source-confirmed region, title ID, menu version and
format support; the Themezer platform label alone proves none of those. Keep
modern patch packages and full companion assets intact. The catalogue records
the exact theme renderer and manager versions separately from legacy SDCafiine
redirection instructions. No page recommends writing theme files into NAND.

Preservation/check/browser results for this expansion are recorded in
`docs/chat-handoffs/wiiu-more.json`. The pages retain the shared mobile,
background and `/languages/i18n.js?v=3` integration. No commit or deployment is
part of the scoped build.
