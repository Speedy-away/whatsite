# Local download panel

Double-click **Add-Downloads.bat** in the repository root. It starts a local
server and opens the panel in your browser. Keep the launcher window open;
Ctrl+C stops it. Node.js 22 or newer must be installed.

1. Choose a site section (PS4, PS5, PS3, Free cheats, etc.), a download type,
   and an existing destination page. Search by game name or page path.
2. Enter the title, description and exact release version.
3. Browse for an image, paste a local image path, or enter an HTTPS image URL.
   Local images are copied to `assets/images/download-panel/`; URL images
   remain remote. Originals stay in place. Supported local formats: PNG, JPG,
   WebP, GIF and AVIF, up to 12 MiB.
4. Paste the original version-specific release asset or publisher download URL.
   The panel downloads that file for the archive. If the URL requires a browser,
   browse for the ready-to-use download or paste its full local path instead.
   The source URL and release version are still required.
5. Enter any confirmed game update, firmware, region/title IDs and PS3 DEX/HEN
   variant. Unknown fields can stay blank. Add DEX and HEN builds separately;
   add a MultiCOD resource to each source-confirmed game's page separately.
6. Save. Open the updated local page using the link in the result message.

The archive drive must be connected at `F:/whatsite-backup-downloads-etc`.
Files use the existing `download-archive-layout.cjs` folder rules. The existing
archive helper records the original source, version, byte size and SHA-256 in
its private sidecar and merged inventories. The archive index is refreshed;
its previous HTML is preserved in `archive-history/download-panel/`.
Existing downloads and versions are preserved. No downloaded file is executed.

Games, apps, homebrew and tools keep upstream links on their cards. Game mod
menus, cheats, scripts and payloads can optionally be copied into the site's
`downloads/panel/` folder. Downloads are limited to 4 GiB per file in this panel.
Bstlar is skipped by automatic downloading. For GitHub downloads, use relevant
release assets rather than repository links. Source-code archives have their
own download type and archive role.

Saved public entry data lives in `docs/download-panel-entries.json`, and cards
are rendered into a dedicated download section of the selected page. Added
downloads in the panel lists these entries; it does not import or replace the
existing site catalogue. The common page generator and Pages packaging reapply
the saved entries after rebuilds. For a different standalone generator, refresh
the local HTML afterwards with:

```powershell
node scripts/download-panel-data.cjs
```

Local uploads, page/manifest recovery snapshots and the save lock live in the
Git-ignored `.tmp/download-panel/` folder. Failed downloads and copies are not
silently deleted. If a launcher crashes while saving, stop every panel process
before inspecting and removing its stale `save.lock`. Opening multiple panels
cannot overwrite a save already in progress.

The server binds to `127.0.0.1` on an available port and requires a per-session
token for its APIs. It is a local authoring tool; its launcher and server/UI
sources are excluded from the public Pages build. This panel saves changes
locally. Review and publish them using the normal Git/site workflow.
