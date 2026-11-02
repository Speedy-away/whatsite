# Console theme hub

The shared landing page is `/console/themes.html`. Rebuild only this page with:

```powershell
node scripts/build-console-themes.cjs
```

The builder reads `docs/themezer-switch-catalog.json`, `docs/themezer-3ds-catalog.json`, `docs/themezer-wiiu-catalog.json` and `docs/themezer-ps3-catalog.json`. Those catalogues and their console pages belong to the separate console chats. Refresh the hub after their catalogue or archive updates. It does not invoke a broad console build or modify a catalogue, archive, sitemap or shared navigation source.

Each catalogue supplies `themes` with `id`, `title`, `author`, `sourceUrl`, `image`, `version`, `requirements` and optional `localDownload`, `bytes`, `type`, `description`. Array catalogues and `items` are accepted too. The catalogue filename supplies the physical target console; a theme called SWITCH2, PS5 Theme or Wii Theme does not select a different hardware target. The source title, author and requirements are escaped before rendering.

Local theme/download URLs appear only when the file exists inside the workspace. Preview images can be local files or HTTPS images from the verified Themezer image/CDN hosts. Source links require HTTPS. Files, their original containers and F: archive metadata remain owned by the console importers. The shared hub does not initiate new downloads or expose private backup paths. Its download buttons reuse the ready files generated and archived by those importers.

The console pages are linked only when they exist:

- `/console/nintendo-switch/themes.html`
- `/console/retro/3ds-themes.html`
- `/console/retro/wiiu-themes.html`
- `/console/ps3/themes.html`

The external Themezer collections remain useful while a local collection is being refreshed. All four platforms have separate installation references. The hub has no tutorial videos or video embeds.

Filters support shareable `console`, `q` and `kind` query parameters. Search combines title, creator, style, features, tags and requirements. Without JavaScript every theme remains visible. With JavaScript the labelled controls expose a live result count, a zero-results state and a clear action. Clear explicitly resets controls before recalculating, because running an update in a reset-event microtask happened before native form reset in browser QA.

Presentation lives in `assets/console-themes.css` and `assets/console-themes.js`. The page uses the existing guide shell, i18n v3, mobile integration and shared background settings. Generic guide-page generation marks the PC link active for unknown console routes, so this scoped builder clears that active marker in its own output and opens the Console group.

## Source review

The following primary pages were opened on 2 November 2026:

- [Themezer](https://themezer.net/) — actual platform hub links and console-specific tool names.
- [Switch packs](https://themezer.net/switch/packs) and [Switch themes](https://themezer.net/switch/themes).
- [3DS/2DS themes](https://themezer.net/3ds/themes) and [theming tools](https://themezer.net/3ds/faq/what-are-the-best-theming-tools).
- [Wii U themes](https://themezer.net/wiiu/themes) and [Theme Café requirements](https://themecafe.github.io/Docs/faq/).
- [PS3 themes](https://themezer.net/ps3/themes) and [Sony Theme Settings](https://manuals.playstation.net/document/en/ps3/current/settings/themesettings.html).
- [NH Switch Guide: NXTheme Installer](https://switch.hacks.guide/homebrew/nxtheme-installer).

The catalogue importers retain the theme-specific provenance and archive hashes. Hub browser screenshots are `docs/screenshots/console-themes-desktop.jpg` and `docs/screenshots/console-themes-mobile.jpg`; the static integrity report is `docs/qa/console-themes-verification.json`. These verify website behavior and local file metadata, not physical console installation or theme execution.
