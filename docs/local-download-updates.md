# On-demand homebrew and app updates

Use this runbook when asked to check or download newer recorded console tools.
Run commands from the repository root. The source of truth is
[AGENTS.md](../AGENTS.md); the private inventory is
`docs/download-audit.json`, and ready builds are retained in
`F:\whatsite-backup-downloads-etc`.

## Check versions first

Check recorded console projects without writing downloaded files or F: metadata:

```powershell
node scripts/update-local-downloads.cjs --check
```

Limit the request to one project already recorded in the selected inventory:

```powershell
node scripts/update-local-downloads.cjs --check --repo=bucanero/apollo-vita
```

The updater discovers GitHub releases from recorded source URLs. A source-only
repository or a release with no matching build is reported as such. A successful
check establishes what the publisher currently offers; it does not establish
compatibility with every console firmware or game update.

## Save newer builds

For an authorized download request, save newer ready-to-use release assets and
retain all older versions:

```powershell
node scripts/update-local-downloads.cjs --download
```

A bounded update can use the same repository filter:

```powershell
node scripts/update-local-downloads.cjs --download --repo=bucanero/apollo-vita
```

`--all-tools` explicitly broadens the recorded scope to desktop tools and helper
variants. It should not be the default for a console-only request:

```powershell
node scripts/update-local-downloads.cjs --check --all-tools
```

Do not create a scheduled monitor unless the user asks for one. These commands
run on demand and do not execute downloaded apps, packages or payloads.

## Record and preserve each build

For every saved release, retain its source URL, release tag/version, byte count
and SHA-256 in the inventory. Compare available publisher digests. A checksum
confirms the identity of the saved file; compatibility still comes from the
release notes and the exact platform guide.

Use [download-archive-layout.cjs](../scripts/download-archive-layout.cjs) for the
platform, project, role and version layout. Keep these roles distinct:

- **Builds:** ready console files or complete release bundles containing them.
- **Helpers:** Windows, Linux, macOS or mobile tools needed alongside a console.
- **Source Code / Development:** source archives, SDKs and development material.
- **Metadata:** manifests, checksums and other non-executable release records.

Prefer relevant release assets rather than cloning whole repositories or
downloading every operating-system variant. Download a source archive only when
that is the requested item. Preserve the original ZIP/RAR/7z when preparing
inspected ready files; keep required accompanying files and layout intact.

Never replace a different file at an existing destination, delete an older
version, discard duplicate versions or rename an archive extension to make it
appear to be another format. A changed release or nightly needs a distinct saved
revision. Interrupted and failed downloads must remain distinguishable from
verified complete builds.

## Refresh the organized archive index

After successful downloads, use the metadata-only refresh:

```powershell
node scripts/refresh-local-download-index.cjs --check
node scripts/refresh-local-download-index.cjs --write
```

The write command merges workspace and backup records, retains previous metadata
under the backup's history directory, and refreshes the readable index,
inventory, checksum list and unavailable-downloads CSV. It does not move,
replace, execute or delete downloaded payload files. Its checksum index uses
recorded digests; a metadata refresh is not a fresh rehash of every binary.

Routine release updates do not need the legacy bulk-acquisition/finalization
pipeline. Do not use `finalize-download-archive.cjs` as a routine update step, or
run organization/move operations while other download jobs are writing files.

## Review before changing website downloads

Downloading a new build is separate from publishing it in a platform catalogue.
Keep existing links pinned to their documented game update, title ID, firmware
and loader until the new build's requirements have been checked. A newly
released version is not permission to silently replace a compatibility-specific
entry.

For an approved catalogue change, update its platform-specific source data and
builder, retain its archived predecessor, then run the relevant targeted build
and link/asset checks. The public catalogue must not contain F: paths, missing
local-file buttons or a claim that an archive-only download is ready to run.

## Sources requiring manual review

MediaFire, GoFile, store catalogues and other publisher pages do not all provide
a GitHub release feed. Review their original pages when they appear in the
updater's manual-source report. Record blocked, missing or inaccessible links
truthfully rather than assigning an invented version or download URL. Bstlar
downloads remain skipped unless explicitly requested.

Download-mode reports are retained under the backup's `updates` directory. If a
file or publisher is unavailable, keep the failure record and existing working
versions. Do not run a downloaded payload to test it.

## Reader guides

- [PS4 console downloads and files](guides/ps4-console-downloads.md)
- [PS5 console downloads and payloads](guides/ps5-console-downloads.md)
- [Console files and archive extraction](guides/console-files-and-archives.md)
- [Archive layout and refresh](download-archive.md)
