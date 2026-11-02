# Documentation index

## Console reader guides

- [Start with your console](guides/README.md)
- [PS4 downloads, storage and file management](guides/ps4-console-downloads.md)
- [PS5 downloads and payload handling](guides/ps5-console-downloads.md)
- [File formats and archive extraction](guides/console-files-and-archives.md)
- [PS4 LaunchPad and PS5 Payload Manager / autoload](host-payload-management.md)

The website also has separate [PS3 downloads](../console/ps3/downloads.html) and
[Nintendo Switch homebrew](../console/nintendo-switch.html) pages. Their builds
and installation requirements are separate from PS4/PS5.

## Maintainer runbooks

- [PS4 / PS5 host actions and compatibility](host-dashboard.md)
- [Other-game host trainers and exact game builds](host-extra-game-trainers.md)
- [Desktop payload sender setup](host-payload-sender.md)
- [Console service interfaces and sources](host-console-services.md)
- [Check and save newer homebrew/app versions](local-download-updates.md)
- [Local download archive and preservation](download-archive.md)
- [PS3 local archive access](ps3-archive-server.md)
- [Runtime languages and dynamic UI translation](i18n-runtime.md)
- [Add a language](../languages/ADDING-A-LANGUAGE.md)

Source/build scripts live in [scripts](../scripts/). Follow [AGENTS.md](../AGENTS.md)
for every new downloadable build: preserve all prior files, keep ready builds
apart from source/helpers, record URL/version/size/SHA-256, and do not execute
downloaded payloads.

Updated 2 November 2026.
