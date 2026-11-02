# PS Vita library

Canonical page: `console/psvita/library.html`. Rebuild only this page with
`node scripts/build-vita-more.cjs`; it imports the shared page helper without
running its broad build. Existing Vita jailbreak, CFW, apps and hub pages are
owned separately and remain intact.

The `vita-more-catalogue.json` file contains user-facing setup and exact
compatibility notes; `vita-more-jobs.json` pins the author assets;
`vita-more-files.json` holds safe public mirror/hash/image metadata. The private
F: inventory and immutable intake events are intentionally separate from the
global inventory. The verified sidecar is now integrated into both global
inventories, and the organized index and checksum list are refreshed. Future
new files still require the preserving intake merge and an index refresh after
concurrent writers finish. The hub navigation and library card are retained by
`scripts/build-vita-guides.cjs`.

`prepare-vita-more.cjs` requires network access and normal approval for F:
writes. It downloads only the explicit ready assets, inspects them with the
installed 7-Zip, preserves originals and archives through
`console-expansion-archive.cjs`. Downloaded builds are never executed.
`prepare-vita-more-artwork.cjs` saves original project screenshots with credits.
`finalize-vita-more-data.cjs` records the inspected theme preview and pinned
Daedalus paths. No source repository archive is downloaded.

Verify with `node scripts/verify-vita-more.cjs`. HTTP verification uses the
isolated QA server `node scripts/serve-vita-more-preview.cjs 8767` followed by
`node scripts/verify-vita-more-http.cjs`. Browser evidence and screenshots are
under `docs/qa/vita-more-*`; complete scope/integration details are in
`docs/chat-handoffs/vita-more.json`.
`node scripts/verify-vita-more-integration.cjs` checks the hub links, both global
inventories, every Vita archive hash, and the organized index/checksum entries.

Nightly tags can move. The Daedalus pair is the 2026-10-12 fb7238e build retrieved
on 2 November 2026, each pinned by SHA-256. New bytes must receive a distinct
snapshot/version record and preserve this pair. Jump ’n’ Bump and Enigma have
Vita-specific versions lower than the latest multi-platform release tags.
