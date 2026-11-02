whatwhatboy PS5 site shortcut — 2026.11.02.1

This original icon and param.json target https://whatwhatboy.com/console/ps5/.
Title ID: WHAT00001. Media category: 65536.
The generated debug PKG contains an intentionally empty eboot.bin because the
system uses deeplinkUri to open the browser. It needs compatible homebrew access
and a package installer. This is not a retail/stock-console PWA install.

Build source and documented mechanism:
https://github.com/kvnhrt/ps5-browser-app/tree/d427877157b5ffdf90847a0c3ad54c7025100f55
Packer: LibProsperoPkg 2.6.0 (GPL-3.0-or-later).
Icon: original whatwhatboy site artwork; vector master icon0.svg, PNG icon0.png.

Reproduce from the website checkout with Node and .NET SDK 9:
  node scripts/prepare-ps5-site-launcher.cjs --fetch-tools
The script downloads only the packer source files, keeps them in ignored
docs/tmp/, applies the recorded .NET 9 compatibility edits, and never runs a
console payload. Source tools and console-ready packages stay separate.

The build is immutable: an existing PKG is never overwritten. To inspect the
saved package and refresh its provenance record without repacking:
  node scripts/prepare-ps5-site-launcher.cjs --record-existing

For a new version, choose a new version/output path in the build script before
building. Preserve the existing package and archive inventory.

Verification: package structure, embedded URL, title ID, Media category and icon
hash were checked. Physical PS5 installation and launch were not tested.
