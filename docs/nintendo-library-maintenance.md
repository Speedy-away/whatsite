# Nintendo Switch and Wii U library

`node scripts/build-nintendo-library.cjs` rebuilds the Switch apps page, Switch
game-mods page, Wii U page and Retro landing. It keeps the existing Switch hub
and console index, updates only its managed navigation blocks, and adds missing
canonical URLs to the current sitemap. It does not rebuild other platforms,
change language dictionaries or publish the site.

Public entry points:

- `/console/nintendo-switch/apps.html`: 28 selected apps, including five
  emulators and nine homebrew games. `?category=Emulators#apps` opens the emulator
  filter; `?category=Homebrew%20games#apps` opens the games filter.
- `/console/nintendo-switch/mods.html`: 13 game mods, packs and required tools
  for Mario Kart 8 Deluxe, Super Smash Bros. Ultimate and Super Mario Odyssey.
- `/console/retro/wiiu.html`: 16 native Wii U apps, plugins, games and emulators.

The catalogue JSON files are the normal builder inputs. The scoped preparation
scripts are for intentionally refreshing the checked source evidence, rather
than every HTML build. Retain pinned compatibility when updating a catalogue.
Switch NROs and game plugins, Wii U WUHB/RPX apps, Aroma WPS/WMS files and
desktop/mobile helpers use distinct formats and installation paths.

Run archive writes in sequence with normal sandbox approval for F:

```powershell
node scripts/archive-switch-homebrew.cjs --download
node scripts/archive-wiiu-homebrew.cjs --download
node scripts/archive-switch-game-mods.cjs --download
node scripts/archive-switch-game-mods.cjs --download --large-only
node scripts/refresh-local-download-index.cjs --write
node scripts/build-nintendo-library.cjs
node scripts/verify-switch-homebrew.cjs
node scripts/verify-wiiu-homebrew.cjs
node scripts/verify-switch-game-mods.cjs
node scripts/audit-site.cjs
```

The archive scripts inspect data without executing it, preserve original
containers and every existing version, and use `download-archive-layout.cjs`.
The large-mod pass streams complete HDR and CTGP packages to the private F:
archive, retaining their publishers' download links on the public page. These
packs need their complete resources; their small plugin files are not complete
first installations. The public site mirrors the smaller ready console builds.

CTGP Deluxe 1.1.1 requires MK8 Deluxe 3.0.3. The selected country patches instead
target exact 3.0.5 and 4.0.0 build IDs. Smashline 1.6.8 and 2.0.0 are alternative
API generations. The PPSSPP Switch port has an explicit upstream current-OS
limitation. Wii U cards separate current Aroma apps from legacy RPX/HBL routes.
Do not remove these distinctions during a general version refresh.

All new pages load the existing language runtime and contain no embedded
videos. Browser QA covers filter counts, empty results, group headings, file
details and narrow viewports. File/header/hash checks do not establish physical
console installation or execution. Verification results and screenshots are
saved under `docs/qa/` and `docs/screenshots/`.
