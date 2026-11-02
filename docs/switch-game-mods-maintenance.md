# Switch game mods

Build only this page with `node scripts/build-switch-game-mods.cjs` (export:
`buildSwitchGameMods`). Canonical path: `/console/nintendo-switch/mods.html`.
The parent Switch builder owns navigation and sitemap integration.

The catalogue is `docs/switch-game-mods-catalog.json`. Pinned release jobs are
in `docs/switch-game-mods-jobs.json`. Official project metadata and the CTGP
publisher source are recorded in the scoped research/evidence JSON files.
Run `node scripts/prepare-switch-game-mods.cjs` only when intentionally
regenerating the selected jobs from that checked evidence snapshot.

Download in separate, serialized archive passes:

```powershell
node scripts/archive-switch-game-mods.cjs --check
node scripts/archive-switch-game-mods.cjs --download
node scripts/archive-switch-game-mods.cjs --check --large-only
node scripts/archive-switch-game-mods.cjs --download --large-only
node scripts/refresh-local-download-index.cjs --write
node scripts/build-switch-game-mods.cjs
node scripts/verify-switch-game-mods.cjs
node scripts/audit-site.cjs
```

Downloads and index refresh require normal sandbox approval for the authorized
F: archive. `--check` is read-only. The large-only pass streams the complete HDR
Switch package and CTGP Deluxe privately, up to 5 GiB per file. The CTGP job uses
the exact Drive file linked by the publisher and its public large-file download
confirmation; it does not use credentials or bypass authentication/CAPTCHA.
Original publisher URLs remain visible on the public page. Large packs are not
mirrored onto the site. `--id=ctgp-deluxe` can narrow a large-only retry.

Archive paths use `download-archive-layout.cjs`, with platform `Nintendo Switch`
and game-specific folders. Original containers and all versions are kept.
Different existing files are never overwritten. The downloader streams hashes,
checks captured release sizes/SHA-256 values when available, validates bounded
ZIP paths/CRCs and NRO/IPS signatures for small files, and lists large ZIP
directories using the installed 7-Zip without extracting or running their
contents. Failed partial large files stay preserved for diagnosis. Inventory
snapshots precede writes and the latest inventory is reread before every merge.

Skyline plugin NROs on this page belong inside the game's plugins path, not the
ordinary hbmenu applications folder. The HDR launcher is a game-loaded component;
the complete HDR pack is the first-install download. Smashline 1.6.8 and 2.0.0
are preserved alternatives because the newer API can break older moveset mods.
Do not silently upgrade a compatibility-specific link. CTGP Deluxe 1.1.1 stays
pinned to Mario Kart 8 Deluxe 3.0.3, independently of the GB country patches for
3.0.5 and 4.0.0.

No downloaded mod is executed. Physical Switch installation is not claimed.
