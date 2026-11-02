# PC emulator catalogue

`docs/pc-emulator-catalog.json` is the source for the four desktop emulator
catalogues. `scripts/build-pc-emulators.cjs` rebuilds them and adds the requested
Eden NS2 link to the existing PC landing page while preserving its other links.
This builder does not publish, change the sitemap or run broad console builders.

The catalogue contains 29 project references. OS badges are explicit records,
not inferred from the console being emulated or from a fork's upstream project.
Modes distinguish native packages, experimental packages, source builds, legacy
packages, Wine and RetroArch cores. Linux Wine support does not pass the packaged
Linux filter. Lakka and Recalbox supply hardware-specific operating-system images
and do not receive desktop OS badges.

Eden NS2 uses the exact user-supplied repository `0x2593/Eden-NS2`. At the review
on 2 November 2026 its rendered releases page had no releases. Its README documents
Windows MSYS2 builds, labels Linux untested and does not verify macOS. It is a
source-only entry, with no manufactured binary, mirror, cloned repository or
downloaded source ZIP. Author-reported game results are labelled as such.

`docs/pc-emulator-source-evidence.json` records primary README, rendered release
and expanded-asset sources. GitHub REST API 403 responses are recorded as rate
limits, separately from actual empty releases pages. The shadPS4 0.21.0 Mac route
requires macOS 26.0+ and Apple Silicon; Intel Macs are excluded by that release's
README. Cemu's Mac package is experimental, and DeSmuME's Linux route is a source
build. Historical yuzu, Ryujinx and Citra references offer no current downloads.

Run `node scripts/archive-pc-emulators.cjs` to inspect the selected asset jobs.
`--download` imports one appropriate Windows release per desktop project. It
first reuses an existing file only when the exact source URL and a fresh SHA-256
match. Missing builds come from the observed release assets, not repository
clones, debug-symbol archives or every operating-system variant. `--only=id,id`
limits a retry. Production archive writes require normal F: permission tooling.

The importer preserves each original, verifies ZIP/7z integrity and paths with
the installed 7-Zip parser, checks that ready Windows executables are present,
or verifies PE signatures for installers. It never executes those programs.
Ready builds are recorded in `docs/pc-emulators-private-inventory.json` through
`console-expansion-archive.cjs`. The coordinating chat merges that scoped intake
and refreshes the archive index. No other inventory is overwritten by this
importer.

Public metadata is `docs/pc-emulator-downloads.json`. Files smaller than 95 MiB
also receive exclusive, hash-verified mirrors in `downloads/archive/pc-emulators`.
Larger packages remain in F: with the original publisher download on the site.
Signed redirect query strings and private archive/staging paths are omitted
from public metadata. Failed transfers are recorded truthfully; incomplete
staging files are preserved and never offered as ready downloads.

After an import, run the scoped builder and
`node scripts/verify-pc-emulators.cjs`. This verifies catalogue host modes,
established anchors, structured-data links, images, video exclusion from main
content, and each new F:/public file's size and SHA-256. Browser QA should check
OS filtering, packaged-only filtering, search/reset and phone overflow.
