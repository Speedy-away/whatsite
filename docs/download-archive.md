# Download archive

The local archive is `F:\whatsite-backup-downloads-etc`. It contains menus,
scripts, tools and source archives. Full games, firmware and OS distributions
are excluded. Bstlar links are also excluded at the user's request.

Files are saved without execution. Original source URLs, byte counts and
SHA-256 hashes are recorded in the private inventory. Public site metadata
contains only the original public URLs and downloadable file information.

The site's [Download Library](../downloads/index.html) offers verified local
mirrors. Larger files remain in the F: archive and use their original publisher
pages online. Site mirrors have a 780 MiB budget, with an individual-file limit
below 95 MiB, to leave room for the rest of the GitHub Pages site.

Before committing downloaded files, run the read-only size check:

```powershell
node scripts/check-git-file-sizes.cjs
```

It checks tracked files and unignored additions against the 95 MiB per-file
ceiling. The root `tmp/` folder and the oversized originals listed in
`.gitignore` are local working files. Public download builders use
`scripts/download-mirror-policy.cjs` to keep missing or oversized files out of
active mirror links and retain their exact publisher or original-source links.
The private inventory retains the archive paths, versions, byte counts and
SHA-256 hashes. Removing a redundant site copy must first verify its archived
copy; never remove the archived original.

This check covers individual files. It does not enforce the total hosting
budget. The 2 November 2026 cleanup removed the twelve oversized site copies
reported by GitHub Desktop and excluded temporary working files; the remaining
Git-eligible files still total about 13.2 GiB. Overall hosting-size reduction is
separate from that cleanup. See `docs/qa/github-large-file-cleanup.json`.

## Routine release updates and index refresh

Run from the repository root. A check-only request uses `--check`; an authorized
request to save newer builds uses `--download`:

```powershell
node scripts/update-local-downloads.cjs --check
node scripts/update-local-downloads.cjs --download
node scripts/refresh-local-download-index.cjs --check
node scripts/refresh-local-download-index.cjs --write
```

Do not run both update modes merely to satisfy this example: choose the mode the
user requested. After downloads, the metadata-only index refresh merges records
and retains previous metadata. It does not move, replace or delete payload
files. It records missing files without deleting their inventory history and
does not present them as available download links.

See [the complete update runbook](local-download-updates.md) for repository
filters, release revisions, required hashes and preserving website compatibility
pins. Refreshing archive metadata does not automatically change a public
catalogue's pinned build.

## Bulk acquisition and website catalogues

`scripts/archive-site-downloads.cjs` is the older bulk-acquisition workflow. It
is not required for an ordinary check of newer app releases. The legacy
`finalize-download-archive.cjs` workflow can reorganize or replace outputs; do
not use it as a routine preservation-safe update command.

Use the platform-specific importer/catalogue builder for an authorized new
collection, retain every older file and source URL, and inspect its operations
before running it alongside other download jobs. Do not run an organization
command that moves archive files while another job is saving them.

When an approved page changes from an original publisher link to a local mirror,
retain its public source attribution, the original URL and exact compatibility.
Run the targeted page builder and `node scripts/audit-site.cjs` after the new
local files are available. A failed acquisition must not leave an active button
pointing at a nonexistent local download.

For the Steam Deck collection, use the bounded Linux build/installer list:

```powershell
node scripts/archive-steamdeck-tools.cjs --check
node scripts/archive-steamdeck-tools.cjs --download
node scripts/refresh-local-download-index.cjs --write
```

The Steam Deck importer reads `docs/steamdeck-download-jobs.json`, keeps older
files, and records hashes without executing downloads. Desktop and Flatpak
reference files are online installers, stored separately from Linux builds.

The backup's `index.html`, `README.txt`, `download-inventory.json`,
`unavailable-downloads.csv` and `CHECKSUMS.sha256` explain what was saved and
which original links still need manual retrieval. Download failures do not
prove a project is discontinued. Temporary browser imports and machine-specific
audit reports are ignored by Git.
