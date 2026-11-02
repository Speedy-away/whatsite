# Switch homebrew archive

The selected catalogue is `docs/switch-homebrew-catalog.json`. Its exact store
packages come from the Nintendo Switch repository linked by
[Homebrew App Store](https://hb-app.store/), with pinned official release NROs
where the project documents a standalone build. This catalogue is a curated
snapshot, not a claim that every upstream release or every firmware is supported.

```powershell
node scripts/archive-switch-homebrew.cjs --check
node scripts/archive-switch-homebrew.cjs --download
node scripts/refresh-local-download-index.cjs --write
```

`--check` validates the explicit jobs without downloading or writing files.
`--download` requires permission to write to
`F:\whatsite-backup-downloads-etc`. It preserves the store ZIP before inspecting
its member paths, expanded size, CRC checksums and NRO headers. The store's
captured package checksum is checked, and every saved file receives a SHA-256.
No console build, payload or bundled script is executed.

Original containers always stay in the F: archive. A standalone NRO is published
when the catalogue documents that installation and the inspected package has no
required companion files; documented official standalone release NROs are also
eligible. Other packages retain their complete SD-card layout as ZIP downloads.
Source archives and desktop/mobile variants are not acquired by this importer.

The scoped public directory is `downloads/nintendo-switch/`, with a 384 MiB
collection budget and a per-file limit below 95 MiB. These are additional scoped
limits; existing public download collections and their files are preserved. The
original source URL remains available when a file is not mirrored. The manifest
`docs/switch-homebrew-downloads.json` records the mirror policy, exact paths,
versions, sizes, SHA-256 values and inspected ZIP members.

The initial 2 November 2026 import saved all 14 selected apps successfully: 24
unique archive files (including every original store container), with 16 public
files totalling 141,098,353 bytes. Every recorded public and archived file was
read back and checked against its SHA-256. The full archive metadata refresh
reported zero missing file paths. These are file-integrity and structure checks;
physical-console installation and execution were not tested.

Every import merges its scoped items into the latest on-disk inventories, keeps
older versions and different files, and snapshots prior inventories. Existing
identical files can be reused; differing content receives a hash-qualified name.
No broad site rebuild or download-library regeneration is needed.
