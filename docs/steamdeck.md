# Steam Deck collection

Edit `steamdeck-resources.json` for the current tool groups, cards, official
destinations, guide associations and archive job IDs. Edit
`steamdeck-setup-guides.json` for the walkthroughs and their primary references.
The additions JSON files are research snapshots, not build inputs.

Rebuild and check only this page:

```powershell
node scripts/build-steamdeck.cjs
node scripts/update-page-metadata.cjs --page console/steamdeck.html
node scripts/build-steamdeck-topics.cjs
node scripts/build-steamdeck.cjs --check
node scripts/update-page-metadata.cjs --page console/steamdeck.html --check
node scripts/audit-site.cjs
```

The builder preserves the shared header, navigation, background, advertisement,
footer and mobile integrations. Counts come from the catalogue. Search uses the
shared controller; guide links reveal native details through `assets/steamdeck.js`.

Add downloads to `steamdeck-download-jobs.json` without changing older versions.
Select just the new IDs when acquiring more files:

```powershell
node scripts/archive-steamdeck-tools.cjs --check --id=NEW-ID
node scripts/archive-steamdeck-tools.cjs --download --id=NEW-ID
node scripts/refresh-local-download-index.cjs --write
```

Normal F: write permissions apply. The importer keeps older files and verifies
published sizes and hashes. Flatpak references and desktop files are online
installers, kept under Helpers/Linux; application builds and Decky plugin bundles
are kept separately. Decky store ZIPs are checked against the store's published
SHA-256. Never execute acquired files as part of this workflow.
