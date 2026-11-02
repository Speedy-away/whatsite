# Shared console-expansion archive intake

`scripts/console-expansion-archive.cjs` is for the new scoped console chats.
It does not change the older download scripts, download anything, inspect a
website, or execute a downloaded build. Importing the module writes nothing.
Production defaults are this checkout and `F:/whatsite-backup-downloads-etc`.
Every actual F: write still requires normal sandbox escalation by the caller.

## Recommended flow for each chat

1. Download only the relevant official release/ready build into your own staging
   folder. Verify its console format and dependencies without executing it.
2. Archive it through `archiveFile` or `writeBytes`. Each call preserves the F:
   build and records a durable scoped sidecar. It does **not** merge globals.
3. Use the returned `publicFile` fields in your public catalogue. Those fields
   contain no machine-specific archive or staging paths.
4. Merge the sidecar when ready, or let the coordinating chat perform the final
   `--all` merge after other inventory writers have finished.

```js
const {createArchive} = require('./scripts/console-expansion-archive.cjs');
const archive = createArchive();

const result = await archive.archiveFile({
  scope: 'psp-expansion',
  item: {
    id: 'psp-expansion-example-app', // Every id starts with scope + '-'.
    title: 'Example App',
    url: 'https://github.com/example/app',
    platform: 'PSP',
    category: ['Tools'],
    pages: ['console/retro/psp.html']
  },
  file: {
    name: 'ExampleApp.zip',
    sourceUrl: 'https://github.com/example/app/releases/download/v1.2/ExampleApp.zip',
    version: 'v1.2',
    archiveRole: ['Builds']
    // Optional: expectedBytes, expectedSha256, format, compatibility, derivedFrom.
  },
  sourceFile: 'C:/path/to/your/staged/ExampleApp.zip'
});
// result.file: private archive metadata (includes backupPath).
// result.publicFile: name/version/bytes/sha256/sourceUrl/archiveRole, safe for site JSON.
// result.inventory: .../docs/psp-expansion-private-inventory.json
```

`archive.writeBytes({scope,item,file,bytes:buffer})` has the same result and is
useful when the downloader already has a bounded Buffer. `archiveFile` streams
the file, rechecks its content during copying and refuses to inventory a source
that changed while it was being copied. Build files use exclusive creation;
identical existing bytes can be reused. Different bytes receive a hash suffix
and never replace a different destination. Failed partial copies are preserved
and reported as `error.preservedPartialPath`, rather than inventoried as ready.

Use explicit `platform` and `category`; for a game mod use, for example,
`category: ['Games', 'Mario Kart 8 Deluxe', 'Mods']`. All destinations come from
`download-archive-layout.cjs`. Keep `file.version` truthful, including named or
dated snapshots. `archiveRole: ['Source Code']` is for specifically requested
source archives. Desktop helpers use roles such as `['Helpers','Windows']`;
console-ready files use `['Builds']`. If omitted, the established layout helper
classifies the role from the item/file. A version change never replaces an old
version. Do not execute builds to verify them.

## Existing scoped downloaders

A chat may keep its own downloader and append verified records through:

```js
await archive.appendInventory({
  scope: 'psp-expansion',
  items: [itemWithFilesAndAttempts],
  publicFiles: [safePublicMetadata]
});
```

Each ready file must include `name`, `backupPath` inside the F: archive,
`sourceUrl` (or `resolvedUrl`), `version` (or `releaseTag`), `bytes` and `sha256`.
The item still needs the scope-prefixed id, title, platform and category.
Unavailable links belong in truthful item status/attempt records with no fake
file metadata. Do not put credentials or private links into publicFiles.

Directly authored intake JSON also works:

```json
{
  "schemaVersion": 1,
  "scope": "psp-expansion",
  "items": [],
  "publicFiles": []
}
```

Save it as `docs/psp-expansion-private-inventory.json`. The CLI validates incoming
file containment, existence, recorded byte counts and required source/version/
hash metadata. `--verify` also streams every incoming artifact's SHA-256 before
taking either coordination lock.

## Merge commands

```powershell
# Read-only validation; no network or writes.
node scripts/console-expansion-archive.cjs --inventory=docs/psp-expansion-private-inventory.json --check

# Merge this sidecar AND all other cooperating sidecars/events already present.
node scripts/console-expansion-archive.cjs --inventory=docs/psp-expansion-private-inventory.json

# Coordinator's final union after concurrent legacy writers finish.
node scripts/console-expansion-archive.cjs --all --verify
```

API equivalent:
`await archive.mergeInventory({inventory:'docs/psp-expansion-private-inventory.json',verifyFiles:true})`.
Omit `inventory` to merge all discovered sidecars/events. Use `checkOnly:true`
for read-only validation. There are no CLI options that silently change the
production archive root. `createArchive({workspaceRoot,backupRoot})` overrides
exist for isolated workspace test fixtures only.

## Concurrency and recovery

The helper uses short exclusive `.console-expansion-intake.lock` tokens in both
the workspace and F: root during global merging. Sidecar materialization uses
only the workspace token. No network or build hashing occurs while these locks
are held. A busy lock retries for up to 30 seconds, then asks the caller to retry;
the helper never breaks an existing writer's lock automatically. After a crash,
the coordinator can inspect its PID/token and remove only a proven stale lock.

Each append first writes an immutable intake event beneath
`docs/.console-expansion-private-inventory/<scope>/`. Scoped sidecars are unions,
not replacement inventories. The merge unions all sidecars and their immutable
events with both latest global inventories, preserves file/version/source rows
and unrelated top-level sections, rereads before each atomic rename, and saves
old metadata plus the final union beneath
`F:/whatsite-backup-downloads-etc/archive-history/console-expansion-intake/`.
These helper snapshots are included in later merges for recovery.

Older archive tasks do not honor this new lock. They can still overwrite a
materialized global file after a cooperating merge. The immutable sidecars and
snapshots retain the intake, so run the final `--all --verify` after those writers
finish. A lock cannot make an uncooperative writer transactional. Do not remove
sidecars/events before that reconciliation.

Scoped sidecars, immutable private intake events and lock tokens are ignored by
Git. No source download or archived build is deleted by intake or reconciliation.
