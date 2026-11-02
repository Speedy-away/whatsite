# New console navigation integration

The shared Console sidebar now has source support for these routes:

- `/console/xbox-one-series.html` — Xbox One / Series X|S
- `/console/nintendo-switch-2.html` — Nintendo Switch 2

`scripts/integrate-console-platforms.cjs` changes only the Console sidebar rows.
It preserves the rest of every page, deduplicates relative and same-site absolute
destination links, and inserts the Xbox entry after Xbox 360 and Switch 2 after
the original Nintendo Switch. Existing platform pages and compatibility claims
are not rewritten by this integration.

Entries appear only when their destination page exists. A builder writing its
own new platform page can include its current route immediately. After both
content chats finish, run:

```text
node scripts/integrate-console-platforms.cjs --write
node scripts/integrate-console-platforms.cjs --check
node --test scripts/tests/console-platform-integration.test.cjs scripts/tests/console-platform-routes.test.cjs
```

The exports are `integrateConsolePlatforms({check:false})`,
`integratePageConsoleNav(file,html)` and `integrateConsoleList(fragment,options)`.
`sidebar-icons.cjs` calls the fragment integrator during decoration, and the
shared console `page()` writer applies sidebar decoration with the current file
before writing. This also corrects the generic builder's PC-active fallback for
the two new console families. A decoration without a current file preserves any
existing active state and remains idempotent.

The public page walker excludes download trees, except `downloads/index.html`.
Self-contained PS4/PS5 receiver companions are excluded by filename and embedded
receiver title/catalogue markers. Their actual bytes are covered by regression
tests; generated/copy-published download builds must never be globally rewritten.

The logo originals are retained under `assets/images/platform-logos/originals/`.
The Switch 2 sidebar uses a viewBox crop of Nintendo's actual Joy-Con-and-2
symbol, with the complete original wordmark retained. The combined Xbox entry
uses Microsoft's Xbox brand symbol; separate actual Xbox One and Series X|S
wordmarks are also available. Source URLs, transformations and hashes are in
`docs/platform-logo-sources.json`.

This integration performs no downloads of console software, F: writes, page
content generation, commits, deployment or publication.
